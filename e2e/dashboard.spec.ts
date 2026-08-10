import { test, expect } from "@playwright/test";
import { login, expectCardTitle } from "./helpers.js";

test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test("dashboard displays KPI cards", async ({ page }) => {
		await expectCardTitle(page, "Total Users");
		await expectCardTitle(page, "Total Pages");
		await expectCardTitle(page, "Unread Notifications");
	});

	test("dashboard displays charts section", async ({ page }) => {
		await expectCardTitle(page, "User Signups");
		await expectCardTitle(page, "User Roles");
	});

	test("dashboard displays recent activity", async ({ page }) => {
		await expectCardTitle(page, "Recent Activity");
	});

	test("quick stats section renders", async ({ page }) => {
		await expectCardTitle(page, "System Overview");
		await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
		await expect(page.getByText("Active Editors", { exact: true }).first()).toBeVisible();
	});
});
