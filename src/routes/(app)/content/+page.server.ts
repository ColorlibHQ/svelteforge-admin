import { db } from "#lib/server/db/index.js";
import { pages, users } from "#lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import { eq, inArray, and } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	const allPages = await db
		.select({
			id: pages.id,
			authorId: pages.authorId,
			title: pages.title,
			slug: pages.slug,
			template: pages.template,
			status: pages.status,
			authorName: users.name,
			createdAt: pages.createdAt,
			updatedAt: pages.updatedAt,
			publishedAt: pages.publishedAt,
		})
		.from(pages)
		.leftJoin(users, eq(pages.authorId, users.id))
		.orderBy(pages.updatedAt);

	return { pages: allPages };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === "viewer")
			return fail(403, { message: "Content editing access required" });
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Page ID is required" });
		}

		if (locals.user.role === "editor") {
			const target = db
				.select({ authorId: pages.authorId })
				.from(pages)
				.where(eq(pages.id, id))
				.get();
			if (target && target.authorId !== locals.user.id)
				return fail(403, { message: "Editors can only delete their own content" });
		}
		await db
			.delete(pages)
			.where(
				and(
					eq(pages.id, id),
					locals.user.role === "editor" ? eq(pages.authorId, locals.user.id) : undefined
				)
			);

		return { success: true };
	},

	bulkDelete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === "viewer")
			return fail(403, { message: "Content editing access required" });
		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: "No pages selected" });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		if (locals.user.role === "editor") {
			const targets = db
				.select({ authorId: pages.authorId })
				.from(pages)
				.where(inArray(pages.id, ids))
				.all();
			if (targets.some((page) => page.authorId !== locals.user!.id))
				return fail(403, { message: "Editors can only delete their own content" });
		}
		await db
			.delete(pages)
			.where(
				and(
					inArray(pages.id, ids),
					locals.user.role === "editor" ? eq(pages.authorId, locals.user.id) : undefined
				)
			);

		return { success: true };
	},
};
