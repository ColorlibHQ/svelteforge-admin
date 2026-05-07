<svelte:head>
	<title>Testing - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Complete testing guide for SvelteForge Admin — Vitest unit tests with in-memory SQLite, Playwright E2E tests, and testing patterns for Svelte 5 and SvelteKit form actions."
	/>
</svelte:head>

<h1>Testing</h1>

<p>
	SvelteForge Admin uses two complementary testing frameworks: <strong>Vitest</strong> for fast unit
	tests of server logic, and <strong>Playwright</strong> for end-to-end browser testing. Both are
	fully integrated into the <strong>SvelteKit</strong> project and designed to work with
	<strong>Svelte 5</strong> and the custom session-based auth system.
</p>

<p>
	The testing strategy focuses on server-side logic — load functions, form actions, database
	queries, and authorization checks — because that is where the critical business logic lives in a
	<strong>SvelteKit</strong> application. Client-side <strong>Svelte 5</strong> components are tested
	through Playwright E2E flows.
</p>

<h2>Vitest Setup</h2>

<p>
	Vitest is configured in <code>vite.config.ts</code> under the <code>test</code> key, inheriting
	<strong>SvelteKit's</strong> Vite configuration automatically. This means path aliases like
	<code>$lib</code> work in test files without additional configuration.
</p>

<pre><code class="language-ts"
		>// vite.config.ts
import &#123; sveltekit &#125; from "@sveltejs/kit/vite";
import &#123; defineConfig &#125; from "vitest/config";

