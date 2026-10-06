import * as arctic from "arctic";

import {
	ORIGIN,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
} from "$app/env/private";

function getBaseUrl(): string {
	return ORIGIN || "http://localhost:5173";
}

export const google =
	GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
		? new arctic.Google(
				GOOGLE_CLIENT_ID,
				GOOGLE_CLIENT_SECRET,
				`${getBaseUrl()}/login/google/callback`
			)
		: null;

export const github =
	GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET
		? new arctic.GitHub(
				GITHUB_CLIENT_ID,
				GITHUB_CLIENT_SECRET,
				`${getBaseUrl()}/login/github/callback`
			)
		: null;

export function getEnabledProviders(): string[] {
	const providers: string[] = [];
	if (google) providers.push("google");
	if (github) providers.push("github");
	return providers;
}
