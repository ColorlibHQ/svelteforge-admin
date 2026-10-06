import { db } from "#lib/server/db/index.js";
import { pages } from "#lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { generateId } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	return {};
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
	default: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === "viewer")
			return fail(403, { message: "Content editing access required" });
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

		const id = generateId(10);

		try {
			await db.insert(pages).values({
				id,
				title,
				slug: finalSlug,
				content,
				template: template as "default" | "landing" | "blog",
				status: status as "draft" | "published" | "archived",
				authorId: locals.user!.id,
				publishedAt: status === "published" ? new Date() : null,
			});
		} catch {
			return fail(400, { message: "A page with this slug already exists" });
		}

		redirect(302, "/content");
	},
};
