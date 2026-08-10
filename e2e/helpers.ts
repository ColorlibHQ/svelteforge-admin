import { type Page, expect } from "@playwright/test";

export async function login(page: Page, username = "admin", password = "password123") {
	await page.goto("/login");
	await page.fill('input[name="username"]', username);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await page.waitForURL("/");
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
	await page.waitForURL("/");
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
