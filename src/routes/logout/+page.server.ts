import { fail, redirect } from "@sveltejs/kit";
import { auth } from "#lib/server/auth.js";
import type { Actions } from "./$types.js";

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.session) {
			return fail(401);
		}
		// Deletes the session row and clears the cookie (via the sveltekitCookies plugin).
		await auth.api.signOut({ headers: request.headers });
		redirect(302, "/login");
	},
};
