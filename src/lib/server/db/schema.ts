import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Auth tables — owned by Better Auth (https://better-auth.com/docs/concepts/database).
// The JS property names are the field names Better Auth expects; the SQL column
// names stay snake_case. `avatarUrl` is Better Auth's `image` field, remapped in
// `src/lib/server/auth.ts`. `username`/`displayUsername` come from the username
// plugin, `role`/`banned`/`banReason`/`banExpires`/`impersonatedBy` from the
// admin plugin. Regenerate with `npx @better-auth/cli generate` if you add plugins.
// ---------------------------------------------------------------------------

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	avatarUrl: text("avatar_url"),
	username: text("username").notNull().unique(),
	displayUsername: text("display_username"),
	role: text("role", { enum: ROLES }).notNull().default("viewer"),
	banned: integer("banned", { mode: "boolean" }).notNull().default(false),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		// Random bearer token. The cookie carries it HMAC-signed with BETTER_AUTH_SECRET,
		// so a leaked database alone cannot be turned into a valid session cookie.
		token: text("token").notNull().unique(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		impersonatedBy: text("impersonated_by"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)]
);

// One row per login method. Email/password users have providerId "credential" and
// their Argon2id hash in `password`; OAuth users have providerId "google"/"github".
export const accounts = sqliteTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		index("accounts_user_id_idx").on(table.userId),
		uniqueIndex("accounts_provider_account_idx").on(table.providerId, table.accountId),
	]
);

// Short-lived tokens: password resets, email-change confirmations, OAuth state.
export const verifications = sqliteTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)]
);

// ---------------------------------------------------------------------------
// Application tables
// ---------------------------------------------------------------------------

export const pages = sqliteTable("pages", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	content: text("content").notNull().default(""),
	template: text("template", { enum: ["default", "landing", "blog"] })
		.notNull()
		.default("default"),
	status: text("status", { enum: ["draft", "published", "archived"] })
		.notNull()
		.default("draft"),
	authorId: text("author_id")
		.notNull()
		.references(() => users.id),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const notifications = sqliteTable("notifications", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => users.id),
	title: text("title").notNull(),
	message: text("message").notNull(),
	type: text("type", { enum: ["info", "warning", "error", "success"] })
		.notNull()
		.default("info"),
	read: integer("read", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable("app_settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
