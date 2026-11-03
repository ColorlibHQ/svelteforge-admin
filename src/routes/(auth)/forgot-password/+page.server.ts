import { fail } from "@sveltejs/kit";
import { auth } from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { alreadyLoggedIn: true };
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get("email");

		if (typeof email !== "string" || !email.includes("@")) {
			return fail(400, { message: "Please enter a valid email address" });
		}

		try {
			// Responds identically whether or not the email exists. The reset link is
			// delivered through sendAuthEmail (src/lib/server/email.ts) and lands on
			// /reset-password?token=…
			await auth.api.requestPasswordReset({
				body: { email: email.toLowerCase(), redirectTo: "/reset-password" },
				headers: request.headers,
			});
		} catch (err) {
			return authFailure(err);
		}

		return { success: true };
	},
};
