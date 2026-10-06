import { invalidateSession, deleteSessionCookie } from "#lib/server/auth.js";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types.js";

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (!locals.session) {
			return fail(401);
		}
		await invalidateSession(locals.session.id);
		deleteSessionCookie(cookies);
		redirect(302, "/login");
	},
};
