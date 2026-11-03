/**
 * One-time upgrade of a SvelteForge v1.x database to the v2 (Better Auth) auth schema.
 *
 *   pnpm db:migrate-v2            # backs up the DB to <file>.pre-v2.bak, then migrates
 *
 * What it keeps: every user, their role, avatar, and password (Argon2id hashes move
 * to `accounts.password`, so existing passwords keep working), plus Google/GitHub
 * links (moved from `oauth_accounts` to `accounts`). Content, notifications and
 * settings are untouched.
 *
 * What it drops: all sessions (everyone signs in again) and pending password-reset
 * tokens. Run it BEFORE `pnpm db:push` — `db:push` alone would drop `password_hash`
 * without copying it.
 *
 * Runs outside SvelteKit (like seed.ts), so it uses relative imports only.
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

type SqliteDb = Database.Database;

function columns(sqlite: SqliteDb, table: string): string[] {
	return (sqlite.pragma(`table_info(${table})`) as { name: string }[]).map((c) => c.name);
}

function tableExists(sqlite: SqliteDb, table: string): boolean {
	return !!sqlite
		.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get(table);
}

export function needsV2AuthMigration(sqlite: SqliteDb): boolean {
	return tableExists(sqlite, "users") && columns(sqlite, "users").includes("password_hash");
}

export type MigrationReport = {
	users: number;
	credentialAccounts: number;
	oauthAccounts: number;
	droppedSessions: number;
};

export function migrateToV2Auth(sqlite: SqliteDb): MigrationReport {
	if (!needsV2AuthMigration(sqlite)) {
		throw new Error("Database is not a SvelteForge v1 database (users.password_hash not found).");
	}

	// Table rebuilds below must not trip FK checks mid-way; integrity is verified at the end.
	sqlite.pragma("foreign_keys = OFF");
	try {
		const report = sqlite.transaction((): MigrationReport => {
			const count = (sql: string) => (sqlite.prepare(sql).get() as { n: number }).n;
			const hasOauth = tableExists(sqlite, "oauth_accounts");
			const hasSessions = tableExists(sqlite, "sessions");

			const report: MigrationReport = {
				users: count("SELECT count(*) AS n FROM users"),
				credentialAccounts: 0,
				oauthAccounts: 0,
				droppedSessions: hasSessions ? count("SELECT count(*) AS n FROM sessions") : 0,
			};

			sqlite.exec(`
				CREATE TABLE accounts (
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
				CREATE INDEX accounts_user_id_idx ON accounts (user_id);
				CREATE UNIQUE INDEX accounts_provider_account_idx ON accounts (provider_id, account_id);

				CREATE TABLE verifications (
					id text PRIMARY KEY NOT NULL,
					identifier text NOT NULL,
					value text NOT NULL,
					expires_at integer NOT NULL,
					created_at integer NOT NULL,
					updated_at integer NOT NULL
				);
				CREATE INDEX verifications_identifier_idx ON verifications (identifier);
			`);

			// Passwords: users.password_hash → accounts(provider_id = 'credential').
			const insertAccount = sqlite.prepare(`
				INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
				VALUES (@id, @accountId, @providerId, @userId, @password, @createdAt, @createdAt)
			`);
			const userRows = sqlite.prepare("SELECT id, password_hash, created_at FROM users").all() as {
				id: string;
				password_hash: string | null;
				created_at: number;
			}[];
			for (const u of userRows) {
				if (!u.password_hash) continue;
				insertAccount.run({
					id: randomUUID(),
					accountId: u.id,
					providerId: "credential",
					userId: u.id,
					password: u.password_hash,
					createdAt: u.created_at,
				});
				report.credentialAccounts++;
			}

			// OAuth links: oauth_accounts(provider, provider_user_id) → accounts.
			if (hasOauth) {
				const oauthRows = sqlite
					.prepare("SELECT user_id, provider, provider_user_id, created_at FROM oauth_accounts")
					.all() as {
					user_id: string;
					provider: string;
					provider_user_id: string;
					created_at: number;
				}[];
				for (const o of oauthRows) {
					insertAccount.run({
						id: randomUUID(),
						accountId: o.provider_user_id,
						providerId: o.provider,
						userId: o.user_id,
						password: null,
						createdAt: o.created_at,
					});
					report.oauthAccounts++;
				}
			}

			// Users: add Better Auth / plugin columns, drop password_hash.
			sqlite.exec(`
				ALTER TABLE users ADD COLUMN email_verified integer DEFAULT false NOT NULL;
				ALTER TABLE users ADD COLUMN display_username text;
				ALTER TABLE users ADD COLUMN banned integer DEFAULT false NOT NULL;
				ALTER TABLE users ADD COLUMN ban_reason text;
				ALTER TABLE users ADD COLUMN ban_expires integer;
				UPDATE users SET display_username = username;
				ALTER TABLE users DROP COLUMN password_hash;
			`);
			// Google/GitHub only linked verified addresses in v1.
			if (hasOauth) {
				sqlite.exec(
					"UPDATE users SET email_verified = true WHERE id IN (SELECT user_id FROM oauth_accounts)"
				);
			}

			// Sessions change shape (token column, Date expiry); old ones can't be carried over.
			sqlite.exec(`
				DROP TABLE IF EXISTS sessions;
				CREATE TABLE sessions (
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
				CREATE UNIQUE INDEX sessions_token_unique ON sessions (token);
				CREATE INDEX sessions_user_id_idx ON sessions (user_id);

				DROP TABLE IF EXISTS oauth_accounts;
				DROP TABLE IF EXISTS password_reset_tokens;
			`);

			const violations = sqlite.pragma("foreign_key_check") as unknown[];
			if (violations.length > 0) {
				throw new Error(`Foreign key check failed: ${JSON.stringify(violations.slice(0, 5))}`);
			}
			return report;
		})();
		return report;
	} finally {
		sqlite.pragma("foreign_keys = ON");
	}
}

async function main() {
	const dbPath = process.env.DATABASE_URL || "svelteforge.db";
	if (!existsSync(dbPath)) {
		console.error(`Database not found at ${dbPath}. Set DATABASE_URL.`);
		process.exit(1);
	}
	const sqlite = new Database(dbPath);
	if (!needsV2AuthMigration(sqlite)) {
		console.log("Nothing to do: this database already uses the v2 auth schema.");
		sqlite.close();
		return;
	}

	const backupPath = `${dbPath}.pre-v2.bak`;
	await sqlite.backup(backupPath);
	console.log(`Backup written to ${backupPath}`);

	const report = migrateToV2Auth(sqlite);
	sqlite.close();
	console.log(
		`Migrated ${report.users} users: ${report.credentialAccounts} password logins, ` +
			`${report.oauthAccounts} OAuth links. Dropped ${report.droppedSessions} sessions — ` +
			"everyone needs to sign in again."
	);
	console.log("Next: set BETTER_AUTH_SECRET, update OAuth redirect URIs, then `pnpm db:push`.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error("Migration failed (database unchanged):", err);
		process.exit(1);
	});
}
