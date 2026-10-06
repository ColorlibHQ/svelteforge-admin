import { redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import { google } from "#lib/server/oauth.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ cookies }) => {
	if (!google) {
		redirect(302, "/login");
	}

	const state = arctic.generateState();
	const codeVerifier = arctic.generateCodeVerifier();
	const scopes = ["openid", "profile", "email"];
	const url = google.createAuthorizationURL(state, codeVerifier, scopes);

	cookies.set("google_oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: 60 * 10,
	});
	cookies.set("google_oauth_code_verifier", codeVerifier, {
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: 60 * 10,
	});

	redirect(302, url.toString(), { external: [url.origin] });
};
