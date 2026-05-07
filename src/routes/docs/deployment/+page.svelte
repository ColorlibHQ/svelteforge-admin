<svelte:head>
	<title>Deployment - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Deploy SvelteForge Admin to production with Docker, Railway, Fly.io, or a VPS. Covers Node.js adapter configuration, SQLite persistence, OAuth setup, and security for your Svelte 5 and SvelteKit admin dashboard."
	/>
</svelte:head>

<h1>Deployment</h1>

<p>
	SvelteForge Admin is a <strong>Svelte 5</strong> and <strong>SvelteKit</strong> application that
	uses <code>@sveltejs/adapter-node</code> for Node.js deployment. Because the database is
	<strong>SQLite</strong> (via better-sqlite3), your hosting environment must provide a persistent filesystem
	and a full Node.js runtime.
</p>

<h2>Requirements</h2>

<p>
	Before deploying your <strong>SvelteKit</strong> application, make sure your target environment meets
	these requirements:
</p>

<table>
	<thead>
		<tr>
			<th>Requirement</th>
			<th>Details</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Node.js 18+</strong></td>
			<td>LTS recommended. The production server runs as a standard Node.js process.</td>
		</tr>
		<tr>
			<td><strong>Native module compilation</strong></td>
			<td
				>better-sqlite3 is a C++ addon that compiles during <code>pnpm install</code>. The build
				environment needs <code>python3</code>, <code>make</code>, and a C++ compiler.</td
			>
		</tr>
		<tr>
			<td><strong>Persistent filesystem</strong></td>
			<td
				>SQLite stores data in a single file on disk. The filesystem must survive restarts, deploys,
				and container recreations.</td
			>
		</tr>
	</tbody>
</table>

<h3>Why These Matter</h3>

<p>
	SQLite is an embedded database — it runs inside your Node.js process, not as a separate service.
	The better-sqlite3 driver is a native C++ addon that binds directly to the SQLite C library. This
	means:
</p>

<ul>
	<li>
		<strong>No V8 isolates</strong> — Native C++ addons cannot run in V8 isolate environments like Cloudflare
		Workers or Vercel Edge Functions.
	</li>
	<li>
		<strong>No ephemeral filesystems</strong> — If the filesystem resets between requests (as in serverless
		functions), your database is gone.
	</li>
	<li>
		<strong>No cold start compilation</strong> — The native module must be pre-compiled for the target
		OS/architecture during the build step.
	</li>
</ul>

<h2>Building for Production</h2>

<p>
	<strong>SvelteKit</strong> compiles your <strong>Svelte 5</strong> components, server routes, and hooks
	into an optimized production bundle:
</p>

<pre><code class="language-bash"
		># Create the production build
pnpm build

# Run the production server
node build/index.js</code
	></pre>

<p>
	The <code>pnpm build</code> command creates a <code>build/</code> directory containing the
	compiled <strong>SvelteKit</strong> application. The adapter-node configuration in
	<code>svelte.config.js</code> handles the output format:
</p>

<pre><code class="language-javascript"
		>// svelte.config.js
import adapter from "@sveltejs/adapter-node";

