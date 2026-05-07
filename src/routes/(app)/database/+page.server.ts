import { db } from "$lib/server/db/index.js";
import { users, sessions, pages, notifications, appSettings } from "$lib/server/db/schema.js";
import { sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import { statSync } from "fs";
import { resolve } from "path";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== "admin") {
		error(403, "Admin access required");
	}

	// Get table row counts
	const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
	const [sessionsCount] = await db.select({ count: sql<number>`count(*)` }).from(sessions);
	const [pagesCount] = await db.select({ count: sql<number>`count(*)` }).from(pages);
	const [notificationsCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications);
	const [settingsCount] = await db.select({ count: sql<number>`count(*)` }).from(appSettings);

	// Get journal mode
	const journalResult = db.$client.pragma("journal_mode") as { journal_mode: string }[];

	// Get DB file size
	let dbSizeBytes = 0;
	try {
		const dbPath = resolve("svelteforge.db");
		const stats = statSync(dbPath);
		dbSizeBytes = stats.size;
	} catch {
		// DB file not found at expected path
	}

	const tables = [
		{ name: "users", rows: usersCount.count },
		{ name: "sessions", rows: sessionsCount.count },
		{ name: "pages", rows: pagesCount.count },
		{ name: "notifications", rows: notificationsCount.count },
		{ name: "app_settings", rows: settingsCount.count },
	];

	return {
		dbSize: dbSizeBytes,
		journalMode: journalResult?.[0]?.journal_mode ?? "unknown",
		tables,
		totalRows: tables.reduce((sum, t) => sum + t.rows, 0),
	};
};
