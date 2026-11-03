<svelte:head
	><title>Testing - SvelteForge Admin Documentation</title><meta
		name="description"
		content="Run Vitest, isolated SQLite fixtures, Playwright browser tests, and CI checks for SvelteForge Admin."
	/></svelte:head
>
<h1>Testing</h1>
<p>
	Vitest covers server loads, form actions, and authorization. Playwright exercises the application
	in Chromium. The current release has 58 unit tests and 42 browser tests; there is no numeric
	coverage threshold.
</p>
<h2>Commands</h2>
<pre><code class="language-bash"
		>pnpm test
pnpm test:watch
pnpm exec vitest run "src/routes/(app)/users/users.test.ts"
pnpm test:e2e
pnpm check
pnpm lint
pnpm format:check</code
	></pre>
<h2>Isolated unit tests</h2>
<p>
	Name tests <code>*.test.ts</code> beside the route they cover. <code>createTestDb()</code> creates
	an in-memory SQLite database for each test. Mock the database module with
	<code>mockDbModule()</code>
	before dynamically importing a route.
</p>
<pre><code class="language-ts"
		>import &#123; beforeEach, describe, expect, it, vi &#125; from "vitest";
import &#123;
  createTestDb,
  createTestUser,
  createAuthHeaders,
  createFormData,
  createMockRequest,
  type TestDb,
&#125; from "#lib/server/db/test-utils.js";

let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
  (await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);
const &#123; actions &#125; = await import("./+page.server.js");

describe("Change password", () =&gt; &#123;
  beforeEach(() =&gt; &#123; testDb = createTestDb(); &#125;);

  it("changes the password for the signed-in user", async () =&gt; &#123;
    const userId = await createTestUser(testDb, &#123; role: "viewer" &#125;);
    const headers = await createAuthHeaders(userId);
    const request = createMockRequest(
      createFormData(&#123;
        currentPassword: "password123",
        newPassword: "new-password-1",
        confirmPassword: "new-password-1",
      &#125;),
      headers
    );
    const result = await actions.changePassword(&#123; request &#125; as Parameters&lt;typeof actions.changePassword&gt;[0]);
    expect(result).toMatchObject(&#123; success: true &#125;);
  &#125;);
&#125;);</code
	></pre>
<p>
	Better Auth captures the <code>db</code> object once, when <code>auth.ts</code> is first imported,
	but each test creates a fresh database. <code>mockDbModule(() =&gt; testDb)</code> returns a proxy
	that forwards every property access to whichever database <code>testDb</code> points at when the
	call happens, so the shared <code>auth</code> instance always talks to the current test database.
</p>
<p>
	<code>src/test-setup.ts</code> is registered in <code>setupFiles</code> in
	<code>vite.config.ts</code>. It mocks <code>$app/server</code> so <code>getRequestEvent()</code>
	returns
	<code>undefined</code>; outside a real request, the <code>sveltekitCookies</code> plugin then has
	nothing to forward and <code>auth.api.*</code> calls work in plain Vitest.
</p>
<h2>Fixture helpers</h2>
<ul>
	<li>
		<code>await createTestUser(db, overrides)</code> inserts a user plus a <code>credential</code>
		account and returns the user ID. The Argon2id password hash is the same as production; the password
		is <code>password123</code> and the default role is viewer.
	</li>
	<li>
		<code>await createAuthHeaders(userId)</code> creates a real Better Auth session and returns
		<code>Headers</code> carrying its signed session cookie. Pass them to
		<code>createMockRequest</code> for actions that call <code>auth.api.*</code> with
		<code>request.headers</code>.
	</li>
	<li>
		<code>createMockLocals(userId, role)</code> builds <code>locals</code> for load functions and role
		checks; role defaults to admin, so pass the intended role explicitly in permission tests.
	</li>
	<li><code>createFormData(entries)</code> accepts a record of string values.</li>
	<li>
		<code>createMockRequest(formData, headers?)</code> creates a POST request, optionally with the
		headers from <code>createAuthHeaders</code>.
	</li>
</ul>
<p>
	Actions that guard on <code>locals</code> need <code>createMockLocals</code>; actions that call
	Better Auth need real session headers. Many actions need both. Because Better Auth also enforces
	rules itself (last-admin protection, admin-only endpoints), you can test them directly with
	<code>auth.api.*</code> and <code>createAuthHeaders</code>; see
	<code>src/lib/server/auth.test.ts</code>.
</p>
<p>
	When changing <code>schema.ts</code>, also update <code>SCHEMA_SQL</code> in
	<code>test-utils.ts</code>. Test successful operations, invalid input, unauthenticated requests,
	and every relevant role.
</p>
<h2>Browser tests</h2>
<p>Name browser tests <code>e2e/*.spec.ts</code>. Install Chromium once:</p>
<pre><code class="language-bash"
		>pnpm exec playwright install chromium
pnpm test:e2e</code
	></pre>
<p>
	Playwright automatically creates and seeds <code>.svelte-kit/e2e.db</code>, builds the
	application, and starts a fresh preview server on port 4173. It ignores your normal database path
	and does not reuse another running server. Local runs use four workers; CI uses one worker and
	retries failed tests twice.
</p>
<p>
	Reuse login and heading helpers from <code>e2e/helpers.ts</code>. Failed-run reports appear in
	<code>playwright-report/</code>; traces are recorded on the first retry. Both report and result
	directories are ignored by Git.
</p>
<h2>CI and deployment</h2>
<p>
	The reusable <code>.github/workflows/ci.yml</code> workflow runs frozen installation, type
	checking, lint, formatting, unit tests, and browser tests. Deployment waits for those checks,
	builds for the production origin, and verifies the served commit at <code>/api/health</code>.
</p>
