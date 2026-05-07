import { db } from "$lib/server/db/index.js";
import { users, passwordResetTokens } from "$lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get("token");
	if (!token) {
		return { valid: false };
	}
	return { valid: true, token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get("token");
		const password = formData.get("password");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof token !== "string" || !token) {
			return fail(400, { message: "Invalid or missing reset token" });
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Password must be 6-255 characters" });
		}
		if (password !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		// Hash the submitted token
		const encoder = new TextEncoder();
		const data = encoder.encode(token);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const tokenHash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		// Find the token
		const resetToken = await db.query.passwordResetTokens.findFirst({
			where: eq(passwordResetTokens.tokenHash, tokenHash),
		});

		if (!resetToken) {
			return fail(400, { message: "Invalid or expired reset link" });
		}

		if (resetToken.expiresAt < new Date()) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
			return fail(400, { message: "Reset link has expired. Please request a new one." });
		}

		// Update password
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		await db
			.update(users)
			.set({ passwordHash, updatedAt: new Date() })
			.where(eq(users.id, resetToken.userId));

		// Delete used token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

		redirect(302, "/login");
	},
};
