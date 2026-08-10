import { test, expect } from "@playwright/test";
import { expectCardTitle } from "./helpers.js";

test.describe("Authentication", () => {
	test("login page renders correctly", async ({ page }) => {
		await page.goto("/login");
		await expectCardTitle(page, "Welcome back");
		await expect(page.locator('input[name="username"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("register page renders correctly", async ({ page }) => {
		await page.goto("/register");
		await expectCardTitle(page, "Create an account");
		await expect(page.locator('input[name="name"]')).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="username"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
	});

	test("login with invalid credentials shows error", async ({ page }) => {
		await page.goto("/login");
		await page.fill('input[name="username"]', "nonexistent");
		await page.fill('input[name="password"]', "wrongpassword");
		await page.click('button[type="submit"]');
		await expect(page.locator("text=Incorrect username or password")).toBeVisible();
	});

	test("unauthenticated user is redirected to login", async ({ page }) => {
		await page.goto("/");
		await page.waitForURL("/login");
		expect(page.url()).toContain("/login");
	});

	test("forgot password page renders", async ({ page }) => {
		await page.goto("/forgot-password");
		await expectCardTitle(page, "Forgot password");
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test("login page has forgot password link", async ({ page }) => {
		await page.goto("/login");
		const link = page.locator('a[href="/forgot-password"]');
		await expect(link).toBeVisible();
	});
});
