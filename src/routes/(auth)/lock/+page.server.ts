import { db } from "#lib/server/db/index.js";
import { users } from "#lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}
	return {
		user: {
			name: locals.user.name,
			email: locals.user.email,
			username: locals.user.username,
		},
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, "/login");
		}

		const formData = await request.formData();
		const password = formData.get("password");

		if (typeof password !== "string" || password.length < 1) {
			return fail(400, { message: "Password is required" });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id),
		});

		if (!user) {
			return fail(400, { message: "User not found" });
		}

		const valid = await verify(user.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		if (!valid) {
			return fail(400, { message: "Incorrect password" });
		}

		redirect(302, "/");
	},
};
