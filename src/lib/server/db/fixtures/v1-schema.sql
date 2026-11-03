-- SvelteForge v1.4 schema (pre-Better Auth). Fixture for migrate-v2-auth.test.ts.
CREATE TABLE IF NOT EXISTS users (
	id text PRIMARY KEY NOT NULL,
	email text NOT NULL,
	username text NOT NULL,
	password_hash text NOT NULL,
	name text NOT NULL,
	avatar_url text,
	role text DEFAULT 'viewer' NOT NULL,
	created_at integer NOT NULL,
	updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);

CREATE TABLE IF NOT EXISTS sessions (
	id text PRIMARY KEY NOT NULL,
	user_id text NOT NULL,
	expires_at integer NOT NULL,
	user_agent text,
	ip_address text,
	created_at integer,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
	id text PRIMARY KEY NOT NULL,
	user_id text NOT NULL,
	token_hash text NOT NULL,
	expires_at integer NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);

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

CREATE TABLE IF NOT EXISTS oauth_accounts (
	id text PRIMARY KEY NOT NULL,
	user_id text NOT NULL,
	provider text NOT NULL,
	provider_user_id text NOT NULL,
	created_at integer NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_provider_user_idx ON oauth_accounts (provider, provider_user_id);

CREATE TABLE IF NOT EXISTS app_settings (
	key text PRIMARY KEY NOT NULL,
	value text NOT NULL,
	updated_at integer NOT NULL
);
