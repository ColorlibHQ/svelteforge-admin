import {
	generateSessionToken,
	createSession,
	setSessionCookie,
	generateId,
} from "$lib/server/auth.js";
import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { hash } from "@node-rs/argon2";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message:
					"Username must be 3-31 characters, lowercase letters, numbers, hyphens, underscores",
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Password must be 6-255 characters" });
		}

		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		const userId = generateId(10);

		try {
			await db.insert(users).values({
				id: userId,
				email: email.toLowerCase(),
				username: username.toLowerCase(),
				passwordHash,
				name,
				role: "admin", // First user gets admin role
			});
		} catch {
			return fail(400, { message: "Username or email already taken" });
		}

		const token = generateSessionToken();
		const ua = request.headers.get("user-agent");
		const ip = getClientAddress();
		const session = await createSession(token, userId, {
			userAgent: ua,
			ipAddress: ip,
		});
		setSessionCookie(cookies, token, session.expiresAt);

		redirect(302, "/");
	},
};
