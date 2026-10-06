import { redirect, error } from "@sveltejs/kit";
import { db } from "#lib/server/db/index.js";
import { notifications, appSettings } from "#lib/server/db/schema.js";
import { eq, and, or, isNull, sql, desc } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}

	// Check maintenance mode
	const maintenanceSetting = await db.query.appSettings.findFirst({
		where: eq(appSettings.key, "maintenanceMode"),
	});
	if (maintenanceSetting?.value === "true" && locals.user.role !== "admin") {
		error(503, "The application is currently under maintenance. Please check back later.");
	}

	const userNotificationFilter = or(
		eq(notifications.userId, locals.user.id),
		isNull(notifications.userId)
	);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications)
		.where(and(eq(notifications.read, false), userNotificationFilter));

	const recentNotifications = await db
		.select({
			id: notifications.id,
			title: notifications.title,
			message: notifications.message,
			type: notifications.type,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(and(eq(notifications.read, false), userNotificationFilter))
		.orderBy(desc(notifications.createdAt))
		.limit(5);

	return {
		user: locals.user,
		unreadNotificationCount: countResult?.count ?? 0,
		recentNotifications,
	};
};
