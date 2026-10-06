// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Session } from "#lib/server/db/schema.js";
import type { SessionUser } from "#lib/server/auth.js";

declare global {
	const __BUILD_COMMIT__: string;
	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