export default defineConfig(&#123;
  plugins: [sveltekit()],
  test: &#123;
    include: ["src/**/*.test.ts"],
  &#125;,
&#125;);</code
	></pre>

<h3>Test Commands</h3>

<table>
	<thead>
		<tr>
			<th>Command</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>pnpm test</code></td>
			<td>Run all unit tests (single run, exits after completion)</td>
		</tr>
		<tr>
			<td><code>pnpm test:watch</code></td>
			<td>Run tests in watch mode (re-runs on file changes)</td>
		</tr>
		<tr>
			<td><code>npx vitest run src/routes/(app)/users/users.test.ts</code></td>
			<td>Run a single test file</td>
		</tr>
		<tr>
			<td><code>pnpm test:e2e</code></td>
			<td>Run Playwright end-to-end tests</td>
		</tr>
	</tbody>
</table>

<h2>Test Database Pattern</h2>

<p>
	This is the most critical pattern in SvelteForge's testing setup. Tests
	<strong>never touch the development database</strong>. Instead, each test gets a fresh in-memory
	SQLite database with the full schema applied. This ensures tests are fast, isolated, and
	repeatable.
</p>

<h3>How It Works</h3>

<p>
	The test database infrastructure lives in <code>test-utils.ts</code> and provides a
	<code>createTestDb()</code> function that:
</p>

<ol>
	<li>Creates a new in-memory SQLite database via <code>better-sqlite3</code></li>
	<li>Enables WAL mode for consistency with the production database</li>
	<li>Applies the full schema using raw SQL (the <code>SCHEMA_SQL</code> constant)</li>
	<li>Returns a Drizzle ORM instance ready for querying</li>
</ol>

<pre><code class="language-ts"
		>// test-utils.ts
import Database from "better-sqlite3";
import &#123; drizzle &#125; from "drizzle-orm/better-sqlite3";

const SCHEMA_SQL = `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    avatar_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  -- ... remaining tables (pages, notifications, appSettings, etc.)
`;

export function createTestDb() &#123;
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(SCHEMA_SQL);
  return drizzle(sqlite);
&#125;</code
	></pre>

<div class="not-prose my-6 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-4">
	<p class="text-foreground text-sm font-semibold">Important: Keep SCHEMA_SQL in Sync</p>
	<p class="text-muted-foreground mt-1 text-sm">
		After modifying <code>src/lib/server/db/schema.ts</code>, you <strong>must</strong> also update
		the <code>SCHEMA_SQL</code> string in <code>test-utils.ts</code> to match. Then run
		<code>pnpm db:push</code> to apply changes to the development database. Failing to keep these in sync
		will cause test failures with cryptic SQLite errors.
	</p>
</div>

<h3>The Mock Pattern (Critical)</h3>

<p>
	<strong>SvelteKit</strong> server modules import the database from
	<code>$lib/server/db/index.js</code>. Tests must intercept this import and redirect it to the
	in-memory test database. This requires a specific two-step pattern:
</p>

<pre><code class="language-ts"
		>import &#123; describe, it, expect, vi, beforeEach &#125; from "vitest";
import &#123; createTestDb, createTestUser, createMockLocals &#125; from "$lib/test-utils.js";

let testDb: ReturnType&lt;typeof createTestDb&gt;;

// Step 1: Set up the mock BEFORE importing the server module
vi.mock("$lib/server/db/index.js", () =&gt; (&#123;
  get db() &#123;
    return testDb;
  &#125;,
&#125;));

// Step 2: Dynamically import the module AFTER the mock is in place
const &#123; load, actions &#125; = await import("./+page.server.js");

describe("Users page", () =&gt; &#123;
  beforeEach(() =&gt; &#123;
    // Fresh database for every test
    testDb = createTestDb();
  &#125;);

  // ... tests ...
&#125;);</code
	></pre>

<h3>Why This Pattern?</h3>

<p>Two aspects of this pattern are non-obvious and worth understanding:</p>

<ol>
	<li>
		<strong>Why a getter?</strong> — The <code>get db()</code> getter is essential because
		<code>testDb</code> is reassigned in <code>beforeEach</code>. A plain property would capture the
		initial value of <code>testDb</code> (which is <code>undefined</code>), but a getter
		re-evaluates on every access, always returning the latest database instance.
	</li>
	<li>
		<strong>Why dynamic import?</strong> — The <code>await import("./+page.server.js")</code> must
		happen <strong>after</strong> <code>vi.mock()</code> is called. If you used a static
		<code>import</code> at the top of the file, the real database module would be loaded before the mock
		is set up, and your tests would hit the development database.
	</li>
</ol>

<h3>Type Assertion</h3>

<p>
	When calling load functions and form actions in tests, the return types can create TypeScript
	union type errors (because <strong>SvelteKit</strong> actions can return <code>void</code> in
	redirect cases). Use <code>as any</code> on the result to avoid these:
</p>

<pre><code class="language-ts"
		>const result = await actions.create(&#123;
  request: createMockRequest(formData),
  locals: createMockLocals(&#123; user: adminUser &#125;),
&#125;) as any;

expect(result.success).toBe(true);</code
	></pre>

<h2>Test Utilities</h2>

<p>
	The <code>test-utils.ts</code> file provides four helper functions that eliminate boilerplate in every
	test file:
</p>

<h3><code>createTestDb()</code></h3>

<p>
	Creates a fresh in-memory SQLite database with the full schema applied. Called in
	<code>beforeEach</code> to ensure test isolation.
</p>

<h3><code>createTestUser(db, overrides?)</code></h3>

<p>Inserts a user into the test database with sensible defaults and returns the user record:</p>

<pre><code class="language-ts"
		>const user = createTestUser(testDb, &#123;
  role: "admin",
  email: "admin@test.com",
  username: "admin",
&#125;);

// Defaults if not overridden:
// - id: random generated ID
// - name: "Test User"
// - email: "test@example.com"
// - username: "testuser"
// - password: hashed "password123"
// - role: "viewer"</code
	></pre>

<h3><code>createMockLocals(overrides?)</code></h3>

<p>
	Creates a mock <code>event.locals</code> object matching <strong>SvelteKit's</strong>
	<code>App.Locals</code> interface. Used when calling load functions and form actions:
</p>

<pre><code class="language-ts"
		>const locals = createMockLocals(&#123;
  user: &#123; id: "abc", role: "admin", name: "Admin" &#125;,
  session: &#123; id: "sess123", expiresAt: Date.now() + 86400000 &#125;,
&#125;);</code
	></pre>

<h3><code>createFormData(entries)</code></h3>

<p>
	Creates a <code>FormData</code> object from a plain key-value object. This is used to simulate form
	submissions in action tests:
</p>

<pre><code class="language-ts"
		>const formData = createFormData(&#123;
  name: "Jane Doe",
  email: "jane@example.com",
  role: "editor",
&#125;);</code
	></pre>

<h3><code>createMockRequest(formData)</code></h3>

<p>
	Wraps a <code>FormData</code> object in a <code>Request</code> with <code>method: "POST"</code>,
	ready to pass to <strong>SvelteKit</strong> form action handlers:
</p>

<pre><code class="language-ts"
		>const request = createMockRequest(formData);
// Equivalent to: new Request("http://localhost", &#123; method: "POST", body: formData &#125;)</code
	></pre>

<h2>Testing Form Actions</h2>

<p>
	<strong>SvelteKit</strong> form actions are the primary mutation mechanism in SvelteForge Admin. Here
	is a complete example testing a user creation action:
</p>

<pre><code class="language-ts"
		>describe("create action", () =&gt; &#123;
  it("creates a new user when admin submits valid data", async () =&gt; &#123;
    // Arrange: create an admin user
    const admin = createTestUser(testDb, &#123; role: "admin" &#125;);

    const formData = createFormData(&#123;
      name: "New User",
      email: "new@example.com",
      username: "newuser",
      password: "securepass123",
      role: "editor",
    &#125;);

    // Act: call the form action
    const result = await actions.create(&#123;
      request: createMockRequest(formData),
      locals: createMockLocals(&#123; user: admin &#125;),
    &#125;) as any;

    // Assert: check the result
    expect(result.success).toBe(true);

    // Assert: verify database state
    const users = testDb.select().from(usersTable).all();
    expect(users).toHaveLength(2); // admin + new user
    expect(users[1].email).toBe("new@example.com");
    expect(users[1].role).toBe("editor");
  &#125;);

  it("rejects creation when user is not admin", async () =&gt; &#123;
    const viewer = createTestUser(testDb, &#123; role: "viewer" &#125;);

    const formData = createFormData(&#123;
      name: "Hacker",
      email: "hack@example.com",
      username: "hacker",
      password: "password123",
      role: "admin",
    &#125;);

    const result = await actions.create(&#123;
      request: createMockRequest(formData),
      locals: createMockLocals(&#123; user: viewer &#125;),
    &#125;) as any;

    // Should return 403 failure
    expect(result.status).toBe(403);

    // Database should only have the original viewer
    const users = testDb.select().from(usersTable).all();
    expect(users).toHaveLength(1);
  &#125;);
&#125;);</code
	></pre>

<h2>Testing Server Loads</h2>

<p>
	<strong>SvelteKit</strong> load functions are tested by passing a mock event object with the
	appropriate <code>locals</code>:
</p>

<pre><code class="language-ts"
		>describe("load function", () =&gt; &#123;
  it("returns user list for admin", async () =&gt; &#123;
    // Seed the test database
    const admin = createTestUser(testDb, &#123; role: "admin" &#125;);
    createTestUser(testDb, &#123;
      email: "viewer@test.com",
      username: "viewer",
      role: "viewer",
    &#125;);

    // Call the load function
    const result = await load(&#123;
      locals: createMockLocals(&#123; user: admin &#125;),
      url: new URL("http://localhost/users"),
    &#125;) as any;

    // Assert returned data shape
    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toHaveProperty("id");
    expect(result.users[0]).toHaveProperty("email");
    expect(result.users[0]).toHaveProperty("role");

    // Password hashes should never be returned
    expect(result.users[0]).not.toHaveProperty("passwordHash");
  &#125;);

  it("restricts data for non-admin users", async () =&gt; &#123;
    const viewer = createTestUser(testDb, &#123; role: "viewer" &#125;);

    const result = await load(&#123;
      locals: createMockLocals(&#123; user: viewer &#125;),
      url: new URL("http://localhost/users"),
    &#125;) as any;

    // Viewers may see limited data or get redirected
    // depending on the page's authorization logic
  &#125;);
&#125;);</code
	></pre>

<h2>Test File Location</h2>

<p>
	Tests are <strong>co-located with their routes</strong>, following <strong>SvelteKit</strong>
	conventions. Each test file sits alongside the <code>+page.server.ts</code> it tests:
</p>

<pre><code class="language-text"
		>src/routes/(app)/users/
  +page.svelte          # UI component (Svelte 5)
  +page.server.ts       # Server load + form actions
  users.test.ts         # Unit tests for +page.server.ts

src/routes/(app)/settings/
  +page.svelte
  +page.server.ts
  settings.test.ts</code
	></pre>

<p>
	This co-location makes it easy to find tests for any given page and ensures that test files are
	automatically included by Vitest's <code>src/**/*.test.ts</code> glob pattern.
</p>

<h2>Playwright E2E Tests</h2>

<p>
	End-to-end tests verify complete user flows through the browser, testing the full
	<strong>Svelte 5</strong> frontend, <strong>SvelteKit</strong> server, and SQLite database together.
</p>

<h3>Setup</h3>

<pre><code class="language-ts"
		>// playwright.config.ts
import &#123; defineConfig &#125; from "@playwright/test";

export default defineConfig(&#123;
  webServer: &#123;
    command: "pnpm build &amp;&amp; pnpm preview",
    port: 4173,
  &#125;,
  testDir: "e2e",
&#125;);</code
	></pre>

<p>
	The <code>webServer</code> configuration automatically builds and starts the
	<strong>SvelteKit</strong> application before running tests. Tests run against the production build
	to catch build-time issues.
</p>

<h3>Running E2E Tests</h3>

<pre><code class="language-bash"
		># Run all E2E tests
pnpm test:e2e

# Run with UI mode for debugging
npx playwright test --ui

# Run a specific test file
npx playwright test e2e/auth.test.ts</code
	></pre>

<h3>Example: Full Auth Flow</h3>

<pre><code class="language-ts"
		>import &#123; test, expect &#125; from "@playwright/test";

test("user can register, login, and access dashboard", async (&#123; page &#125;) =&gt; &#123;
  // Register a new account
  await page.goto("/register");
  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="username"]', "testuser");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL("/");
  await expect(page.locator("text=Dashboard")).toBeVisible();

  // Logout
  await page.goto("/logout");

  // Login with the same credentials
  await page.goto("/login");
  await page.fill('input[name="username"]', "testuser");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Should be back on the dashboard
  await expect(page).toHaveURL("/");
&#125;);</code
	></pre>

<h2>Best Practices</h2>

<h3>Test Isolation</h3>

<p>
	Every test gets a fresh database via <code>beforeEach</code>. This means tests can create, modify,
	and delete data freely without affecting other tests. No test ordering dependencies, no shared
	state, no flaky tests from leftover data.
</p>

<pre><code class="language-ts"
		>beforeEach(() =&gt; &#123;
  testDb = createTestDb();
&#125;);</code
	></pre>

<h3>Test Both Success and Error Paths</h3>

<p>
	Every form action should have tests for both the happy path (valid input, authorized user) and
	error paths (missing fields, duplicate data, unauthorized access):
</p>

<ul>
	<li><strong>Valid input</strong> — Verify the action succeeds and the database is updated</li>
	<li><strong>Missing required fields</strong> — Verify a 400 error with a descriptive message</li>
	<li>
		<strong>Duplicate data</strong> — Verify uniqueness constraints are enforced (e.g., email)
	</li>
	<li><strong>Unauthorized access</strong> — Verify a 401 or 403 error for wrong roles</li>
</ul>

<h3>Test Authorization Boundaries</h3>

<p>
	SvelteForge Admin uses role-based access control (<code>admin</code>, <code>editor</code>,
	<code>viewer</code>). Tests should verify that admin-only actions reject non-admin users:
</p>

<pre><code class="language-ts"
		>it("prevents viewer from deleting users", async () =&gt; &#123;
  const viewer = createTestUser(testDb, &#123; role: "viewer" &#125;);
  const target = createTestUser(testDb, &#123;
    email: "target@test.com",
    username: "target",
  &#125;);

  const formData = createFormData(&#123; userId: target.id &#125;);
  const result = await actions.delete(&#123;
    request: createMockRequest(formData),
    locals: createMockLocals(&#123; user: viewer &#125;),
  &#125;) as any;

  expect(result.status).toBe(403);

  // Verify user was NOT deleted
  const users = testDb.select().from(usersTable).all();
  expect(users).toHaveLength(2);
&#125;);</code
	></pre>

<h3>Verify Database State, Not Just Return Values</h3>

<p>
	Always check the actual database state after an action, not just the return value. An action might
	return <code>&#123; success: true &#125;</code> due to a bug even if the database was not actually updated:
</p>

<pre><code class="language-ts"
		>// Good: verify the database directly
const result = await actions.updateRole(&#123; ... &#125;) as any;
expect(result.success).toBe(true);

const updatedUser = testDb
  .select()
  .from(usersTable)
  .where(eq(usersTable.id, userId))
  .get();
expect(updatedUser.role).toBe("editor"); // Verify DB state</code
	></pre>

<h2>Common Pitfalls</h2>

<table>
	<thead>
		<tr>
			<th>Issue</th>
			<th>Solution</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Tests hit the real database</td>
			<td>Ensure <code>vi.mock()</code> is called before <code>await import()</code></td>
		</tr>
		<tr>
			<td><code>testDb</code> is <code>undefined</code></td>
			<td>Use a getter in the mock: <code>get db() &#123; return testDb; &#125;</code></td>
		</tr>
		<tr>
			<td>TypeScript errors on action results</td>
			<td>Cast results as <code>any</code> to avoid void union types</td>
		</tr>
		<tr>
			<td>Schema mismatch errors</td>
			<td>Update <code>SCHEMA_SQL</code> in test-utils.ts after changing schema.ts</td>
		</tr>
		<tr>
			<td>Tests pass individually but fail together</td>
			<td>Ensure <code>beforeEach</code> creates a fresh <code>testDb</code></td>
		</tr>
		<tr>
			<td>Path alias errors in tests</td>
			<td>Vitest inherits SvelteKit's Vite config — <code>$lib</code> works automatically</td>
		</tr>
	</tbody>
</table>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin demonstrates testing fundamentals for <strong>Svelte 5</strong> and
				<strong>SvelteKit</strong> applications. Our premium templates at DashboardPack ship with comprehensive
				test suites out of the box — Vitest unit tests covering every form action and server load, plus
				Playwright E2E tests for complete user flows including authentication, CRUD operations, and role-based
				access control.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Full unit test coverage</strong> — Every server action and load function tested
				</li>
				<li>
					<strong>E2E test suites</strong> — Playwright tests for registration, login, CRUD, and admin
					flows
				</li>
				<li>
					<strong>CI/CD integration</strong> — GitHub Actions workflows for automated testing
				</li>
				<li>
					<strong>Test data factories</strong> — Rich seed data generators for realistic testing
				</li>
				<li>
					<strong>API testing</strong> — REST and GraphQL endpoint test patterns
				</li>
			</ul>
		</div>
		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
			>
				Go Premium
			</a>
			<a
				href="https://dashboardpack.com/theme-details/apex-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:text-primary/80 text-center text-xs font-medium transition-colors"
			>
				Preview Apex
			</a>
		</div>
	</div>
</div>
