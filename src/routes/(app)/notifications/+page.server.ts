import { db } from "$lib/server/db/index.js";
import { notifications } from "$lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import { eq, and, or, isNull, desc } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const items = await db
		.select()
		.from(notifications)
		.where(or(eq(notifications.userId, locals.user!.id), isNull(notifications.userId)))
		.orderBy(desc(notifications.createdAt));

	return { notifications: items };
};

export const actions: Actions = {
	markRead: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Notification ID is required" });
		}

		await db
			.update(notifications)
			.set({ read: true })
			.where(
				and(
					eq(notifications.id, id),
					or(eq(notifications.userId, locals.user!.id), isNull(notifications.userId))
				)
			);

		return { success: true };
	},

	markAllRead: async ({ locals }) => {
		await db
			.update(notifications)
			.set({ read: true })
			.where(
				and(
					eq(notifications.read, false),
					or(eq(notifications.userId, locals.user!.id), isNull(notifications.userId))
				)
			);

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Notification ID is required" });
		}

		await db
			.delete(notifications)
			.where(
				and(
					eq(notifications.id, id),
					or(eq(notifications.userId, locals.user!.id), isNull(notifications.userId))
				)
			);

		return { success: true };
	},
};
