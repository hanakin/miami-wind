import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REGISTRY_JSON } from "../server/lib/registry-paths";
import { applyTheme, parseTheme, type RegistryJson } from "../server/lib/theme-codec";

const registry: RegistryJson = JSON.parse(readFileSync(REGISTRY_JSON, "utf8"));

describe("theme-codec", () => {
	it("parses theme + dark tokens", () => {
		const { tokens } = parseTheme(registry);
		const pink = tokens.find((t) => t.name === "--color-pink");
		expect(pink?.layer).toBe("theme");
		expect(typeof pink?.value).toBe("string");
		expect(tokens.find((t) => t.name === "--background")?.layer).toBe("dark");
	});

	it("round-trips: applyTheme(parseTheme) preserves the theme item", () => {
		const next = applyTheme(registry, parseTheme(registry));
		const before = registry.items.find((i) => i.name === "theme");
		const after = next.items.find((i) => i.name === "theme");
		expect(after?.cssVars).toEqual(before?.cssVars);
	});

	it("leaves the other registry items untouched", () => {
		const next = applyTheme(registry, parseTheme(registry));
		expect(next.items.map((i) => i.name)).toEqual(registry.items.map((i) => i.name));
		expect(next.items.find((i) => i.name === "button")).toEqual(
			registry.items.find((i) => i.name === "button"),
		);
	});

	it("updates a single token value", () => {
		const model = parseTheme(registry);
		const edited = {
			...model,
			tokens: model.tokens.map((t) => (t.name === "--color-pink" ? { ...t, value: "#ff0000" } : t)),
		};
		const next = applyTheme(registry, edited);
		const item = next.items.find((i) => i.name === "theme");
		expect(item?.cssVars?.theme?.["--color-pink"]).toBe("#ff0000");
	});
});
