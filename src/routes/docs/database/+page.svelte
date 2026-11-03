<svelte:head>
	<title>Database - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Learn how SvelteForge Admin uses SQLite with Drizzle ORM and better-sqlite3 in WAL mode. Complete schema reference, migrations, seeding, and query patterns for your Svelte 5 and SvelteKit admin dashboard."
	/>
</svelte:head>

<h1>Database</h1>

<p>
	SvelteForge Admin uses <strong>SQLite</strong> as its database, accessed through
	<strong>Drizzle ORM</strong> with the <strong>better-sqlite3</strong> driver. This gives your
	<strong>Svelte 5</strong> and <strong>SvelteKit</strong> application a zero-configuration, high-performance
	database that lives as a single file in your project root.
</p>

<h2>Why SQLite</h2>

<p>
	SQLite is the ideal database for <strong>SvelteKit</strong> admin dashboards and internal tools:
</p>

<ul>
	<li>
		<strong>Zero configuration</strong> — No database server to install, configure, or maintain.
		Just a single file (<code>svelteforge.db</code>) in your project root.
	</li>
	<li>
		<strong>Simple local setup</strong> — Embedded SQLite needs no separate database service. With WAL
		mode enabled, concurrent reads never block each other.
	</li>
	<li>
		<strong>Perfect for deployment</strong> — Deploy your <strong>SvelteKit</strong> app with its database
		as a single unit. No connection strings to manage, no cold start latency.
	</li>
	<li>
		<strong>Type-safe with Drizzle</strong> — Drizzle ORM provides full TypeScript inference from
		your schema, catching query errors at compile time in your <strong>Svelte 5</strong> components and
		SvelteKit server routes.
	</li>
</ul>

<h2>Connection Setup</h2>

<p>
	The database connection is established in <code>src/lib/server/db/index.ts</code>. Because this
	file lives inside <strong>SvelteKit's</strong> <code>#lib/server/</code> directory, it is
	guaranteed to never leak to the client bundle — a key security feature of
	<strong>SvelteKit's</strong> module system.
</p>

<pre><code class="language-typescript"
		>// src/lib/server/db/index.ts
import Database from "better-sqlite3";
import &#123; drizzle &#125; from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const dbPath = process.env.DATABASE_URL || "svelteforge.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, &#123; schema &#125;);</code
	></pre>

<p>Key details:</p>

<ul>
	<li>
		<strong>WAL journal mode</strong> — Write-Ahead Logging allows concurrent reads while a write is
		in progress. This is critical for <strong>SvelteKit</strong> apps where multiple server-side load
		functions may query simultaneously.
	</li>
	<li>
		<strong><code>DATABASE_URL</code> env var</strong> — Defaults to
		<code>svelteforge.db</code> in the project root. Override it in production to point to a persistent
		volume.
	</li>
	<li>
		<strong>Full schema import</strong> — Passing the entire schema to <code>drizzle()</code>
		enables Drizzle's relational query API (<code>db.query.users.findFirst()</code>, etc.).
	</li>
</ul>

<h2>Schema Deep Dive</h2>

<p>
	The complete database schema is defined in <code>src/lib/server/db/schema.ts</code> using Drizzle
	ORM's SQLite table builder. Every table, column, type, constraint, and default is defined in
	TypeScript — giving your <strong>Svelte 5</strong> components and
	<strong>SvelteKit</strong> server routes full type inference.
</p>

<h3>Auth Tables</h3>

<p>
	The <code>users</code>, <code>sessions</code>, <code>accounts</code>, and
	<code>verifications</code> tables are owned by <strong>Better Auth</strong>. The JavaScript
	property names in the schema are the field names Better Auth expects, while the SQL columns stay
	snake_case. If you add Better Auth plugins that need extra columns, regenerate the definitions
	with <code>npx @better-auth/cli generate</code>.
</p>

<h3>Users Table</h3>

