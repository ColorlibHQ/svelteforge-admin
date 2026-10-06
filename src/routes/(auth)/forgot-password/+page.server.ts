import { db } from "#lib/server/db/index.js";
import { users, passwordResetTokens } from "#lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { generateId } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { alreadyLoggedIn: true };
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get("email");

		if (typeof email !== "string" || !email.includes("@")) {
			return fail(400, { message: "Please enter a valid email address" });
		}

		// Always return success to avoid revealing if email exists
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase()),
		});

		if (user) {
			// Generate token
			const token = generateId(25);
			const tokenId = generateId(10);

			// Hash token with simple SHA-256 (not password-grade, just for token lookup)
			const encoder = new TextEncoder();
			const data = encoder.encode(token);
			const hashBuffer = await crypto.subtle.digest("SHA-256", data);
			const tokenHash = Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			// Store token (expires in 1 hour)
			const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
			await db.insert(passwordResetTokens).values({
				id: tokenId,
				userId: user.id,
				tokenHash,
				expiresAt,
			});

			// Log the reset URL (no email service in dev)
			console.log(`\n[Password Reset] Token for ${user.email}: ${token}`);
			console.log(`[Password Reset] URL: /reset-password?token=${token}\n`);
		}

		return { success: true };
	},
};