export default &#123;
  kit: &#123;
    adapter: adapter(&#123;
      // Output directory (default: "build")
      out: "build",
      // Precompress static assets with gzip and brotli
      precompress: false,
      // Environment variable for port (default: "PORT")
      envPrefix: "",
    &#125;),
  &#125;,
&#125;;</code
	></pre>

<p>
	The production server listens on <code>0.0.0.0:3000</code> by default. Override with
	<code>HOST</code> and <code>PORT</code> environment variables.
</p>

<h2>Environment Variables</h2>

<p>
	Configure your production <strong>SvelteKit</strong> deployment with these environment variables:
</p>

<table>
	<thead>
		<tr>
			<th>Variable</th>
			<th>Required</th>
			<th>Default</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>DATABASE_URL</code></td>
			<td>Yes</td>
			<td><code>svelteforge.db</code></td>
			<td
				>Path to the SQLite database file. In Docker, point to a mounted volume (e.g., <code
					>/app/data/svelteforge.db</code
				>).</td
			>
		</tr>
		<tr>
			<td><code>ORIGIN</code></td>
			<td>Yes</td>
			<td>—</td>
			<td
				>Your production URL (e.g., <code>https://admin.example.com</code>). Required for CSRF
				protection and OAuth callback URLs.</td
			>
		</tr>
		<tr>
			<td><code>PORT</code></td>
			<td>No</td>
			<td><code>3000</code></td>
			<td>Port the Node.js server listens on.</td>
		</tr>
		<tr>
			<td><code>HOST</code></td>
			<td>No</td>
			<td><code>0.0.0.0</code></td>
			<td>Host address to bind to.</td>
		</tr>
		<tr>
			<td><code>NODE_ENV</code></td>
			<td>No</td>
			<td><code>production</code></td>
			<td
				>Set automatically by <code>pnpm build</code>. Controls secure cookies and other production
				behaviors.</td
			>
		</tr>
		<tr>
			<td><code>GOOGLE_CLIENT_ID</code></td>
			<td>No</td>
			<td>—</td>
			<td>Google OAuth 2.0 client ID. Omit to disable Google login.</td>
		</tr>
		<tr>
			<td><code>GOOGLE_CLIENT_SECRET</code></td>
			<td>No</td>
			<td>—</td>
			<td>Google OAuth 2.0 client secret.</td>
		</tr>
		<tr>
			<td><code>GITHUB_CLIENT_ID</code></td>
			<td>No</td>
			<td>—</td>
			<td>GitHub OAuth app client ID. Omit to disable GitHub login.</td>
		</tr>
		<tr>
			<td><code>GITHUB_CLIENT_SECRET</code></td>
			<td>No</td>
			<td>—</td>
			<td>GitHub OAuth app client secret.</td>
		</tr>
	</tbody>
</table>

<p>
	OAuth providers are loaded dynamically in <code>$lib/server/oauth.ts</code> using
	<strong>SvelteKit's</strong> <code>$env/dynamic/private</code>. When environment variables are
	missing, the provider is <code>null</code> and the corresponding social login button is automatically
	hidden from the login page.
</p>

<h2>Docker Deployment</h2>

<p>
	Docker is the recommended way to deploy SvelteForge Admin. The multi-stage build keeps the final
	image small while properly compiling the better-sqlite3 native module.
</p>

<h3>Dockerfile</h3>

<pre><code class="language-dockerfile"
		># Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build the SvelteKit application
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL=/app/data/svelteforge.db

EXPOSE 3000

CMD ["node", "build/index.js"]</code
	></pre>

<h3>docker-compose.yml</h3>

<pre><code class="language-yaml"
		>version: "3.8"
services:
  svelteforge:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=/app/data/svelteforge.db
      - ORIGIN=https://admin.example.com
      - GOOGLE_CLIENT_ID=$&#123;GOOGLE_CLIENT_ID&#125;
      - GOOGLE_CLIENT_SECRET=$&#123;GOOGLE_CLIENT_SECRET&#125;
      - GITHUB_CLIENT_ID=$&#123;GITHUB_CLIENT_ID&#125;
      - GITHUB_CLIENT_SECRET=$&#123;GITHUB_CLIENT_SECRET&#125;
    restart: unless-stopped</code
	></pre>

<h3>Build and Run</h3>

<pre><code class="language-bash"
		># Build the Docker image
docker build -t svelteforge-admin .

# Run with a persistent volume for SQLite
docker run -p 3000:3000 -v ./data:/app/data svelteforge-admin</code
	></pre>

<p>
	<strong>Important:</strong> The <code>-v ./data:/app/data</code> volume mount is critical. Without it,
	your SQLite database lives inside the container's ephemeral filesystem and will be lost when the container
	is recreated or updated.
</p>

<h2>Recommended Hosting Providers</h2>

<p>
	These providers support Node.js applications with persistent filesystems — exactly what a
	<strong>SvelteKit</strong> + SQLite application needs:
</p>

<h3>Railway</h3>

<p>
	The easiest option for deploying <strong>SvelteKit</strong> applications. Railway detects your
	Node.js project automatically, runs <code>pnpm build</code>, and starts the server.
</p>

<ul>
	<li>One-click deploy from GitHub repository</li>
	<li>Persistent volumes for SQLite (add via dashboard)</li>
	<li>Free tier with $5/month of usage included</li>
	<li>Set environment variables in the dashboard or via CLI</li>
	<li>Automatic HTTPS with custom domains</li>
</ul>

<pre><code class="language-bash"
		># Railway CLI deployment
railway init
railway volume add --mount /app/data
railway up</code
	></pre>

<h3>Fly.io</h3>

<p>
	Global edge deployment with persistent volumes. Fly.io runs your <strong>SvelteKit</strong>
	application in lightweight VMs close to your users.
</p>

<ul>
	<li>Deploy via Dockerfile (uses the Dockerfile above)</li>
	<li>Persistent volumes with <code>fly volumes create</code></li>
	<li>Free tier includes 3 shared VMs</li>
	<li>Global distribution with automatic TLS</li>
</ul>

<pre><code class="language-bash"
		># Fly.io deployment
fly launch
fly volumes create svelteforge_data --size 1 --region ord
fly deploy</code
	></pre>

<h3>Render</h3>

<p>
	Auto-deploy from GitHub with zero configuration. Render builds and deploys your
	<strong>SvelteKit</strong> application on every push.
</p>

<ul>
	<li>Connect your GitHub repository for automatic deploys</li>
	<li>Persistent disks available on paid plans</li>
	<li>Free tier for web services (with sleep after inactivity)</li>
	<li>Built-in environment variable management</li>
</ul>

<h3>VPS (DigitalOcean, Hetzner, Linode)</h3>

<p>
	Full control over your deployment. Ideal for teams that want to manage their own infrastructure.
	VPS providers offer the most flexibility and best price-performance ratio.
</p>

<ul>
	<li>Starting from ~$4/month (Hetzner) or ~$6/month (DigitalOcean, Linode)</li>
	<li>Full root access — install Node.js, configure nginx, set up SSL</li>
	<li>Use PM2 or systemd to keep the Node.js process running</li>
	<li>SQLite persistence is automatic (it is just a file on the server)</li>
</ul>

<pre><code class="language-bash"
		># Example: PM2 process manager on a VPS
npm install -g pm2
pm2 start build/index.js --name svelteforge
pm2 save
pm2 startup</code
	></pre>

<h2>NOT Compatible</h2>

<p>
	These platforms <strong>cannot</strong> run SvelteForge Admin due to better-sqlite3 being a native C++
	addon that requires a full Node.js runtime and persistent filesystem:
</p>

<table>
	<thead>
		<tr>
			<th>Platform</th>
			<th>Why It Fails</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Cloudflare Pages / Workers</strong></td>
			<td>V8 isolates cannot load native C++ Node.js modules. No filesystem access.</td>
		</tr>
		<tr>
			<td><strong>Vercel Edge Functions</strong></td>
			<td>Same V8 isolate limitation. Edge runtime does not support native addons.</td>
		</tr>
		<tr>
			<td><strong>Vercel Serverless Functions</strong></td>
			<td
				>No persistent filesystem. SQLite database would be lost between invocations. Cold starts
				add latency.</td
			>
		</tr>
		<tr>
			<td><strong>AWS Lambda</strong></td>
			<td
				>Ephemeral filesystem (<code>/tmp</code> only, wiped between invocations). No persistent storage
				for SQLite.</td
			>
		</tr>
		<tr>
			<td><strong>Netlify Functions</strong></td>
			<td>Same serverless limitations — no persistent filesystem, cold start overhead.</td>
		</tr>
	</tbody>
</table>

<p>
	<strong>The core issue:</strong> better-sqlite3 is a synchronous, native C++ addon that compiles
	against the Node.js N-API. It requires <code>dlopen()</code> to load the shared library at runtime —
	something V8 isolates and edge runtimes simply do not support. Additionally, SQLite needs a persistent
	filesystem to store its database file, WAL journal, and shared-memory file.
</p>

<h2>Production OAuth Setup</h2>

<p>
	When moving from development to production, update your OAuth provider configurations to use your
	production URL:
</p>

<h3>Google Cloud Console</h3>

<ol>
	<li>Go to <strong>APIs &amp; Services &rarr; Credentials</strong> in Google Cloud Console</li>
	<li>Edit your OAuth 2.0 Client ID</li>
	<li>
		Add your production URL to <strong>Authorized JavaScript origins</strong> (e.g.,
		<code>https://admin.example.com</code>)
	</li>
	<li>
		Add the callback URL to <strong>Authorized redirect URIs</strong>:
		<code>https://admin.example.com/login/google/callback</code>
	</li>
</ol>

<h3>GitHub Developer Settings</h3>

<ol>
	<li>Go to <strong>Settings &rarr; Developer settings &rarr; OAuth Apps</strong></li>
	<li>Edit your OAuth application</li>
	<li>Set <strong>Homepage URL</strong> to your production URL</li>
	<li>
		Set <strong>Authorization callback URL</strong> to:
		<code>https://admin.example.com/login/github/callback</code>
	</li>
</ol>

<p>
	<strong>Important:</strong> Set the <code>ORIGIN</code> environment variable to match your
	deployed URL exactly (including the protocol, no trailing slash). <strong>SvelteKit</strong> uses this
	for CSRF protection — if it does not match, form submissions will fail with a 403 error.
</p>

<h2>Database Backup</h2>

<p>
	SQLite makes backups straightforward — the database is a single file. However, because SvelteForge
	Admin runs SQLite in WAL (Write-Ahead Logging) mode, there are a few nuances.
</p>

<h3>WAL Mode Files</h3>

<p>When WAL mode is active, SQLite uses up to three files:</p>

<ul>
	<li><code>svelteforge.db</code> — the main database file</li>
	<li><code>svelteforge.db-wal</code> — the write-ahead log (uncommitted changes)</li>
	<li><code>svelteforge.db-shm</code> — shared memory index for the WAL</li>
</ul>

<p>
	<strong>For a consistent backup, copy all three files together</strong>, or use SQLite's
	<code>.backup</code> command which creates a clean, self-contained copy:
</p>

<pre><code class="language-bash"
		># Method 1: SQLite backup command (recommended — creates a clean copy)
sqlite3 svelteforge.db ".backup /backups/svelteforge-$(date +%Y%m%d).db"

# Method 2: Copy all WAL files together
cp svelteforge.db svelteforge.db-wal svelteforge.db-shm /backups/</code
	></pre>

<h3>Automated Backup Strategies</h3>

<ul>
	<li>
		<strong>Cron job</strong> — Schedule a daily backup with <code>crontab -e</code>:
		<pre><code class="language-bash"
				># Daily backup at 3 AM
0 3 * * * sqlite3 /app/data/svelteforge.db ".backup /backups/svelteforge-$(date +\%Y\%m\%d).db"</code
			></pre>
	</li>
	<li>
		<strong>Volume snapshots</strong> — If using Railway, Fly.io, or a cloud VPS, take periodic snapshots
		of the volume containing the database.
	</li>
	<li>
		<strong>Off-site sync</strong> — Use <code>rclone</code> or <code>rsync</code> to copy backups to
		cloud storage (S3, R2, etc.) for disaster recovery.
	</li>
</ul>

<h2>Performance Considerations</h2>

<p>
	SQLite with better-sqlite3 is exceptionally fast for admin dashboard workloads. Here is what you
	need to know for production:
</p>

<ul>
	<li>
		<strong>WAL mode enables concurrent reads</strong> — Multiple <strong>SvelteKit</strong> server load
		functions can query the database simultaneously without blocking each other. This is enabled by default
		in SvelteForge Admin.
	</li>
	<li>
		<strong>Single-writer limitation</strong> — Only one write transaction can execute at a time. This
		is fine for admin dashboards where write operations are infrequent (user updates, page edits, setting
		changes). SQLite handles thousands of writes per second on modern hardware.
	</li>
	<li>
		<strong>No connection pooling needed</strong> — better-sqlite3 is synchronous and runs in the
		same process as your <strong>SvelteKit</strong> server. There is no network overhead, no connection
		handshake, and no pool to manage.
	</li>
	<li>
		<strong>Synchronous by design</strong> — better-sqlite3 queries are synchronous, which means
		they block the Node.js event loop. For the small result sets typical of admin dashboards (tens
		to hundreds of rows), this is imperceptible. If you ever need to handle thousands of concurrent
		users, consider switching to PostgreSQL with <code>@sveltejs/adapter-node</code>.
	</li>
</ul>

<h2>Security Checklist</h2>

<p>
	Before going live with your <strong>SvelteKit</strong> production deployment, verify these security
	measures:
</p>

<table>
	<thead>
		<tr>
			<th>Check</th>
			<th>Details</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>HTTPS only</strong></td>
			<td
				>Session cookies are set with <code>secure: true</code> in production. Your deployment must use
				HTTPS (most hosting providers handle this automatically).</td
			>
		</tr>
		<tr>
			<td><strong>ORIGIN env var</strong></td>
			<td
				><strong>SvelteKit</strong> uses this for CSRF protection on form actions. Must match your exact
				production URL.</td
			>
		</tr>
		<tr>
			<td><strong>Database file location</strong></td>
			<td
				>Keep the SQLite file outside the public web root. In Docker, use <code>/app/data/</code> —
				never serve it from <code>/app/build/client/</code>.</td
			>
		</tr>
		<tr>
			<td><strong>Regular backups</strong></td>
			<td
				>Schedule automated backups of the database file. SQLite corruption is rare but data loss
				from hardware failure is not.</td
			>
		</tr>
		<tr>
			<td><strong>Session table monitoring</strong></td>
			<td
				>Sessions are auto-extended but never auto-deleted for inactive users. Monitor the sessions
				table size and consider a periodic cleanup job for expired sessions.</td
			>
		</tr>
		<tr>
			<td><strong>Change default credentials</strong></td>
			<td
				>If you deployed with seeded data, change the default <code>password123</code> passwords immediately
				or re-seed with production credentials.</td
			>
		</tr>
		<tr>
			<td><strong>Environment variables</strong></td>
			<td
				>Never commit <code>.env</code> files to source control. Use your hosting provider's secrets management.</td
			>
		</tr>
	</tbody>
</table>

<h2>Next Steps</h2>

<ul>
	<li>
		<a href="/docs/authentication">Authentication</a> — Deep dive into the session-based auth system and
		OAuth configuration
	</li>
	<li>
		<a href="/docs/database">Database</a> — Full schema reference, migrations, and query patterns
	</li>
	<li>
		<a href="/docs/api-reference">API Reference</a> — Server-side utilities, auth functions, and API endpoints
	</li>
</ul>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">
				Production-Ready with DashboardPack
			</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Need a production-ready deployment with PostgreSQL, Redis, and horizontal scaling?
				DashboardPack premium templates include production-grade infrastructure configurations,
				multi-database support, caching layers, and deployment automation that scales from startup
				to enterprise.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex</strong> — Enterprise-grade with PostgreSQL, Redis caching, and Docker Compose
					production configs
				</li>
				<li>
					<strong>Zenith</strong> — Horizontally scalable architecture with database connection pooling
				</li>
				<li>
					<strong>Signal</strong> — Infrastructure monitoring with health checks, uptime tracking, and
					alerting
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
