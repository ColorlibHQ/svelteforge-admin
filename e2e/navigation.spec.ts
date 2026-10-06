import { test, expect } from "@playwright/test";
import { login, expectHeading } from "./helpers.js";

test.describe("Navigation", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test("sidebar highlights the current section after navigation", async ({ page }) => {
		const active = page.locator('a[data-sidebar="menu-button"][data-active="true"]');
		await expect(active).toHaveCount(1);
		await expect(active).toHaveAttribute("href", "/");
		await page.locator('a[data-sidebar="menu-button"][href="/users"]').click();
		await page.waitForURL("/users");
		await expect(active).toHaveAttribute("href", "/users");
		await expect(active).toHaveAttribute("aria-current", "page");
		await page.goto("/content/new?from=sidebar");
		await expect(active).toHaveCount(1);
		await expect(active).toHaveAttribute("href", "/content");
	});

	test("sidebar link to users works", async ({ page }) => {
		await page.click('a[href="/users"]');
		await page.waitForURL("/users");
		await expectHeading(page, "Users");
	});

	test("sidebar link to content works", async ({ page }) => {
		await page.click('a[href="/content"]');
		await page.waitForURL("/content");
		await expectHeading(page, "Content");
	});

	test("sidebar link to analytics works", async ({ page }) => {
		await page.click('a[href="/analytics"]');
		await page.waitForURL("/analytics");
		await expectHeading(page, "Analytics");
	});

	test("sidebar link to notifications works", async ({ page }) => {
		await page.click('a[href="/notifications"]');
		await page.waitForURL("/notifications");
		await expectHeading(page, "Notifications");
	});

	test("sidebar link to settings works", async ({ page }) => {
		await page.click('a[href="/settings"]');
		await page.waitForURL("/settings");
		await expectHeading(page, "Settings");
	});

	test("sidebar link to roles works", async ({ page }) => {
		await page.click('a[href="/roles"]');
		await page.waitForURL("/roles");
		await expectHeading(page, "Roles");
	});

	test("breadcrumbs update on navigation", async ({ page }) => {
		await page.click('a[href="/users"]');
		await page.waitForURL("/users");
		await expect(page.locator("nav[aria-label='breadcrumb']")).toContainText("Users");
	});
});
