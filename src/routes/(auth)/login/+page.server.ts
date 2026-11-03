import { fail, redirect } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";
import { auth, getEnabledProviders } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(302, "/");
	return {
		enabledProviders: getEnabledProviders(),
		oauthError: url.searchParams.has("error")
			? "Social sign-in failed. Please try again or use your username and password."
			: null,
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof username !== "string" || username.length < 3 || username.length > 31) {
			return fail(400, { message: "Invalid username (3-31 characters required)" });
		}
		if (typeof password !== "string" || password.length < 1 || password.length > 255) {
			return fail(400, { message: "Password is required" });
		}

		try {
			// Sets the session cookie through the sveltekitCookies plugin.
			await auth.api.signInUsername({
				body: { username, password },
				headers: request.headers,
			});
		} catch (err) {
			if (isAPIError(err) && (err.statusCode === 401 || err.statusCode === 400)) {
				return fail(400, { message: "Incorrect username or password" });
			}
			if (isAPIError(err)) {
				// Banned account, rate limited, …
				return fail(err.statusCode, { message: err.body?.message ?? "Sign-in failed" });
			}
			throw err;
		}

		redirect(302, "/");
	},
};
