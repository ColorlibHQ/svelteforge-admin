import { db } from "#lib/server/db/index.js";
import { users, pages, notifications } from "#lib/server/db/schema.js";
import { sql, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	// User signups per month
	const signupsPerMonth = await db
		.select({
			month: sql<string>`strftime('%Y-%m-01', created_at, 'unixepoch')`,
			count: sql<number>`count(*)`,
		})
		.from(users)
		.groupBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`)
		.orderBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`);

	// Content creation per month
	const pagesPerMonth = await db
		.select({
			month: sql<string>`strftime('%Y-%m-01', created_at, 'unixepoch')`,
			count: sql<number>`count(*)`,
		})
		.from(pages)
		.groupBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`)
		.orderBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`);

	// Pages by status
	const pagesByStatus = await db
		.select({
			status: pages.status,
			count: sql<number>`count(*)`,
		})
		.from(pages)
		.groupBy(pages.status);

	// Notifications by type
	const notificationsByType = await db
		.select({
			type: notifications.type,
			count: sql<number>`count(*)`,
		})
		.from(notifications)
		.groupBy(notifications.type);

	// Top authors by page count
	const topAuthors = await db
		.select({
			name: users.name,
			pageCount: sql<number>`count(${pages.id})`,
		})
		.from(pages)
		.innerJoin(users, eq(pages.authorId, users.id))
		.groupBy(users.id)
		.orderBy(sql`count(${pages.id}) desc`)
		.limit(5);

	return {
		signupsPerMonth,
		pagesPerMonth,
		pagesByStatus,
		notificationsByType,
		topAuthors,
	};
};
