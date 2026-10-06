import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

// Browser tests mutate data: always use a dedicated, freshly seeded database.
process.env.DATABASE_URL = resolve(".svelte-kit/e2e.db");
process.env.ORIGIN = "http://localhost:4173";
process.env.DEMO_MODE = "false";

export default defineConfig({
	testDir: "e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// Every test signs in, and password verification is Argon2id -- deliberately slow
	// and memory-hard. Letting Playwright default to one worker per core stacks those
	// hashes on a single server process and logins start timing out on high-core
	// machines, so cap local concurrency.
	workers: process.env.CI ? 1 : 4,
	reporter: "html",
	use: {
		baseURL: "http://localhost:4173",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "pnpm exec tsx e2e/setup.ts && pnpm build && pnpm preview",
		port: 4173,
		reuseExistingServer: false,
		// A cold production build has to finish before the server binds the port.
		timeout: 180_000,
	},
});
