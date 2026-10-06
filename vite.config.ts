import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		define: { __BUILD_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || "development") },
		plugins: [
			tailwindcss(),
			sveltekit({ adapter: adapter({ out: "build" }), paths: { origin: env.ORIGIN || undefined } }),
		],
		// Resolve the CSS-only export explicitly for Tailwind's SSR stylesheet loader.
		resolve: {
			alias: {
				"tw-animate-css": fileURLToPath(
					new URL("./node_modules/tw-animate-css/dist/tw-animate.css", import.meta.url)
				),
			},
		},
		ssr: {
			noExternal: ["layerchart", "svelte-ux"],
		},
		test: { include: ["src/**/*.test.ts"] },
	};
});
