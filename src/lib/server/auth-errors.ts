import { fail } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";

/**
 * Convert a Better Auth APIError thrown by `auth.api.*` into a form-action failure.
 * Anything else (including SvelteKit redirects) is rethrown.
 */
export function authFailure(err: unknown, fallback = "Something went wrong. Please try again.") {
	if (isAPIError(err)) {
		const status =
			typeof err.statusCode === "number" && err.statusCode >= 400 ? err.statusCode : 400;
		return fail(status, { message: err.body?.message || err.message || fallback });
	}
	throw err;
}
