import { defineEnvVars } from "@sveltejs/kit/env";

// Empty values disable optional OAuth providers; ORIGIN has a local development fallback.
export const variables = defineEnvVars({
	ORIGIN: { schema: (input) => input ?? "" },
	GOOGLE_CLIENT_ID: { schema: (input) => input ?? "" },
	GOOGLE_CLIENT_SECRET: { schema: (input) => input ?? "" },
	GITHUB_CLIENT_ID: { schema: (input) => input ?? "" },
	GITHUB_CLIENT_SECRET: { schema: (input) => input ?? "" },
});
