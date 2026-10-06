<svelte:head
	><title>Upgrading to v1.4 - SvelteForge Admin Documentation</title><meta
		name="description"
		content="Migrate SvelteForge Admin to SvelteKit 3: configuration, imports, environment variables, deployment, and verification."
	/></svelte:head
>
<h1>Upgrading to v1.4</h1>
<p>
	v1.4 adopts SvelteKit 3, Svelte 5, Node adapter 6, and pnpm 12. Back up your SQLite database and
	review local customizations before updating. The release does not require a schema migration.
</p>
<h2>Runtime and packages</h2>
<p>
	Use Node 22.17 or newer (Node 24 is used in CI and Docker), and the pnpm version pinned in <code
		>package.json</code
	>. TypeScript stays on 6 because the current Svelte tooling does not support 7. The lockfile
	records both application dependencies and pnpm’s integrity metadata; commit both YAML documents.
</p>
<pre><code class="language-bash"
		>pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e</code
	></pre>
<h2>Configuration and imports</h2>
<p>
	SvelteKit options now live in <code>sveltekit(...)</code> in <code>vite.config.ts</code>. Remove
	the old <code>svelte.config.js</code>. The <code>#lib</code> imports are declared in
	<code>package.json</code>; include extensions and use <code>index.js</code> for directory exports.
</p>
<pre><code class="language-ts"
		>import &#123; Button &#125; from "#lib/components/ui/button/index.js";
import &#123; db &#125; from "#lib/server/db/index.js";
import &#123; dev &#125; from "$app/env";
import &#123; GOOGLE_CLIENT_ID &#125; from "$app/env/private";</code
	></pre>
<p>
	The TypeScript config extends <code>$app/tsconfig</code>. Optional OAuth variables are declared in
	<code>src/env.ts</code>; an empty value disables its provider.
</p>
<h2>Production origin</h2>
<p>
	Set <code>ORIGIN</code> before building. The Vite configuration passes it to
	<code>paths.origin</code>, which replaces adapter-node’s runtime origin setting. Rebuild if the
	public URL changes. Keep <code>ORIGIN</code> in the runtime environment too because OAuth uses it for
	callback URLs.
</p>
<pre><code class="language-bash"
		>ORIGIN=https://admin.example.com pnpm build
node --env-file=.env build/index.js

# Docker: bake the public origin into the build
docker build --build-arg ORIGIN=https://admin.example.com -t svelteforge-admin .</code
	></pre>
<h2>Permissions and integration changes</h2>
<ul>
	<li>Only the first registered account receives admin access; later accounts are viewers.</li>
	<li>
		Role changes require admin access. Editors can create/edit content and delete their own content.
		Viewers cannot mutate content.
	</li>
	<li>
		Pass <code>event.cookies</code> to session-cookie helpers, and await async session functions.
	</li>
	<li>
		External OAuth redirects explicitly opt in to the provider’s origin. Use <code
			>Response.json()</code
		> for JSON endpoints.
	</li>
</ul>
<h2>Verify deployment</h2>
<p>
	The GitHub deployment workflow installs matching server dependencies and verifies the build commit
	through <code>/api/health</code>. Confirm login, protected routes, docs, and charts after
	deployment. Never run the demo seed against a production database containing customer data.
</p>
<p>
	For customized applications, also consult <a
		href="https://svelte.dev/docs/kit/migrating-to-sveltekit-3"
		>the official SvelteKit 3 migration guide</a
	>.
</p>
