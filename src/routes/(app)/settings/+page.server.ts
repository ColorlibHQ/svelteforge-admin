import { invalidateSession } from "#lib/server/auth.js";
import { db } from "#lib/server/db/index.js";
import { users, sessions, appSettings } from "#lib/server/db/schema.js";
import { seedDemo } from "#lib/server/db/seed.js";
import { fail, redirect } from "@sveltejs/kit";
import { hash, verify } from "@node-rs/argon2";
import { eq, and, ne } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

const DEMO_MODE = process.env.DEMO_MODE === "true";

// In demo mode, the public 'demo' account is shared by every visitor. If any
// visitor renames it, changes its email, or rotates its password, everyone
// else gets locked out until the hourly reset. Block self-modification of
// that account so the demo stays usable between resets.
function isProtectedDemoUser(username: string | undefined): boolean {
	return DEMO_MODE && username === "demo";
}

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

	// Load active sessions for this user
	const userSessions = await db
		.select({
			id: sessions.id,
			userAgent: sessions.userAgent,
			ipAddress: sessions.ipAddress,
			createdAt: sessions.createdAt,
			expiresAt: sessions.expiresAt,
		})
		.from(sessions)
		.where(eq(sessions.userId, user.id));

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
		if (isProtectedDemoUser(locals.user?.username)) {
			return fail(403, { message: "The shared demo account cannot be modified" });
		}

		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}

		try {
			await db
				.update(users)
				.set({ name, email: email.toLowerCase(), updatedAt: new Date() })
				.where(eq(users.id, locals.user!.id));
		} catch {
			return fail(400, { message: "Email already taken" });
		}

		return { success: true, action: "profile" };
	},

	changePassword: async ({ request, locals }) => {
		if (isProtectedDemoUser(locals.user?.username)) {
			return fail(403, { message: "The shared demo account cannot be modified" });
		}

		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof currentPassword !== "string" || currentPassword.length < 1) {
			return fail(400, { message: "Current password is required" });
		}
		if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 255) {
			return fail(400, { message: "New password must be 6-255 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		// Verify current password
		const [user] = await db
			.select({ passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, locals.user!.id));

		const valid = await verify(user.passwordHash, currentPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		if (!valid) {
			return fail(400, { message: "Current password is incorrect" });
		}

		const passwordHash = await hash(newPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		await db
			.update(users)
			.set({ passwordHash, updatedAt: new Date() })
			.where(eq(users.id, locals.user!.id));

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
		const formData = await request.formData();
		const sessionId = formData.get("sessionId");

		if (typeof sessionId !== "string" || !sessionId) {
			return fail(400, { message: "Session ID is required" });
		}

		// Don't allow revoking current session via this action
		if (sessionId === locals.session!.id) {
			return fail(400, { message: "Cannot revoke your current session. Use logout instead." });
		}

		// Verify session belongs to user
		const [target] = await db
			.select({ userId: sessions.userId })
			.from(sessions)
			.where(eq(sessions.id, sessionId));

		if (!target || target.userId !== locals.user!.id) {
			return fail(404, { message: "Session not found" });
		}

		await invalidateSession(sessionId);
		return { success: true, action: "session" };
	},

	revokeAllOtherSessions: async ({ locals }) => {
		const userId = locals.user!.id;
		const currentSessionId = locals.session!.id;

		// Get all sessions for this user except current
		const otherSessions = await db
			.select({ id: sessions.id })
			.from(sessions)
			.where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)));

		for (const s of otherSessions) {
			await invalidateSession(s.id);
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
