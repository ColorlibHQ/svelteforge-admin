import { createAccessControl } from "better-auth/plugins/access";

// Role-based access control shared by the server (Better Auth admin plugin) and
// the UI. `user` and `session` are the statements the admin plugin checks for its
// endpoints (create user, set role, ban, revoke sessions, …).
//
// Impersonation is deliberately granted to no role in the free edition.
export const statements = {
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"set-email",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
	admin: ac.newRole({
		user: [
			"create",
			"list",
			"set-role",
			"ban",
			"delete",
			"set-password",
			"set-email",
			"get",
			"update",
		],
		session: ["list", "revoke", "delete"],
	}),
	editor: ac.newRole({ user: [], session: [] }),
	viewer: ac.newRole({ user: [], session: [] }),
};
