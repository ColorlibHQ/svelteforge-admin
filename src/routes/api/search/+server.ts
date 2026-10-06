import { error } from "@sveltejs/kit";
import { db } from "#lib/server/db/index.js";
import { users, pages, notifications } from "#lib/server/db/schema.js";
import { sql, or, and, eq, isNull } from "drizzle-orm";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		error(401, "Unauthorized");
	}

	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) {
		return Response.json([]);
	}

	const pattern = `%${q}%`;

	const [userResults, pageResults, notificationResults] = await Promise.all([
		db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(or(sql`${users.name} LIKE ${pattern}`, sql`${users.email} LIKE ${pattern}`))
			.limit(5),
		db
			.select({ id: pages.id, title: pages.title, slug: pages.slug })
			.from(pages)
			.where(sql`${pages.title} LIKE ${pattern}`)
			.limit(5),
		db
			.select({ id: notifications.id, title: notifications.title, message: notifications.message })
			.from(notifications)
			.where(
				and(
					sql`${notifications.title} LIKE ${pattern}`,
					or(eq(notifications.userId, locals.user.id), isNull(notifications.userId))
				)
			)
			.limit(5),
	]);

	const results = [
		...userResults.map((u) => ({
			type: "user" as const,
			id: u.id,
			title: u.name,
			subtitle: u.email,
			href: "/users",
		})),
		...pageResults.map((p) => ({
			type: "page" as const,
			id: p.id,
			title: p.title,
			subtitle: `/${p.slug}`,
			href: `/content/${p.id}/edit`,
		})),
		...notificationResults.map((n) => ({
			type: "notification" as const,
			id: n.id,
			title: n.title,
			subtitle: n.message.slice(0, 50),
			href: "/notifications",
		})),
	];

	return Response.json(results);
};
