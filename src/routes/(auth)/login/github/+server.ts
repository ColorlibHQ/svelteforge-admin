import { redirect } from "@sveltejs/kit";
import { auth, getEnabledProviders } from "#lib/server/auth.js";
import type { RequestHandler } from "./$types.js";

// Starts the GitHub OAuth flow. Better Auth stores the state/PKCE verifier and handles
// the provider's redirect at /api/auth/callback/github.
export const GET: RequestHandler = async ({ request }) => {
	if (!getEnabledProviders().includes("github")) redirect(302, "/login");

	const { url } = await auth.api.signInSocial({
		body: { provider: "github", callbackURL: "/", errorCallbackURL: "/login?error=oauth" },
		headers: request.headers,
	});
	if (!url) redirect(302, "/login?error=oauth");

	redirect(302, url, { external: [new URL(url).origin] });
};
