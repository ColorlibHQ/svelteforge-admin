import { auth } from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import { db } from "#lib/server/db/index.js";
import { users, ROLES, type Role } from "#lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

const roleDefinitions = [
	{
		name: "admin" as const,
		description: "Full system access. Can manage users, content, settings, and view database info.",
		permissions: [
			"Manage users",
			"Manage content",
			"Manage settings",
			"View database",
			"Manage roles",
		],
	},
	{
		name: "editor" as const,
		description: "Can create and edit content. Cannot manage users or system settings.",
		permissions: ["Create content", "Edit content", "Delete own content", "View analytics"],
	},
	{
		name: "viewer" as const,
		description: "Read-only access. Can view content and their own profile.",
		permissions: ["View content", "View dashboard", "Edit own profile"],
	},
];

export const load: PageServerLoad = async () => {
	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
		})
		.from(users)
		.orderBy(users.name);

	const roles = roleDefinitions.map((role) => ({
		...role,
		users: allUsers.filter((u) => u.role === role.name),
		count: allUsers.filter((u) => u.role === role.name).length,
	}));

	return { roles };
};

export const actions: Actions = {
	changeRole: async ({ request, locals }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Admin access required" });
		const formData = await request.formData();
		const userId = formData.get("userId");
		const newRole = formData.get("newRole");

		if (typeof userId !== "string") {
			return fail(400, { message: "User ID is required" });
		}
		if (typeof newRole !== "string" || !(ROLES as readonly string[]).includes(newRole)) {
			return fail(400, { message: "Invalid role" });
		}

		try {
			// The admin plugin checks the caller's permission; the last-admin guard runs in
			// auth.ts hooks.before.
			await auth.api.setRole({
				body: { userId, role: newRole as Role },
				headers: request.headers,
			});
		} catch (err) {
			return authFailure(err);
		}

		return { success: true };
	},
};
