import { auth, PASSWORD_MAX, PASSWORD_MIN } from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import { db } from "#lib/server/db/index.js";
import { users, sessions, appSettings } from "#lib/server/db/schema.js";
import { seedDemo } from "#lib/server/db/seed.js";
import { fail, redirect } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";
import { and, eq, gt } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

// Demo mode also guards the shared `demo` account against self-modification. That
// check lives in the Better Auth `hooks.before` middleware (src/lib/server/auth.ts),
// so it covers these actions and the /api/auth/* endpoints alike.
const DEMO_MODE = process.env.DEMO_MODE === "true";

const defaultSettings: Record<string, string> = {
	siteName: "SvelteForge Admin",
	timezone: "UTC",
	defaultRole: "viewer",
	maintenanceMode: "false",
};

const notificationPrefKeys = [
	"notif_new_user",
	"notif_content_published",
	"notif_security_alert",
	"notif_system_warning",
	"notif_weekly_digest",
	"notif_maintenance",
];

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, "/login");
	const user = locals.user;

	// Load profile data (without password)
	const [profile] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
			role: users.role,
		})
		.from(users)
		.where(eq(users.id, user.id));

	// Load app settings (admin only)
	const settings = { ...defaultSettings };
	if (user.role === "admin") {
		const rows = await db.select().from(appSettings);
		for (const row of rows) {
			settings[row.key] = row.value;
		}
	}

	// Load active sessions for this user. The bearer `token` column is never sent to
	// the browser; revocation looks it up server-side by session id.
	const userSessions = await db
		.select({
			id: sessions.id,
			userAgent: sessions.userAgent,
			ipAddress: sessions.ipAddress,
			createdAt: sessions.createdAt,
			expiresAt: sessions.expiresAt,
		})
		.from(sessions)
		.where(and(eq(sessions.userId, user.id), gt(sessions.expiresAt, new Date())));

	// Load notification preferences (user-scoped keys)
	const notifPrefs: Record<string, boolean> = {};
	for (const key of notificationPrefKeys) {
		notifPrefs[key] = true; // default all on
	}
	const prefRows = await db.select().from(appSettings);
	for (const row of prefRows) {
		const userPrefKey = `${user.id}:`;
		if (row.key.startsWith(userPrefKey)) {
			const prefName = row.key.slice(userPrefKey.length);
			if (notificationPrefKeys.includes(prefName)) {
				notifPrefs[prefName] = row.value === "true";
			}
		}
	}

	return {
		profile,
		settings,
		isAdmin: user.role === "admin",
		isDemoMode: DEMO_MODE,
		sessions: userSessions,
		currentSessionId: locals.session!.id,
		notificationPrefs: notifPrefs,
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) redirect(302, "/login");
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}

		const newEmail = email.toLowerCase();
		let emailPending = false;
		try {
			await auth.api.updateUser({ body: { name }, headers: request.headers });
			if (newEmail !== locals.user.email) {
				// Unverified accounts switch immediately; verified ones get a confirmation link.
				await auth.api.changeEmail({
					body: { newEmail, callbackURL: "/settings" },
					headers: request.headers,
				});
				const updated = db
					.select({ email: users.email })
					.from(users)
					.where(eq(users.id, locals.user.id))
					.get();
				emailPending = updated?.email !== newEmail;
			}
		} catch (err) {
			return authFailure(err);
		}

		return { success: true, action: "profile", emailPending };
	},

	changePassword: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof currentPassword !== "string" || currentPassword.length < 1) {
			return fail(400, { message: "Current password is required" });
		}
		if (
			typeof newPassword !== "string" ||
			newPassword.length < PASSWORD_MIN ||
			newPassword.length > PASSWORD_MAX
		) {
			return fail(400, {
				message: `New password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`,
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		try {
			await auth.api.changePassword({
				body: { currentPassword, newPassword, revokeOtherSessions: false },
				headers: request.headers,
			});
		} catch (err) {
			if (isAPIError(err) && err.body?.code === "INVALID_PASSWORD") {
				return fail(400, { message: "Current password is incorrect" });
			}
			return authFailure(err);
		}

		return { success: true, action: "password" };
	},

	updateSettings: async ({ request, locals }) => {
		if (locals.user!.role !== "admin") {
			return fail(403, { message: "Admin access required" });
		}

		const formData = await request.formData();
		const siteName = formData.get("siteName");
		const timezone = formData.get("timezone");
		const defaultRole = formData.get("defaultRole");
		const maintenanceMode = formData.get("maintenanceMode");

		const entries: [string, string][] = [
			["siteName", typeof siteName === "string" ? siteName : "SvelteForge Admin"],
			["timezone", typeof timezone === "string" ? timezone : "UTC"],
			["defaultRole", typeof defaultRole === "string" ? defaultRole : "viewer"],
			["maintenanceMode", maintenanceMode === "on" ? "true" : "false"],
		];

		for (const [key, value] of entries) {
			await db
				.insert(appSettings)
				.values({ key, value, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: appSettings.key,
					set: { value, updatedAt: new Date() },
				});
		}

		return { success: true, action: "settings" };
	},

	revokeSession: async ({ request, locals }) => {
		if (!locals.user || !locals.session) redirect(302, "/login");
		const formData = await request.formData();
		const sessionId = formData.get("sessionId");

		if (typeof sessionId !== "string" || !sessionId) {
			return fail(400, { message: "Session ID is required" });
		}

		// Don't allow revoking current session via this action
		if (sessionId === locals.session.id) {
			return fail(400, { message: "Cannot revoke your current session. Use logout instead." });
		}

		// Scope the lookup to the current user so one user can't revoke another's session.
		const target = db
			.select({ token: sessions.token })
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), eq(sessions.userId, locals.user.id)))
			.get();

		if (!target) {
			return fail(404, { message: "Session not found" });
		}

		try {
			await auth.api.revokeSession({ body: { token: target.token }, headers: request.headers });
		} catch (err) {
			return authFailure(err);
		}
		return { success: true, action: "session" };
	},

	revokeAllOtherSessions: async ({ request }) => {
		try {
			await auth.api.revokeOtherSessions({ headers: request.headers });
		} catch (err) {
			return authFailure(err);
		}
		return { success: true, action: "sessions" };
	},

	resetDemo: async ({ locals }) => {
		if (!DEMO_MODE) {
			return fail(403, { message: "Demo reset is disabled on this instance" });
		}
		if (locals.user?.role !== "admin") {
			return fail(403, { message: "Admin access required" });
		}

		try {
			await seedDemo();
		} catch (err) {
			console.error("Demo reset failed:", err);
			return fail(500, { message: "Reset failed — check server logs" });
		}

		return { success: true, action: "resetDemo" };
	},

	updateNotificationPrefs: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = locals.user!.id;

		for (const key of notificationPrefKeys) {
			const value = formData.get(key) === "on" ? "true" : "false";
			const settingKey = `${userId}:${key}`;

			await db
				.insert(appSettings)
				.values({ key: settingKey, value, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: appSettings.key,
					set: { value, updatedAt: new Date() },
				});
		}

		return { success: true, action: "notifications" };
	},
};
