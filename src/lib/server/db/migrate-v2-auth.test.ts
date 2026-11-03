import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "./schema.js";
import { createTestDb, type TestDb } from "./test-utils.js";
import { hashPassword } from "../password.js";
import { migrateToV2Auth, needsV2AuthMigration } from "./migrate-v2-auth.js";

let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
	(await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);

const V1_SCHEMA = readFileSync(new URL("./fixtures/v1-schema.sql", import.meta.url), "utf8");

function tableShape(sqlite: Database.Database) {
	const tables = (
		sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
			name: string;
		}[]
	).map((t) => t.name);
	return Object.fromEntries(
		tables.map((t) => [
			t,
			(sqlite.pragma(`table_info(${t})`) as { name: string; type: string; notnull: number }[])
				.map((c) => `${c.name}:${c.type}:${c.notnull}`)
				.sort(),
		])
	);
}

async function createV1Db() {
	const sqlite = new Database(":memory:");
	sqlite.exec(V1_SCHEMA);
	const now = Math.floor(Date.now() / 1000);
	const insertUser = sqlite.prepare(
		"INSERT INTO users (id, email, username, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
	);
	insertUser.run(
		"u_admin",
		"admin@x.dev",
		"admin",
		await hashPassword("password123"),
		"Admin",
		"admin",
		now,
		now
	);
	insertUser.run(
		"u_gh",
		"gh@x.dev",
		"octo",
		await hashPassword("random-unknown"),
		"Octo",
		"viewer",
		now,
		now
	);
	sqlite
		.prepare("INSERT INTO oauth_accounts VALUES (?, ?, ?, ?, ?)")
		.run("o1", "u_gh", "github", "12345", now);
	sqlite
		.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)")
		.run("s1", "u_admin", Date.now() + 1e9, null, null, now);
	sqlite
		.prepare("INSERT INTO password_reset_tokens VALUES (?, ?, ?, ?)")
		.run("r1", "u_admin", "h", now + 3600);
	sqlite
		.prepare(
			"INSERT INTO pages (id, title, slug, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
		)
		.run("p1", "Hello", "hello", "u_gh", now, now);
	return sqlite;
}

describe("v1 → v2 auth migration", () => {
	let sqlite: Database.Database;

	beforeEach(async () => {
		sqlite = await createV1Db();
	});

	it("produces exactly the v2 schema", () => {
		expect(needsV2AuthMigration(sqlite)).toBe(true);
		migrateToV2Auth(sqlite);
		expect(needsV2AuthMigration(sqlite)).toBe(false);
		expect(tableShape(sqlite)).toEqual(tableShape(createTestDb().$client));
	});

	it("moves passwords and OAuth links, keeps content, drops sessions", () => {
		const report = migrateToV2Auth(sqlite);
		expect(report).toEqual({
			users: 2,
			credentialAccounts: 2,
			oauthAccounts: 1,
			droppedSessions: 1,
		});

		const accounts = sqlite
			.prepare(
				"SELECT user_id, provider_id, account_id, password IS NOT NULL AS has_pw FROM accounts ORDER BY provider_id, user_id"
			)
			.all();
		expect(accounts).toEqual([
			{ user_id: "u_admin", provider_id: "credential", account_id: "u_admin", has_pw: 1 },
			{ user_id: "u_gh", provider_id: "credential", account_id: "u_gh", has_pw: 1 },
			{ user_id: "u_gh", provider_id: "github", account_id: "12345", has_pw: 0 },
		]);
		expect(
			sqlite
				.prepare("SELECT username, display_username, email_verified FROM users ORDER BY id")
				.all()
		).toEqual([
			{ username: "admin", display_username: "admin", email_verified: 0 },
			{ username: "octo", display_username: "octo", email_verified: 1 },
		]);
		expect(sqlite.prepare("SELECT author_id FROM pages").get()).toEqual({ author_id: "u_gh" });
		expect(sqlite.prepare("SELECT count(*) AS n FROM sessions").get()).toEqual({ n: 0 });
	});

	it("lets existing users sign in with their v1 password", async () => {
		migrateToV2Auth(sqlite);
		testDb = drizzle(sqlite, { schema });
		const { auth } = await import("../auth.js");

		const result = await auth.api.signInUsername({
			body: { username: "admin", password: "password123" },
		});
		expect(result?.user).toMatchObject({ id: "u_admin", role: "admin" });
	});

	it("refuses to run twice", () => {
		migrateToV2Auth(sqlite);
		expect(() => migrateToV2Auth(sqlite)).toThrow(/not a SvelteForge v1 database/);
	});
});
