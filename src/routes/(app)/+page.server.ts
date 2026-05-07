import { db } from "$lib/server/db/index.js";
import { users, sessions, pages, notifications, appSettings } from "$lib/server/db/schema.js";
import { sql, eq, gt, desc, or, isNull } from "drizzle-orm";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const now = Date.now();
	const thisMonthStart = new Date();
	thisMonthStart.setDate(1);
	thisMonthStart.setHours(0, 0, 0, 0);
	const lastMonthStart = new Date(thisMonthStart);
	lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

	const thisMonthSec = Math.floor(thisMonthStart.getTime() / 1000);
	const lastMonthSec = Math.floor(lastMonthStart.getTime() / 1000);

	// Current stats
	const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
	const [activeSessionCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(sessions)
		.where(gt(sessions.expiresAt, now));
	const [pageCount] = await db.select({ count: sql<number>`count(*)` }).from(pages);
	const [unreadCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications)
		.where(eq(notifications.read, false));

	// Trend: users this month vs last month
	const [usersThisMonth] = await db
		.select({ count: sql<number>`count(*)` })
		.from(users)
		.where(sql`created_at >= ${thisMonthSec}`);
	const [usersLastMonth] = await db
		.select({ count: sql<number>`count(*)` })
		.from(users)
		.where(sql`created_at >= ${lastMonthSec} AND created_at < ${thisMonthSec}`);

	// Trend: pages this month vs last month
	const [pagesThisMonth] = await db
		.select({ count: sql<number>`count(*)` })
		.from(pages)
		.where(sql`created_at >= ${thisMonthSec}`);
	const [pagesLastMonth] = await db
		.select({ count: sql<number>`count(*)` })
		.from(pages)
		.where(sql`created_at >= ${lastMonthSec} AND created_at < ${thisMonthSec}`);

	function calcTrend(current: number, previous: number) {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	}

	// Role distribution
	const roleDistribution = await db
		.select({
			role: users.role,
			count: sql<number>`count(*)`,
		})
		.from(users)
		.groupBy(users.role);

	// Monthly user signups for chart
	const monthlySignups = await db
		.select({
			month: sql<string>`strftime('%Y-%m-01', created_at, 'unixepoch')`,
			count: sql<number>`count(*)`,
		})
		.from(users)
		.groupBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`)
		.orderBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`);

	// Recent activity: newest users and pages
	const recentUsers = await db
		.select({ name: users.name, createdAt: users.createdAt })
		.from(users)
		.orderBy(desc(users.createdAt))
		.limit(5);

	const recentPages = await db
		.select({
			title: pages.title,
			authorName: users.name,
			createdAt: pages.createdAt,
		})
		.from(pages)
		.leftJoin(users, eq(pages.authorId, users.id))
		.orderBy(desc(pages.createdAt))
		.limit(5);

	type ActivityItem = { label: string; description: string; time: Date };

	const activity: ActivityItem[] = [
		...recentUsers.map((u) => ({
			label: u.name,
			description: "Joined the platform",
			time: u.createdAt,
		})),
		...recentPages.map((p) => ({
			label: p.authorName ?? "Unknown",
			description: `Created "${p.title}"`,
			time: p.createdAt,
		})),
	]
		.sort((a, b) => b.time.getTime() - a.time.getTime())
		.slice(0, 5);

	// Recent notifications for dashboard feed
	const userNotifFilter = or(
		eq(notifications.userId, locals.user!.id),
		isNull(notifications.userId)
	);
	const recentNotifications = await db
		.select({
			id: notifications.id,
			title: notifications.title,
			message: notifications.message,
			type: notifications.type,
			read: notifications.read,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(userNotifFilter)
		.orderBy(desc(notifications.createdAt))
		.limit(5);

	// Quick stats
	const [publishedCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(pages)
		.where(eq(pages.status, "published"));
	const [editorCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(users)
		.where(eq(users.role, "editor"));

	// Pages by status distribution
	const pagesByStatus = await db
		.select({
			status: pages.status,
			count: sql<number>`count(*)`,
		})
		.from(pages)
		.groupBy(pages.status);

	// Content creation trend (last 6 months, by status)
	const sixMonthsAgoSec = Math.floor(new Date(Date.now() - 180 * 86400000).getTime() / 1000);
	const contentTrend = await db
		.select({
			month: sql<string>`strftime('%Y-%m-01', created_at, 'unixepoch')`,
			status: pages.status,
			count: sql<number>`count(*)`,
		})
		.from(pages)
		.where(sql`created_at >= ${sixMonthsAgoSec}`)
		.groupBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`, pages.status)
		.orderBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`);

	// System status
	const maintenanceSetting = await db.query.appSettings.findFirst({
		where: eq(appSettings.key, "maintenanceMode"),
	});

	return {
		stats: {
			totalUsers: userCount.count,
			activeSessions: activeSessionCount.count,
			totalPages: pageCount.count,
			unreadNotifications: unreadCount.count,
		},
		trends: {
			users: calcTrend(usersThisMonth.count, usersLastMonth.count),
			pages: calcTrend(pagesThisMonth.count, pagesLastMonth.count),
		},
		roleDistribution,
		monthlySignups,
		recentActivity: activity.map((a) => ({
			...a,
			time: a.time.toISOString(),
		})),
		recentNotifications,
		quickStats: {
			publishedPages: publishedCount.count,
			activeEditors: editorCount.count,
		},
		pagesByStatus,
		contentTrend,
		systemStatus: {
			maintenanceMode: maintenanceSetting?.value === "true",
		},
	};
};
