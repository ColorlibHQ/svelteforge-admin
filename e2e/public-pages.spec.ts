import { test, expect } from "@playwright/test";
import { expectHeading, expectCardTitle } from "./helpers.js";

test.describe("Public Pages", () => {
	test("pricing page renders without auth", async ({ page }) => {
		await page.goto("/pricing");
		await expectHeading(page, "pricing");
		await expectCardTitle(page, "Free");
		await expectCardTitle(page, "Pro");
		await expectCardTitle(page, "Enterprise");
	});

	test("pricing page has sign in link", async ({ page }) => {
		await page.goto("/pricing");
		await expect(page.locator('a[href="/login"]')).toBeVisible();
	});

	test("pricing cards have CTA buttons", async ({ page }) => {
		await page.goto("/pricing");
		await expect(page.getByRole("link", { name: "Get Started", exact: true })).toBeVisible();
		await expect(page.getByRole("link", { name: "Start Free Trial", exact: true })).toBeVisible();
		await expect(page.getByRole("link", { name: "Contact Sales", exact: true })).toBeVisible();
	});
});
