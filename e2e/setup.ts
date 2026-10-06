import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

export default async function setup() {
	const database = process.env.DATABASE_URL;
	if (!database?.endsWith("/.svelte-kit/e2e.db"))
		throw new Error("E2E setup requires the dedicated test database");
	mkdirSync(".svelte-kit", { recursive: true });
	for (const suffix of ["", "-wal", "-shm"]) rmSync(`${database}${suffix}`, { force: true });
	execFileSync("pnpm", ["db:push"], { stdio: "inherit", env: process.env });
	const { seedDemo } = await import("../src/lib/server/db/seed.js");
	await seedDemo();
}

await setup();
