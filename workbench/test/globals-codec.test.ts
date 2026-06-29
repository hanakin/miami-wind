import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateGlobalsCss } from "../server/lib/globals-codec";
import { REGISTRY_JSON } from "../server/lib/registry-paths";
import { parseTheme, type RegistryJson } from "../server/lib/theme-codec";

const registry: RegistryJson = JSON.parse(readFileSync(REGISTRY_JSON, "utf8"));
const css = generateGlobalsCss(parseTheme(registry));

describe("globals-codec", () => {
	it("emits the tailwind import and both theme layers", () => {
		expect(css).toContain('@import "tailwindcss";');
		expect(css).toContain("@theme {");
		expect(css).toContain("--color-grey-50: #cdd6f4;");
		expect(css).toContain("color-scheme: dark;");
		expect(css).toContain("@layer base {");
	});

	it("bridges shadcn fallback tokens but not theme twins or radius", () => {
		expect(css).toContain("--color-background: var(--background);");
		expect(css).toContain("--color-card: var(--card);");
		expect(css).not.toContain("--color-primary: var(--primary);");
		expect(css).not.toContain("--color-radius:");
	});

	it("does not bridge a new var-only token (no utility)", () => {
		const model = parseTheme(registry);
		model.tokens.push({ name: "--brand-gap", value: "8px", layer: "dark" });
		expect(generateGlobalsCss(model)).not.toContain("--color-brand-gap");
	});

	it("includes a new var+utilities token directly in @theme", () => {
		const model = parseTheme(registry);
		model.tokens.push({ name: "--color-brand", value: "#abcdef", layer: "theme" });
		expect(generateGlobalsCss(model)).toContain("--color-brand: #abcdef;");
	});
});
