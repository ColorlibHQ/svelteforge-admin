import { fail, redirect } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";
import { auth } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}
	return {
		user: {
			name: locals.user.name,
			email: locals.user.email,
			username: locals.user.username,
		},
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, "/login");
		}

		const formData = await request.formData();
		const password = formData.get("password");

		if (typeof password !== "string" || password.length < 1) {
			return fail(400, { message: "Password is required" });
		}

		try {
			await auth.api.verifyPassword({ body: { password }, headers: request.headers });
		} catch (err) {
			if (isAPIError(err)) return fail(400, { message: "Incorrect password" });
			throw err;
		}

		redirect(302, "/");
	},
};
