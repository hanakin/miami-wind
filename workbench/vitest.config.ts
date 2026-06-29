import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": resolve(import.meta.dirname, "src"),
			"@registry-ui": resolve(import.meta.dirname, "..", "registry", "components", "ui"),
		},
		dedupe: ["react", "react-dom", "@iconify/react"],
	},
	test: {
		environment: "node",
		include: ["test/**/*.test.{ts,tsx}"],
		setupFiles: ["./test/jsdom-setup.ts"],
		// jsdom renders Radix components ~10x slower than a browser; give render tests headroom.
		testTimeout: 10000,
	},
});
