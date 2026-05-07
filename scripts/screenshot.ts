import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const LOGIN_USERNAME = "admin";
const LOGIN_PASSWORD = "password123";

async function takeScreenshots() {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
		deviceScaleFactor: 2,
	});
	const page = await context.newPage();

	// Capture login page before logging in
	console.log("Capturing login page...");
	await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
	await page.waitForTimeout(500);
	await page.screenshot({ path: "screenshots/login.png" });

	// Login
	console.log("Logging in...");
	await page.fill('input[name="username"]', LOGIN_USERNAME);
	await page.fill('input[name="password"]', LOGIN_PASSWORD);
	await page.click('button[type="submit"]');
	await page.waitForURL(BASE_URL + "/", { timeout: 10000 });
	console.log("Logged in successfully");

	// Wait for dashboard charts to render
	await page.waitForSelector("svg", { timeout: 10000 });
	await page.waitForTimeout(2500);

	// Move mouse to top-left corner to avoid chart tooltip hover
	await page.mouse.move(0, 0);
	await page.waitForTimeout(300);

	// Light mode dashboard
	console.log("Capturing light mode dashboard...");
	await page.screenshot({ path: "screenshots/dashboard-light.png" });

	// Switch to dark mode via browser media emulation (mode-watcher respects prefers-color-scheme)
	console.log("Switching to dark mode...");
	await page.emulateMedia({ colorScheme: "dark" });
	await page.waitForTimeout(1000);
	await page.mouse.move(0, 0);
	await page.waitForTimeout(300);

	// Verify dark mode is applied
	const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
	console.log("Dark mode applied:", isDark);

	// Dark mode dashboard
	console.log("Capturing dark mode dashboard...");
	await page.screenshot({ path: "screenshots/dashboard-dark.png" });

	// Command palette (dark mode)
	console.log("Capturing command palette...");
	await page.keyboard.press("Meta+k");
	await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
	await page.waitForTimeout(300);
	await page.screenshot({ path: "screenshots/command-palette.png" });
	await page.keyboard.press("Escape");
	await page.waitForTimeout(300);

	// Switch back to light mode
	console.log("Switching to light mode...");
	await page.emulateMedia({ colorScheme: "light" });
	await page.waitForTimeout(1000);

	// Users page — SPA navigation via sidebar link
	console.log("Capturing users page...");
	await page.click('a[href="/users"]');
	await page.waitForURL(`${BASE_URL}/users`, { timeout: 10000 });
	await page.waitForSelector("table", { timeout: 10000 });
	await page.waitForTimeout(1000);
	await page.screenshot({ path: "screenshots/users-light.png" });

	// Analytics page — SPA navigation via sidebar link
	console.log("Capturing analytics page...");
	await page.click('a[href="/analytics"]');
	await page.waitForURL(`${BASE_URL}/analytics`, { timeout: 10000 });
	await page.waitForSelector("svg", { timeout: 10000 });
	await page.waitForTimeout(2000);
	await page.mouse.move(0, 0);
	await page.waitForTimeout(300);
	await page.screenshot({ path: "screenshots/analytics-light.png" });

	await browser.close();
	console.log("\nScreenshots saved to screenshots/ directory:");
	console.log("  - login.png");
	console.log("  - dashboard-light.png");
	console.log("  - dashboard-dark.png");
	console.log("  - command-palette.png");
	console.log("  - users-light.png");
	console.log("  - analytics-light.png");
}

takeScreenshots().catch((err) => {
	console.error("Screenshot failed:", err);
	process.exit(1);
});