<p>
	The <code>users</code> table stores all registered accounts with role-based access control. The
	first user to register gets the <code>admin</code> role automatically. Passwords are no longer
	stored here; they live in <code>accounts.password</code>.
</p>

<pre><code class="language-typescript"
		>export const users = sqliteTable("users", &#123;
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", &#123; mode: "boolean" &#125;).notNull().default(false),
  avatarUrl: text("avatar_url"),
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  role: text("role", &#123; enum: ROLES &#125;).notNull().default("viewer"),
  banned: integer("banned", &#123; mode: "boolean" &#125;).notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", &#123; mode: "timestamp" &#125;),
  createdAt: integer("created_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
  updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>id</code></td>
			<td>text</td>
			<td>PRIMARY KEY</td>
			<td>Generated by Better Auth</td>
		</tr>
		<tr>
			<td><code>name</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>Display name</td>
		</tr>
		<tr>
			<td><code>email</code></td>
			<td>text</td>
			<td>NOT NULL, UNIQUE</td>
			<td>Stored lowercase</td>
		</tr>
		<tr>
			<td><code>emailVerified</code></td>
			<td>integer (boolean)</td>
			<td>NOT NULL, default false</td>
			<td>Decides whether an email change needs a confirmation link</td>
		</tr>
		<tr>
			<td><code>avatarUrl</code></td>
			<td>text</td>
			<td>nullable</td>
			<td
				>Profile image URL (Better Auth's <code>image</code> field, remapped in
				<code>auth.ts</code>)</td
			>
		</tr>
		<tr>
			<td><code>username</code></td>
			<td>text</td>
			<td>NOT NULL, UNIQUE</td>
			<td>3-31 chars, lowercase alphanumeric + hyphens/underscores (username plugin)</td>
		</tr>
		<tr>
			<td><code>displayUsername</code></td>
			<td>text</td>
			<td>nullable</td>
			<td>Username as originally typed (username plugin)</td>
		</tr>
		<tr>
			<td><code>role</code></td>
			<td>text enum</td>
			<td>NOT NULL, default "viewer"</td>
			<td>One of: admin, editor, viewer (admin plugin)</td>
		</tr>
		<tr>
			<td><code>banned</code>, <code>banReason</code>, <code>banExpires</code></td>
			<td>boolean, text, timestamp</td>
			<td>banned NOT NULL, default false</td>
			<td>Ban state managed by the admin plugin</td>
		</tr>
		<tr>
			<td><code>createdAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert, returns Date object</td>
		</tr>
		<tr>
			<td><code>updatedAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert, returns Date object</td>
		</tr>
	</tbody>
</table>

<h3>Sessions Table</h3>

<p>
	Each row is one signed-in browser. The <code>token</code> is a random bearer value; the cookie
	carries it HMAC-signed with <code>BETTER_AUTH_SECRET</code>, so a leaked database alone cannot be
	turned into a valid session cookie. Deleting a user cascades to their sessions.
</p>

<pre><code class="language-typescript"
		>export const sessions = sqliteTable("sessions", &#123;
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() =&gt; users.id, &#123; onDelete: "cascade" &#125;),
  expiresAt: integer("expires_at", &#123; mode: "timestamp" &#125;).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"),
  createdAt: integer("created_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
  updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>id</code></td>
			<td>text</td>
			<td>PRIMARY KEY</td>
			<td>Session identifier (safe to send to the browser)</td>
		</tr>
		<tr>
			<td><code>token</code></td>
			<td>text</td>
			<td>NOT NULL, UNIQUE</td>
			<td>Bearer token. Never send it to the client</td>
		</tr>
		<tr>
			<td><code>userId</code></td>
			<td>text</td>
			<td>NOT NULL, FK &rarr; users.id (cascade)</td>
			<td>Owner of the session</td>
		</tr>
		<tr>
			<td><code>expiresAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>30 days from creation, slid forward when less than 15 days remain</td>
		</tr>
		<tr>
			<td><code>ipAddress</code>, <code>userAgent</code></td>
			<td>text</td>
			<td>nullable</td>
			<td>Recorded when the session is created</td>
		</tr>
		<tr>
			<td><code>impersonatedBy</code></td>
			<td>text</td>
			<td>nullable</td>
			<td>Admin plugin field. Unused in the free edition</td>
		</tr>
		<tr>
			<td><code>createdAt</code>, <code>updatedAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set</td>
		</tr>
	</tbody>
</table>

<h3>Pages Table</h3>

<p>
	The content management system stores pages with three templates and a status workflow. The
	<code>authorId</code> foreign key links each page to its creator in the users table.
</p>

<pre><code class="language-typescript"
		>export const pages = sqliteTable("pages", &#123;
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  template: text("template", &#123; enum: ["default", "landing", "blog"] &#125;)
    .notNull()
    .default("default"),
  status: text("status", &#123; enum: ["draft", "published", "archived"] &#125;)
    .notNull()
    .default("draft"),
  authorId: text("author_id")
    .notNull()
    .references(() =&gt; users.id),
  createdAt: integer("created_at", &#123; mode: "timestamp" &#125;)
    .notNull()
    .$defaultFn(() =&gt; new Date()),
  updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;)
    .notNull()
    .$defaultFn(() =&gt; new Date()),
  publishedAt: integer("published_at", &#123; mode: "timestamp" &#125;),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>id</code></td>
			<td>text</td>
			<td>PRIMARY KEY</td>
			<td>Cryptographic random ID</td>
		</tr>
		<tr>
			<td><code>title</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>Page title</td>
		</tr>
		<tr>
			<td><code>slug</code></td>
			<td>text</td>
			<td>NOT NULL, UNIQUE</td>
			<td>URL-friendly identifier</td>
		</tr>
		<tr>
			<td><code>content</code></td>
			<td>text</td>
			<td>NOT NULL, default ""</td>
			<td>Page body content</td>
		</tr>
		<tr>
			<td><code>template</code></td>
			<td>text enum</td>
			<td>NOT NULL, default "default"</td>
			<td>One of: default, landing, blog</td>
		</tr>
		<tr>
			<td><code>status</code></td>
			<td>text enum</td>
			<td>NOT NULL, default "draft"</td>
			<td>One of: draft, published, archived</td>
		</tr>
		<tr>
			<td><code>authorId</code></td>
			<td>text</td>
			<td>NOT NULL, FK &rarr; users.id</td>
			<td>Page author</td>
		</tr>
		<tr>
			<td><code>createdAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert</td>
		</tr>
		<tr>
			<td><code>updatedAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert</td>
		</tr>
		<tr>
			<td><code>publishedAt</code></td>
			<td>integer (timestamp)</td>
			<td>nullable</td>
			<td>Set when status changes to published</td>
		</tr>
	</tbody>
</table>

<h3>Notifications Table</h3>

<p>
	Notifications can be user-specific or global (when <code>userId</code> is null). The
	<strong>SvelteKit</strong> app layout queries both types for the authenticated user's notification bell.
</p>

<pre><code class="language-typescript"
		>export const notifications = sqliteTable("notifications", &#123;
  id: text("id").primaryKey(),
  userId: text("user_id").references(() =&gt; users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", &#123; enum: ["info", "warning", "error", "success"] &#125;)
    .notNull()
    .default("info"),
  read: integer("read", &#123; mode: "boolean" &#125;).notNull().default(false),
  createdAt: integer("created_at", &#123; mode: "timestamp" &#125;)
    .notNull()
    .$defaultFn(() =&gt; new Date()),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>id</code></td>
			<td>text</td>
			<td>PRIMARY KEY</td>
			<td>Cryptographic random ID</td>
		</tr>
		<tr>
			<td><code>userId</code></td>
			<td>text</td>
			<td>nullable, FK &rarr; users.id</td>
			<td>Null = global notification for all users</td>
		</tr>
		<tr>
			<td><code>title</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>Notification title</td>
		</tr>
		<tr>
			<td><code>message</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>Notification body text</td>
		</tr>
		<tr>
			<td><code>type</code></td>
			<td>text enum</td>
			<td>NOT NULL, default "info"</td>
			<td>One of: info, warning, error, success</td>
		</tr>
		<tr>
			<td><code>read</code></td>
			<td>integer (boolean)</td>
			<td>NOT NULL, default false</td>
			<td>SQLite stores booleans as 0/1 integers</td>
		</tr>
		<tr>
			<td><code>createdAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert</td>
		</tr>
	</tbody>
</table>

<h3>Accounts Table</h3>

<p>
	One row per login method for a user. Email/password users have
	<code>providerId = "credential"</code> and their Argon2id hash in <code>password</code>; OAuth
	users have <code>providerId = "google"</code> or <code>"github"</code>. This table replaces both
	the old <code>users.password_hash</code> column and the <code>oauth_accounts</code> table. A
	unique index on <code>(providerId, accountId)</code> prevents duplicate links.
</p>

<pre><code class="language-typescript"
		>export const accounts = sqliteTable(
  "accounts",
  &#123;
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() =&gt; users.id, &#123; onDelete: "cascade" &#125;),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", &#123; mode: "timestamp" &#125;),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", &#123; mode: "timestamp" &#125;),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
    updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
  &#125;,
  (table) =&gt; [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_idx").on(table.providerId, table.accountId),
  ]
);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>providerId</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td><code>credential</code>, <code>google</code>, or <code>github</code></td>
		</tr>
		<tr>
			<td><code>accountId</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>The user ID for credential accounts; the provider's user ID for OAuth</td>
		</tr>
		<tr>
			<td><code>userId</code></td>
			<td>text</td>
			<td>NOT NULL, FK &rarr; users.id (cascade)</td>
			<td>Linked user account</td>
		</tr>
		<tr>
			<td><code>password</code></td>
			<td>text</td>
			<td>nullable</td>
			<td>Argon2id hash. Only set for credential accounts</td>
		</tr>
		<tr>
			<td
				><code>accessToken</code>, <code>refreshToken</code>, <code>idToken</code>,
				<code>scope</code></td
			>
			<td>text</td>
			<td>nullable</td>
			<td>OAuth tokens and granted scopes, with matching <code>*ExpiresAt</code> timestamps</td>
		</tr>
	</tbody>
</table>

<h3>Verifications Table</h3>

<p>
	Short-lived tokens for password resets, email-change confirmations, and OAuth state. This replaces
	the old <code>password_reset_tokens</code> table. Better Auth's default is to store the identifier
	in plain text; SvelteForge sets <code>verification.storeIdentifier: "hashed"</code> so only SHA-256
	hashes reach the database.
</p>

<pre><code class="language-typescript"
		>export const verifications = sqliteTable(
  "verifications",
  &#123;
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", &#123; mode: "timestamp" &#125;).notNull(),
    createdAt: integer("created_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
    updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;).notNull().$defaultFn(() =&gt; new Date()),
  &#125;,
  (table) =&gt; [index("verifications_identifier_idx").on(table.identifier)]
);</code
	></pre>

<h3>App Settings Table</h3>

<p>
	A simple key-value store for application-wide configuration. The <code>key</code> column is the primary
	key — no separate ID needed.
</p>

<pre><code class="language-typescript"
		>export const appSettings = sqliteTable("app_settings", &#123;
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", &#123; mode: "timestamp" &#125;)
    .notNull()
    .$defaultFn(() =&gt; new Date()),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Constraints</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>key</code></td>
			<td>text</td>
			<td>PRIMARY KEY</td>
			<td>Setting name (e.g., "siteName", "maintenanceMode")</td>
		</tr>
		<tr>
			<td><code>value</code></td>
			<td>text</td>
			<td>NOT NULL</td>
			<td>Setting value as string</td>
		</tr>
		<tr>
			<td><code>updatedAt</code></td>
			<td>integer (timestamp)</td>
			<td>NOT NULL</td>
			<td>Auto-set on insert</td>
		</tr>
	</tbody>
</table>

<h3>Timestamp Modes</h3>

<p>
	Drizzle ORM's <code>&#123; mode: "timestamp" &#125;</code> option on integer columns controls how values
	are serialized:
</p>

<ul>
	<li>
		<strong>With <code>mode: "timestamp"</code></strong> — Drizzle automatically converts between
		JavaScript <code>Date</code> objects and Unix timestamps. Used for <code>createdAt</code>,
		<code>updatedAt</code>, and <code>publishedAt</code> across most tables.
	</li>
	<li>
		<strong>Without <code>mode: "timestamp"</code></strong> — The column stores and returns raw
		integers. Used for <code>sessions.expiresAt</code> which stores milliseconds since epoch for precise
		expiry comparisons without Date conversion overhead.
	</li>
</ul>

<h3>Type Exports</h3>

<p>
	The schema file also exports inferred TypeScript types for use throughout the <strong
		>SvelteKit</strong
	> application:
</p>

<pre><code class="language-typescript"
		>export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;</code
	></pre>

<h2>ID Generation</h2>

<p>
	Application rows (pages, notifications, seed data) get IDs from <code>generateId()</code> in
	<code>src/lib/server/id.ts</code>. The auth tables use Better Auth's own ID generator.
</p>

<pre><code class="language-typescript"
		>// src/lib/server/id.ts
import &#123; randomBytes &#125; from "node:crypto";

export function generateId(length: number = 15): string &#123;
  const bytes = randomBytes(length);
  // ... encode as lowercase base32 without padding ...
&#125;</code
	></pre>

<ul>
	<li>
		<strong>Cryptographically secure</strong> — Uses <code>node:crypto</code>'s
		<code>randomBytes()</code>.
	</li>
	<li>
		<strong>Base32 encoded</strong> — Lowercase, no padding. URL-safe and case-insensitive. The encoder
		is a small built-in function, so no encoding package is needed.
	</li>
	<li>
		<strong>Default length: 15 bytes</strong> — Produces a 24-character string with 120 bits of
		entropy. The seed script uses <code>generateId(10)</code> for shorter IDs.
	</li>
</ul>

<h2>Migrations &amp; Schema Changes</h2>

<p>
	SvelteForge Admin uses <strong>Drizzle Kit</strong> for database migrations. The configuration
	lives in <code>drizzle.config.ts</code>:
</p>

<pre><code class="language-typescript"
		>// drizzle.config.ts
import &#123; defineConfig &#125; from "drizzle-kit";

export default defineConfig(&#123;
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: &#123;
    url: "svelteforge.db",
  &#125;,
&#125;);</code
	></pre>

<h3>Available Commands</h3>

<table>
	<thead>
		<tr>
			<th>Command</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>pnpm db:push</code></td>
			<td>Push schema changes directly to the database (development)</td>
		</tr>
		<tr>
			<td><code>pnpm db:generate</code></td>
			<td>Generate SQL migration files in the <code>./drizzle</code> directory</td>
		</tr>
		<tr>
			<td><code>pnpm db:studio</code></td>
			<td>Open Drizzle Studio GUI in your browser to inspect/edit data</td>
		</tr>
		<tr>
			<td><code>pnpm db:seed</code></td>
			<td>Seed the database with sample data</td>
		</tr>
	</tbody>
</table>

<p>
	Upgrading a v1.x database? Run <code>pnpm db:migrate-v2</code> <strong>before</strong>
	<code>pnpm db:push</code>; see <a href="/docs/upgrading">Upgrading</a>.
</p>

<h3>Step-by-Step: Changing the Schema</h3>

<ol>
	<li>
		<strong>Edit the schema</strong> — Modify <code>src/lib/server/db/schema.ts</code> (add columns, tables,
		constraints).
	</li>
	<li>
		<strong>Push changes</strong> — Run <code>pnpm db:push</code> to apply changes directly to your local
		SQLite database.
	</li>
	<li>
		<strong>Update test utilities</strong> — If you have tests, update the
		<code>SCHEMA_SQL</code> constant in <code>test-utils.ts</code> to match the new schema. Tests use
		an in-memory SQLite database that is created from this SQL string.
	</li>
	<li>
		<strong>Generate migrations (optional)</strong> — For production deployments, run
		<code>pnpm db:generate</code> to create versioned SQL migration files.
	</li>
</ol>

<h2>Database Seeding</h2>

<p>
	The seed script at <code>src/lib/server/db/seed.ts</code> populates the database with realistic sample
	data. Run it with:
</p>

<pre><code class="language-bash">pnpm db:seed</code></pre>

<h3>What Gets Created</h3>

<table>
	<thead>
		<tr>
			<th>Entity</th>
			<th>Count</th>
			<th>Details</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Users</strong></td>
			<td>50</td>
			<td
				>Realistic 12-month growth curve (2 users/month early, 7 users/month recent). Mix of admin,
				editor, and viewer roles.</td
			>
		</tr>
		<tr>
			<td><strong>Pages</strong></td>
			<td>65</td>
			<td
				>Across all templates (default, landing, blog) and statuses. Earlier months mostly
				published, recent months more drafts.</td
			>
		</tr>
		<tr>
			<td><strong>Notifications</strong></td>
			<td>33</td>
			<td
				>Mix of info, warning, error, and success types. Older ones marked as read, recent ones
				unread.</td
			>
		</tr>
		<tr>
			<td><strong>App Settings</strong></td>
			<td>4</td>
			<td>siteName, timezone, defaultRole, maintenanceMode</td>
		</tr>
	</tbody>
</table>

<h3>Key Details</h3>

<ul>
	<li>
		<strong>All passwords:</strong> <code>password123</code> — Stored as credential accounts in
		<code>accounts.password</code>, hashed with Argon2id (memoryCost: 19456, timeCost: 2, outputLen:
		32, parallelism: 1).
	</li>
	<li>
		<strong>Login with:</strong> username <code>admin</code> (email
		<code>admin@svelteforge.dev</code>) / <code>password123</code>, or any seeded user with
		<code>password123</code>.
	</li>
	<li>
		<strong>Realistic timestamps:</strong> Uses a <code>daysAgo()</code> helper to create dates spread
		across the past 12 months.
	</li>
	<li>
		<strong>Runs outside SvelteKit:</strong> The seed script is executed via the locally installed
		<code>tsx</code>, not through <strong>SvelteKit's</strong>
		Vite server. This means it uses relative imports (<code>./index.js</code>,
		<code>../id.js</code>) instead of
		<code>#lib/</code> aliases.
	</li>
</ul>

<h2>Drizzle Studio</h2>

<p>
	Drizzle Studio provides a browser-based GUI for inspecting and editing your SQLite database.
	Launch it with:
</p>

<pre><code class="language-bash">pnpm db:studio</code></pre>

<p>
	This opens a visual interface where you can browse tables, run queries, edit rows, and inspect
	relationships — useful during development of your <strong>Svelte 5</strong> components and
	<strong>SvelteKit</strong> server routes.
</p>

<h2>Querying Patterns</h2>

<p>
	Here are common Drizzle ORM query patterns used throughout the <strong>SvelteKit</strong> server routes
	in SvelteForge Admin.
</p>

<h3>Select All Records</h3>

<pre><code class="language-typescript"
		>import &#123; db &#125; from "#lib/server/db/index.js";
import &#123; users &#125; from "#lib/server/db/schema.js";

// Select specific columns
const allUsers = await db
  .select(&#123;
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  &#125;)
  .from(users)
  .orderBy(users.createdAt);</code
	></pre>

<h3>Find One Record</h3>

<pre><code class="language-typescript"
		>import &#123; eq &#125; from "drizzle-orm";

// Using the relational query API
const user = await db.query.users.findFirst(&#123;
  where: eq(users.email, "admin@svelteforge.dev"),
&#125;);</code
	></pre>

<h3>Insert a Record</h3>

<pre><code class="language-typescript"
		>import &#123; generateId &#125; from "#lib/server/id.js";

await db.insert(users).values(&#123;
  id: generateId(10),
  email: "new@example.com",
  username: "newuser",
  name: "New User",
  role: "viewer",
&#125;);

// Don't insert users for sign-in yourself: use auth.api.signUpEmail() or
// auth.api.createUser() so Better Auth also creates the credential account.</code
	></pre>

<h3>Update a Record</h3>

<pre><code class="language-typescript"
		>import &#123; eq &#125; from "drizzle-orm";

await db
  .update(users)
  .set(&#123; role: "editor", updatedAt: new Date() &#125;)
  .where(eq(users.id, userId));</code
	></pre>

<h3>Delete Records</h3>

<pre><code class="language-typescript"
		>import &#123; eq &#125; from "drizzle-orm";

await db.delete(users).where(eq(users.id, userId));</code
	></pre>

<h3>Aggregation with SQL</h3>

<pre><code class="language-typescript"
		>import &#123; sql, eq, and, or, isNull &#125; from "drizzle-orm";

// Count unread notifications for a user (including global ones)
const [result] = await db
  .select(&#123; count: sql&lt;number&gt;`count(*)` &#125;)
  .from(notifications)
  .where(
    and(
      eq(notifications.read, false),
      or(
        eq(notifications.userId, userId),
        isNull(notifications.userId)
      )
    )
  );</code
	></pre>

<h3>Pattern Matching (LIKE)</h3>

<pre><code class="language-typescript"
		>import &#123; sql, or &#125; from "drizzle-orm";

const pattern = `%$&#123;searchQuery&#125;%`;
const results = await db
  .select(&#123; id: users.id, name: users.name &#125;)
  .from(users)
  .where(or(
    sql`$&#123;users.name&#125; LIKE $&#123;pattern&#125;`,
    sql`$&#123;users.email&#125; LIKE $&#123;pattern&#125;`
  ))
  .limit(10);</code
	></pre>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin demonstrates a solid SQLite + Drizzle ORM setup for
				<strong>Svelte 5</strong> and <strong>SvelteKit</strong>. Need more advanced database
				patterns? DashboardPack premium templates include multi-tenant schemas, advanced CRUD
				interfaces with pagination/filtering/sorting, data import/export, and production-grade
				database management UIs.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex (Svelte)</strong> — SvelteKit admin with 6 dashboards, advanced data tables, and
					full CRUD operations
				</li>
				<li>
					<strong>Zenith</strong> — Analytics dashboard with complex aggregation queries and real-time
					data
				</li>
				<li>
					<strong>Signal</strong> — Monitoring dashboard with database health metrics and query performance
					tracking
				</li>
			</ul>
		</div>
		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="https://dashboardpack.com/theme-details/svelteforge-premium/?utm_source=svelteforge&utm_medium=docs&utm_content=docs-database&utm_campaign=upgrade-svelteforge-premium"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
			>
				Go Premium
			</a>
			<a
				href="https://dashboardpack.com/theme-details/apex-dashboard-svelte/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:text-primary/80 text-center text-xs font-medium transition-colors"
			>
				Preview Apex (Svelte)
			</a>
		</div>
	</div>
</div>
