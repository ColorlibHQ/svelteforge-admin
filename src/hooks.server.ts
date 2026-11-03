import type { Handle } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/env";

import { auth, type SessionUser } from "#lib/server/auth.js";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;

	if (!building) {
		try {
			const result = await auth.api.getSession({ headers: event.request.headers });
			if (result) {
				event.locals.user = result.user as SessionUser;
				event.locals.session = result.session;
			}
		} catch (err) {
			// DB error or corrupt cookie — continue as unauthenticated.
			console.error("Session lookup failed:", err);
		}
	}

	// Serves Better Auth's endpoints under /api/auth/* (OAuth callbacks, password-reset
	// links, …) and passes every other request on to SvelteKit.
	return svelteKitHandler({ event, resolve, auth, building });
};
