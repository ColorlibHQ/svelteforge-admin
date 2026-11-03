import { fail, redirect } from "@sveltejs/kit";
import { auth, PASSWORD_MAX, PASSWORD_MIN } from "#lib/server/auth.js";
import { authFailure } from "#lib/server/auth-errors.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ url }) => {
	// Better Auth redirects here with ?token=… or, for a bad/expired link, ?error=INVALID_TOKEN.
	const token = url.searchParams.get("token");
	if (!token || url.searchParams.has("error")) {
		return { valid: false };
	}
	return { valid: true, token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get("token");
		const password = formData.get("password");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof token !== "string" || !token) {
			return fail(400, { message: "Invalid or missing reset token" });
		}
		if (
			typeof password !== "string" ||
			password.length < PASSWORD_MIN ||
			password.length > PASSWORD_MAX
		) {
			return fail(400, { message: `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters` });
		}
		if (password !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		try {
			// Also signs the user out everywhere (revokeSessionsOnPasswordReset).
			await auth.api.resetPassword({ body: { newPassword: password, token } });
		} catch (err) {
			return authFailure(err, "Invalid or expired reset link");
		}

		redirect(302, "/login");
	},
};
