import { test, expect } from "@playwright/test";
import { lastEmailTo, register } from "./helpers.js";

// Each test registers its own account so parallel workers never share credentials.
function uniqueUser(prefix: string) {
	const id = `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	return { name: `E2E ${prefix}`, email: `${id}@e2e.test`, username: id, password: "password123" };
}

async function signIn(page: import("@playwright/test").Page, username: string, password: string) {
	await page.goto("/login");
	await page.fill('input[name="username"]', username);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
}

test.describe("Better Auth flows", () => {
	test("register, sign out, and sign back in", async ({ page, context }) => {
		const user = uniqueUser("reg");
		await register(page, user);

		const cookies = await context.cookies();
		expect(cookies.some((c) => c.name.endsWith("session_token") && c.httpOnly)).toBe(true);

		// The sidebar's "Log out" menu item submits this hidden form.
		await page.evaluate(() =>
			(document.getElementById("logout-form") as HTMLFormElement).requestSubmit()
		);
		await page.waitForURL("/login");
		await page.goto("/");
		await page.waitForURL("/login");

		await signIn(page, user.username, user.password);
		await page.waitForURL("/");
	});

	test("password reset link sets a new password", async ({ page }) => {
		const user = uniqueUser("reset");
		await register(page, user);
		await page.context().clearCookies();

		await page.goto("/forgot-password");
		await page.fill('input[name="email"]', user.email);
		await page.click('button[type="submit"]');
		await expect(page.getByText(/check your email|reset link/i).first()).toBeVisible();

		const email = await lastEmailTo(user.email);
		expect(email.subject).toBe("Reset your password");

		// Better Auth validates the token and redirects to /reset-password?token=…
		await page.goto(email.url);
		await page.waitForURL(/\/reset-password\?token=/);
		await page.fill('input[name="password"]', "brand-new-password");
		await page.fill('input[name="confirmPassword"]', "brand-new-password");
		await page.click('button[type="submit"]');
		await page.waitForURL("/login");

		await signIn(page, user.username, user.password);
		await expect(page.getByText("Incorrect username or password")).toBeVisible();
		await signIn(page, user.username, "brand-new-password");
		await page.waitForURL("/");

		// Tokens are single-use.
		await page.context().clearCookies();
		await page.goto(email.url);
		await page.waitForURL(/\/reset-password\?error=/);
	});

	test("lock screen re-checks the password", async ({ page }) => {
		const user = uniqueUser("lock");
		await register(page, user);

		await page.goto("/lock");
		await page.fill('input[name="password"]', "not-the-password");
		await page.click('button[type="submit"]');
		await expect(page.getByText("Incorrect password")).toBeVisible();

		await page.fill('input[name="password"]', user.password);
		await page.click('button[type="submit"]');
		await page.waitForURL("/");
	});
});
