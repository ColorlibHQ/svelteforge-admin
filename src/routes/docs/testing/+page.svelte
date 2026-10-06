<svelte:head
	><title>Testing - SvelteForge Admin Documentation</title><meta
		name="description"
		content="Run Vitest, isolated SQLite fixtures, Playwright browser tests, and CI checks for SvelteForge Admin."
	/></svelte:head
>
<h1>Testing</h1>
<p>
	Vitest covers server loads, form actions, and authorization. Playwright exercises the application
	in Chromium. The current release has 40 unit tests and 39 browser tests; there is no numeric
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
	Name tests <code>*.test.ts</code> beside the route they cover. <code>createTestDb()</code> creates an
	in-memory SQLite database. Mock the database module before dynamically importing a route; close the
	test database after each test.
</p>
<pre><code class="language-ts"
		>import &#123; afterEach, beforeEach, describe, expect, it, vi &#125; from "vitest";
import &#123; createTestDb, createTestUser, createMockLocals &#125; from "#lib/server/db/test-utils.js";

let testDb: ReturnType&lt;typeof createTestDb&gt;;
vi.mock("#lib/server/db/index.js", () =&gt; (&#123;
  get db() &#123; return testDb; &#125;,
&#125;));
const &#123; load &#125; = await import("./+page.server.js");

describe("Users load", () =&gt; &#123;
  beforeEach(() =&gt; &#123; testDb = createTestDb(); &#125;);
  afterEach(() =&gt; &#123; testDb.$client.close(); &#125;);

  it("returns users without password hashes", async () =&gt; &#123;
    const adminId = await createTestUser(testDb, &#123; role: "admin" &#125;);
    const result = await load(&#123;
      locals: createMockLocals(adminId, "admin"),
    &#125; as Parameters&lt;typeof load&gt;[0]);
    expect(result.users).toHaveLength(1);
    expect(result.users[0]).not.toHaveProperty("passwordHash");
  &#125;);
&#125;);</code
	></pre>
<h2>Fixture helpers</h2>
<ul>
	<li>
		<code>await createTestUser(db, overrides)</code> inserts a user and returns their ID. Its
		password is <code>password123</code>; its default role is viewer.
	</li>
	<li>
		<code>createMockLocals(userId, role)</code> builds locals; role defaults to admin, so pass the intended
		role explicitly in permission tests.
	</li>
	<li><code>createFormData(entries)</code> accepts a record of string values.</li>
	<li><code>createMockRequest(formData)</code> creates a POST request.</li>
</ul>
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
