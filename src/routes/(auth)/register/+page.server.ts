import { fail, redirect } from "@sveltejs/kit";
import {
	auth,
	PASSWORD_MAX,
	PASSWORD_MIN,
	USERNAME_MAX,
	USERNAME_MIN,
	USERNAME_PATTERN,
} from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");

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

		try {
			// Creates the user + credential account and signs them in. The first account
			// on a fresh install is promoted to admin by a databaseHook in auth.ts.
			await auth.api.signUpEmail({
				body: { name, email: email.toLowerCase(), username, password },
				headers: request.headers,
			});
		} catch (err) {
			return authFailure(err);
		}

		redirect(302, "/");
	},
};
