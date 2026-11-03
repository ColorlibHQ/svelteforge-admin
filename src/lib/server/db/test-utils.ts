import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { hashPassword } from "../password.js";
import { generateId } from "../id.js";

// Mirrors schema.ts. After changing the schema, regenerate this with `pnpm db:generate`
// (or drizzle-kit against a scratch dir) and paste the CREATE statements here.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	email text NOT NULL,
	email_verified integer DEFAULT false NOT NULL,
	avatar_url text,
	username text NOT NULL,
	display_username text,
	role text DEFAULT 'viewer' NOT NULL,
	banned integer DEFAULT false NOT NULL,
	ban_reason text,
	ban_expires integer,
	created_at integer NOT NULL,
	updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);
CREATE TABLE IF NOT EXISTS sessions (
	id text PRIMARY KEY NOT NULL,
	token text NOT NULL,
	user_id text NOT NULL,
	expires_at integer NOT NULL,
	ip_address text,
	user_agent text,
	impersonated_by text,
	created_at integer NOT NULL,
	updated_at integer NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_unique ON sessions (token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE TABLE IF NOT EXISTS accounts (
	id text PRIMARY KEY NOT NULL,
	account_id text NOT NULL,
	provider_id text NOT NULL,
	user_id text NOT NULL,
	access_token text,
	refresh_token text,
	id_token text,
	access_token_expires_at integer,
	refresh_token_expires_at integer,
	scope text,
	password text,
	created_at integer NOT NULL,
	updated_at integer NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_idx ON accounts (provider_id,account_id);
CREATE TABLE IF NOT EXISTS verifications (
	id text PRIMARY KEY NOT NULL,
	identifier text NOT NULL,
	value text NOT NULL,
	expires_at integer NOT NULL,
	created_at integer NOT NULL,
	updated_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS verifications_identifier_idx ON verifications (identifier);
CREATE TABLE IF NOT EXISTS pages (
	id text PRIMARY KEY NOT NULL,
	title text NOT NULL,
	slug text NOT NULL,
	content text DEFAULT '' NOT NULL,
	template text DEFAULT 'default' NOT NULL,
	status text DEFAULT 'draft' NOT NULL,
	author_id text NOT NULL,
	created_at integer NOT NULL,
	updated_at integer NOT NULL,
	published_at integer,
	FOREIGN KEY (author_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_unique ON pages (slug);
CREATE TABLE IF NOT EXISTS notifications (
	id text PRIMARY KEY NOT NULL,
	user_id text,
	title text NOT NULL,
	message text NOT NULL,
	type text DEFAULT 'info' NOT NULL,
	read integer DEFAULT false NOT NULL,
	created_at integer NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS app_settings (
	key text PRIMARY KEY NOT NULL,
	value text NOT NULL,
	updated_at integer NOT NULL
);
`;

export type TestDb = ReturnType<typeof createTestDb>;

export function createTestDb() {
	const sqlite = new Database(":memory:");
	sqlite.pragma("journal_mode = WAL");
	sqlite.exec(SCHEMA_SQL);
	return drizzle(sqlite, { schema });
}

/**
 * Module factory for `vi.mock("#lib/server/db/index.js", …)`.
 *
 * Better Auth captures the `db` object once, when `auth.ts` is first imported, but
 * tests create a fresh in-memory database per test. The proxy forwards every property
 * access to whatever `getDb()` returns at call time, so the auth singleton always
 * talks to the current test database.
 *
 *   let testDb: TestDb;
 *   vi.mock("#lib/server/db/index.js", async () =>
 *     (await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
 *   );
 */
export function mockDbModule(getDb: () => TestDb) {
	const db = new Proxy({} as TestDb, {
		get(_target, prop) {
			const current = getDb() as unknown as Record<PropertyKey, unknown>;
			const value = current[prop];
			return typeof value === "function" ? value.bind(current) : value;
		},
	});
	return { db };
}

let cachedPasswordHash: Promise<string> | undefined;

/** Insert a user with a credential account whose password is `password123`. */
export async function createTestUser(
	db: TestDb,
	overrides: Partial<{
		id: string;
		name: string;
		email: string;
		username: string;
		role: "admin" | "editor" | "viewer";
	}> = {}
) {
	const id = overrides.id ?? generateId(10);
	cachedPasswordHash ??= hashPassword("password123");
	const passwordHash = await cachedPasswordHash;
	const username = overrides.username ?? `user_${id.slice(0, 8)}`;

	await db.insert(schema.users).values({
		id,
		name: overrides.name ?? "Test User",
		email: overrides.email ?? `${id}@test.com`,
		username,
		displayUsername: username,
		role: overrides.role ?? "viewer",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	await db.insert(schema.accounts).values({
		id: generateId(10),
		accountId: id,
		providerId: "credential",
		userId: id,
		password: passwordHash,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return id;
}

/**
 * Create a real Better Auth session for `userId` and return request headers carrying
 * its signed session cookie — for actions that call `auth.api.*` with the caller's
 * headers.
 */
export async function createAuthHeaders(userId: string): Promise<Headers> {
	const { auth } = await import("../auth.js");
	const { makeSignature } = await import("better-auth/crypto");
	const ctx = await auth.$context;
	const session = await ctx.internalAdapter.createSession(userId);
	const signed = `${session.token}.${await makeSignature(session.token, ctx.secret)}`;
	const headers = new Headers();
	headers.set("cookie", `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(signed)}`);
	return headers;
}

export function createMockLocals(userId: string, role: string = "admin") {
	return {
		user: {
			id: userId,
			name: "Test User",
			email: "test@test.com",
			username: "testuser",
			role,
		},
		session: { id: "test-session", userId, expiresAt: new Date(Date.now() + 86400000) },
	};
}

export function createFormData(entries: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(entries)) {
		fd.set(key, value);
	}
	return fd;
}

export function createMockRequest(formData: FormData, headers?: HeadersInit): Request {
	return new Request("http://localhost", {
		method: "POST",
		body: formData,
		headers,
	});
}
