import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import { hash } from "@node-rs/argon2";
import { generateId } from "$lib/server/auth.js";
import { eq, sql, inArray } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
			role: users.role,
			createdAt: users.createdAt,
		})
		.from(users)
		.orderBy(users.createdAt);

	return { users: allUsers, currentUserId: locals.user!.id };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");
		const role = formData.get("role");

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
		if (typeof role !== "string" || !["admin", "editor", "viewer"].includes(role)) {
			return fail(400, { message: "Invalid role" });
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
				role: role as "admin" | "editor" | "viewer",
			});
		} catch {
			return fail(400, { message: "Username or email already taken" });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const email = formData.get("email");
		const role = formData.get("role");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}
		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (typeof role !== "string" || !["admin", "editor", "viewer"].includes(role)) {
			return fail(400, { message: "Invalid role" });
		}

		// Prevent demotion of last admin
		const [existing] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
		if (existing?.role === "admin" && role !== "admin") {
			const [adminCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(users)
				.where(eq(users.role, "admin"));
			if (adminCount.count <= 1) {
				return fail(400, { message: "Cannot demote the last admin" });
			}
		}

		try {
			await db
				.update(users)
				.set({
					name,
					email: email.toLowerCase(),
					role: role as "admin" | "editor" | "viewer",
					updatedAt: new Date(),
				})
				.where(eq(users.id, id));
		} catch {
			return fail(400, { message: "Email already taken" });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}

		// Prevent self-deletion
		if (id === locals.user!.id) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		// Prevent deletion of last admin
		const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
		if (target?.role === "admin") {
			const [adminCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(users)
				.where(eq(users.role, "admin"));
			if (adminCount.count <= 1) {
				return fail(400, { message: "Cannot delete the last admin" });
			}
		}

		try {
			await db.delete(users).where(eq(users.id, id));
		} catch {
			return fail(400, { message: "Cannot delete user — they may have related content" });
		}

		return { success: true };
	},

	bulkDelete: async ({ request, locals }) => {
		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: "No users selected" });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		const currentUserId = locals.user!.id;

		// Filter out self
		const toDelete = ids.filter((id) => id !== currentUserId);
		if (toDelete.length === 0) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		// Check if any targets are the last admin
		const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
		const remainingAdmins = admins.filter((a) => !toDelete.includes(a.id));
		if (remainingAdmins.length === 0) {
			return fail(400, { message: "Cannot delete all admin users" });
		}

		try {
			await db.delete(users).where(inArray(users.id, toDelete));
		} catch {
			return fail(400, { message: "Cannot delete some users — they may have related content" });
		}

		return { success: true };
	},
};
