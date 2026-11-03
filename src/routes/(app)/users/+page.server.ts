import { db } from "#lib/server/db/index.js";
import { users, ROLES, type Role } from "#lib/server/db/schema.js";
import {
	auth,
	PASSWORD_MAX,
	PASSWORD_MIN,
	USERNAME_MAX,
	USERNAME_MIN,
	USERNAME_PATTERN,
} from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import { fail, redirect } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, "/login");

	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
			role: users.role,
			createdAt: users.createdAt,
		})
		.from(users)
		.orderBy(users.createdAt);

	return { users: allUsers, currentUserId: locals.user.id };
};

function isRole(value: unknown): value is Role {
	return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Better Auth's admin plugin re-checks permissions (src/lib/permissions.ts) and the
// last-admin rules (hooks.before in src/lib/server/auth.ts); this early return just
// gives a clear message without a round trip.
function requireAdmin(locals: App.Locals) {
	if (locals.user?.role !== "admin") {
		return fail(403, { message: "Admin access required" });
	}
	return null;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");
		const role = formData.get("role");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (
			typeof username !== "string" ||
			username.length < USERNAME_MIN ||
			username.length > USERNAME_MAX ||
			!USERNAME_PATTERN.test(username)
		) {
			return fail(400, {
				message: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters, lowercase letters, numbers, hyphens, underscores`,
			});
		}
		if (
			typeof password !== "string" ||
			password.length < PASSWORD_MIN ||
			password.length > PASSWORD_MAX
		) {
			return fail(400, { message: `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters` });
		}
		if (!isRole(role)) {
			return fail(400, { message: "Invalid role" });
		}

		try {
			await auth.api.createUser({
				body: {
					name,
					email: email.toLowerCase(),
					password,
					role,
					data: { username: username.toLowerCase(), displayUsername: username },
				},
				headers: request.headers,
			});
		} catch (err) {
			return authFailure(err);
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const email = formData.get("email");
		const role = formData.get("role");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}
		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (!isRole(role)) {
			return fail(400, { message: "Invalid role" });
		}

		try {
			const current = db.select({ role: users.role }).from(users).where(eq(users.id, id)).get();
			if (!current) return fail(404, { message: "User not found" });
			if (current.role !== role) {
				// Runs the last-admin guard in auth.ts hooks.before.
				await auth.api.setRole({ body: { userId: id, role }, headers: request.headers });
			}
			await auth.api.adminUpdateUser({
				body: { userId: id, data: { name, email: email.toLowerCase() } },
				headers: request.headers,
			});
		} catch (err) {
			return authFailure(err);
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}

		// Prevent self-deletion
		if (id === locals.user!.id) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		try {
			// Better Auth removes the user's sessions and accounts too. Last-admin and
			// authored-content checks run in auth.ts hooks.before.
			await auth.api.removeUser({ body: { userId: id }, headers: request.headers });
		} catch (err) {
			return authFailure(err);
		}

		return { success: true };
	},

	bulkDelete: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: "No users selected" });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		const currentUserId = locals.user!.id;

		// Filter out self
		const toDelete = ids.filter((id) => id !== currentUserId);
		if (toDelete.length === 0) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		// Check if any targets are the last admin
		const admins = db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).all();
		const remainingAdmins = admins.filter((a) => !toDelete.includes(a.id));
		if (remainingAdmins.length === 0) {
			return fail(400, { message: "Cannot delete all admin users" });
		}

		const failures: string[] = [];
		for (const userId of toDelete) {
			try {
				await auth.api.removeUser({ body: { userId }, headers: request.headers });
			} catch (err) {
				if (!isAPIError(err)) throw err;
				failures.push(err.body?.message ?? "Unknown error");
			}
		}
		if (failures.length > 0) {
			const deleted = toDelete.length - failures.length;
			return fail(400, {
				message: `Deleted ${deleted} of ${toDelete.length} users. Some could not be deleted: ${[...new Set(failures)].join("; ")}`,
			});
		}

		return { success: true };
	},
};
