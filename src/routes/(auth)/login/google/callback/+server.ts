import { redirect } from "@sveltejs/kit";
import { google } from "$lib/server/oauth.js";
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
	if (!google) {
		redirect(302, "/login");
	}

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies.get("google_oauth_state");
	const storedCodeVerifier = cookies.get("google_oauth_code_verifier");

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		redirect(302, "/login");
	}

	// Clean up OAuth cookies
	cookies.delete("google_oauth_state", { path: "/" });
	cookies.delete("google_oauth_code_verifier", { path: "/" });

	let tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
	} catch {
		redirect(302, "/login");
	}

	// Fetch user profile from Google
	const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
		headers: { Authorization: `Bearer ${tokens.accessToken()}` },
	});

	if (!googleUserResponse.ok) {
		redirect(302, "/login");
	}

	const googleUser: {
		sub: string;
		email: string;
		name: string;
		picture?: string;
	} = await googleUserResponse.json();

	// Look up existing OAuth account
	const existingAccount = await db.query.oauthAccounts.findFirst({
		where: and(
			eq(oauthAccounts.provider, "google"),
			eq(oauthAccounts.providerUserId, googleUser.sub)
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

	// New user — create user + oauth account + session
	const userId = generateId(10);
	const emailPrefix = googleUser.email
		.split("@")[0]
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "");
	const username =
		emailPrefix.length >= 3 ? emailPrefix.slice(0, 31) : `user_${userId.slice(0, 8)}`;

	// Generate unusable password hash (OAuth users can't login with password)
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
			email: googleUser.email.toLowerCase(),
			username,
			passwordHash,
			name: googleUser.name || emailPrefix,
			avatarUrl: googleUser.picture || null,
			role: "viewer",
		});
	} catch {
		// Username or email conflict — try to link to existing user by email
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, googleUser.email.toLowerCase()),
		});

		if (existingUser) {
			await db.insert(oauthAccounts).values({
				id: generateId(10),
				userId: existingUser.id,
				provider: "google",
				providerUserId: googleUser.sub,
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

	// Create OAuth account link
	await db.insert(oauthAccounts).values({
		id: generateId(10),
		userId,
		provider: "google",
		providerUserId: googleUser.sub,
	});

	const token = generateSessionToken();
	const session = await createSession(token, userId, {
		userAgent: ua,
		ipAddress: ip,
	});
	setSessionCookie(cookies, token, session.expiresAt);
	redirect(302, "/");
};
