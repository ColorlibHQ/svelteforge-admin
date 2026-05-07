import { redirect } from "@sveltejs/kit";
import { github } from "$lib/server/oauth.js";
import { db } from "$lib/server/db/index.js";
import { users, oauthAccounts } from "$lib/server/db/schema.js";
import {
	generateSessionToken,
	createSession,
	setSessionCookie,
	generateId,
} from "$lib/server/auth.js";
import { eq, and } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url, cookies, request, getClientAddress }) => {
	if (!github) {
		redirect(302, "/login");
	}

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies.get("github_oauth_state");

	if (!code || !state || !storedState || state !== storedState) {
		redirect(302, "/login");
	}

	// Clean up OAuth cookie
	cookies.delete("github_oauth_state", { path: "/" });

	let tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch {
		redirect(302, "/login");
	}

	const accessToken = tokens.accessToken();

	// Fetch GitHub user profile
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"User-Agent": "SvelteForge-Admin",
		},
	});

	if (!githubUserResponse.ok) {
		redirect(302, "/login");
	}

	const githubUser: {
		id: number;
		login: string;
		name: string | null;
		avatar_url: string;
		email: string | null;
	} = await githubUserResponse.json();

	// Fetch primary email if not in profile
	let email = githubUser.email;
	if (!email) {
		const emailsResponse = await fetch("https://api.github.com/user/emails", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"User-Agent": "SvelteForge-Admin",
			},
		});
		if (emailsResponse.ok) {
			const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
				await emailsResponse.json();
			const primary = emails.find((e) => e.primary && e.verified);
			email = primary?.email ?? emails.find((e) => e.verified)?.email ?? null;
		}
	}

	if (!email) {
		// Cannot proceed without email
		redirect(302, "/login");
	}

	const providerUserId = String(githubUser.id);

	// Look up existing OAuth account
	const existingAccount = await db.query.oauthAccounts.findFirst({
		where: and(
			eq(oauthAccounts.provider, "github"),
			eq(oauthAccounts.providerUserId, providerUserId)
		),
	});

	const ua = request.headers.get("user-agent");
	const ip = getClientAddress();

	if (existingAccount) {
		const token = generateSessionToken();
		const session = await createSession(token, existingAccount.userId, {
			userAgent: ua,
			ipAddress: ip,
		});
		setSessionCookie(cookies, token, session.expiresAt);
		redirect(302, "/");
	}

	// New user
	const userId = generateId(10);
	const rawUsername = githubUser.login
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "")
		.slice(0, 31);
	const username = rawUsername.length >= 3 ? rawUsername : `user_${userId.slice(0, 8)}`;

	const randomPassword = generateId(25);
	const passwordHash = await hash(randomPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	try {
		await db.insert(users).values({
			id: userId,
			email: email.toLowerCase(),
			username,
			passwordHash,
			name: githubUser.name || githubUser.login,
			avatarUrl: githubUser.avatar_url || null,
			role: "viewer",
		});
	} catch {
		// Username or email conflict — link to existing user by email
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase()),
		});

		if (existingUser) {
			await db.insert(oauthAccounts).values({
				id: generateId(10),
				userId: existingUser.id,
				provider: "github",
				providerUserId,
			});

			const token = generateSessionToken();
			const session = await createSession(token, existingUser.id, {
				userAgent: ua,
				ipAddress: ip,
			});
			setSessionCookie(cookies, token, session.expiresAt);
			redirect(302, "/");
		}

		redirect(302, "/login");
	}

	await db.insert(oauthAccounts).values({
		id: generateId(10),
		userId,
		provider: "github",
		providerUserId,
	});

	const token = generateSessionToken();
	const session = await createSession(token, userId, {
		userAgent: ua,
		ipAddress: ip,
	});
	setSessionCookie(cookies, token, session.expiresAt);
	redirect(302, "/");
};
