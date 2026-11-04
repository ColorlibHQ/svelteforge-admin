import { type Page, expect } from "@playwright/test";

export async function login(page: Page, username = "admin", password = "password123") {
	await page.goto("/login");
	await page.fill('input[name="username"]', username);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await waitForAppShell(page);
}

export async function register(
	page: Page,
	{ name, email, username, password }: Record<string, string>
) {
	await page.goto("/register");
	await page.fill('input[name="name"]', name);
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="username"]', username);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await waitForAppShell(page);
}

/**
 * SvelteKit updates the URL before the next page has rendered, so `waitForURL("/")`
 * can resolve while the auth form is still on screen. Wait for the app shell too.
 */
export async function waitForAppShell(page: Page) {
	await page.waitForURL("/");
	await page.locator("#logout-form").waitFor({ state: "attached" });
}

export async function expectHeading(page: Page, text: string) {
	await expect(page.locator("h1").first()).toContainText(text);
}

/**
 * Card titles render as `<div data-slot="card-title">`. Scope to that slot so the
 * assertion can't collide with sidebar links, chart legends, or body copy that
 * happen to contain the same words (which trips Playwright's strict mode).
 */
export async function expectCardTitle(page: Page, text: string) {
	await expect(
		page.locator('[data-slot="card-title"]').filter({ hasText: text }).first()
	).toBeVisible();
}

/** Most recent auth email sent to `to`, read from the AUTH_EMAIL_OUTBOX file. */
export async function lastEmailTo(to: string): Promise<{ subject: string; url: string }> {
	const { readFile } = await import("node:fs/promises");
	const outbox = process.env.AUTH_EMAIL_OUTBOX;
	if (!outbox) throw new Error("AUTH_EMAIL_OUTBOX is not set");
	for (let attempt = 0; attempt < 20; attempt++) {
		const lines = (await readFile(outbox, "utf8").catch(() => "")).trim().split("\n");
		const match = lines
			.filter(Boolean)
			.map((line) => JSON.parse(line))
			.reverse()
			.find((email) => email.to === to);
		if (match) return match;
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`No auth email sent to ${to}`);
}
