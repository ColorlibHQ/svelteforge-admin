import { test, expect } from "@playwright/test";
import { login, expectHeading, expectCardTitle } from "./helpers.js";

test.describe("Settings Page", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/settings");
	});

	test("settings page renders with tabs", async ({ page }) => {
		await expectHeading(page, "Settings");
		await expect(page.getByRole("tab", { name: "Profile" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Sessions" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Notifications" })).toBeVisible();
	});

	test("profile tab shows form", async ({ page }) => {
		await expect(page.locator('input[name="name"]')).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test("sessions tab shows active sessions", async ({ page }) => {
		await page.getByRole("tab", { name: "Sessions" }).click();
		await expectCardTitle(page, "Active Sessions");
	});

	test("notifications tab shows toggles", async ({ page }) => {
		await page.getByRole("tab", { name: "Notifications" }).click();
		await expectCardTitle(page, "Notification Preferences");
		await expect(page.getByText("New user registrations")).toBeVisible();
		await expect(page.getByText("Security alerts")).toBeVisible();
	});

	test("application tab visible for admin", async ({ page }) => {
		await expect(page.getByRole("tab", { name: "Application" })).toBeVisible();
	});
});
