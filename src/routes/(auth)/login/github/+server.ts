import { redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import { github } from "#lib/server/oauth.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ cookies }) => {
	if (!github) {
		redirect(302, "/login");
	}

	const state = arctic.generateState();
	const scopes = ["user:email", "read:user"];
	const url = github.createAuthorizationURL(state, scopes);

	cookies.set("github_oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: 60 * 10,
	});

	redirect(302, url.toString(), { external: [url.origin] });
};
