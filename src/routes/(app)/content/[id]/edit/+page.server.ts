import { db } from "$lib/server/db/index.js";
import { pages } from "$lib/server/db/schema.js";
import { fail, redirect, error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ params }) => {
	const [page] = await db.select().from(pages).where(eq(pages.id, params.id));

	if (!page) {
		error(404, "Page not found");
	}

	return { page };
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 200);
}

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const title = formData.get("title");
		const slug = formData.get("slug");
		const content = formData.get("content");
		const template = formData.get("template");
		const status = formData.get("status");

		if (typeof title !== "string" || title.length < 1 || title.length > 200) {
			return fail(400, { message: "Title is required (1-200 characters)" });
		}

		const finalSlug = typeof slug === "string" && slug.length > 0 ? slugify(slug) : slugify(title);
		if (!finalSlug) {
			return fail(400, { message: "Could not generate a valid slug" });
		}

		if (typeof content !== "string") {
			return fail(400, { message: "Content is required" });
		}
		if (typeof template !== "string" || !["default", "landing", "blog"].includes(template)) {
			return fail(400, { message: "Invalid template" });
		}
		if (typeof status !== "string" || !["draft", "published", "archived"].includes(status)) {
			return fail(400, { message: "Invalid status" });
		}

		// Get existing page to check published status
		const [existing] = await db
			.select({ status: pages.status, publishedAt: pages.publishedAt })
			.from(pages)
			.where(eq(pages.id, params.id));

		const publishedAt =
			status === "published" && existing?.status !== "published"
				? new Date()
				: (existing?.publishedAt ?? null);

		try {
			await db
				.update(pages)
				.set({
					title,
					slug: finalSlug,
					content,
					template: template as "default" | "landing" | "blog",
					status: status as "draft" | "published" | "archived",
					updatedAt: new Date(),
					publishedAt,
				})
				.where(eq(pages.id, params.id));
		} catch {
			return fail(400, { message: "A page with this slug already exists" });
		}

		redirect(302, "/content");
	},
};
