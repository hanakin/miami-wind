import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { customResolve } from "./plugin/custom-resolve";
import { liveCva } from "./plugin/live-cva";
import { sceneLoc } from "./plugin/scene-loc";

export default defineConfig({
	plugins: [
		customResolve(),
		liveCva(),
		sceneLoc(),
		tanstackRouter({
			target: "react",
			routesDirectory: "./src/app",
			generatedRouteTree: "./src/routeTree.gen.ts",
			routeFileIgnorePrefix: "-",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"~": resolve(import.meta.dirname, "src"),
			// Custom primitives are previewed live from the registry (single source of truth).
			"@registry-ui": resolve(import.meta.dirname, "..", "registry", "components", "ui"),
		},
		// The registry lives outside this package, so its react/iconify would otherwise resolve to the
		// repo-root node_modules — a second React copy that nulls the hook dispatcher. Force one copy.
		dedupe: ["react", "react-dom", "@iconify/react"],
	},
	server: {
		port: 5173,
		proxy: {
			"/api": "http://localhost:3000",
		},
		fs: {
			// Allow the dev server to read the sibling registry (custom primitives, cvas).
			allow: [resolve(import.meta.dirname, "..")],
		},
	},
});
