import { describe, expect, it } from "vitest";
import type { RegistryJson } from "../server/lib/theme-codec";
import { externalDeps, hasUiItem, removeUiItem, upsertUiItem } from "../server/lib/ui-items";

// biome-ignore lint/suspicious/noExplicitAny: test reads arbitrary registry item fields.
type Item = any;
const base = (): RegistryJson =>
	({
		items: [{ name: "registry", type: "registry:item", registryDependencies: ["theme"] }],
	}) as unknown as RegistryJson;

describe("externalDeps", () => {
	it("keeps bare packages, drops peers/aliases/node, scopes correctly", () => {
		const src = [
			'import { cn } from "~/utils/cn";',
			'import * as React from "react";',
			'import { Command } from "cmdk";',
			'import { Foo } from "@radix-ui/react-foo";',
			'import { Bar } from "radix-ui";',
			'import x from "./local";',
			'import { readFile } from "node:fs";',
		].join("\n");
		expect(externalDeps(src)).toEqual(["@radix-ui/react-foo", "cmdk", "radix-ui"]);
	});
});

describe("ui-items", () => {
	it("upserts a custom item + aggregate dep, with declared deps", () => {
		const reg = upsertUiItem(base(), "dropdown-menu", ["radix-ui"]);
		expect(hasUiItem(reg, "dropdown-menu")).toBe(true);
		const item = reg.items.find((i) => i.name === "dropdown-menu") as Item;
		expect(item.type).toBe("registry:ui");
		expect(item.dependencies).toEqual(["radix-ui"]);
		expect(item.files[0].target).toBe("~/components/ui/dropdown-menu.tsx");
		const agg = reg.items.find((i) => i.name === "registry") as Item;
		expect(agg.registryDependencies).toContain("dropdown-menu");
	});

	it("upsert is idempotent on the aggregate (no dup dep) and omits empty deps", () => {
		let reg = upsertUiItem(base(), "command", []);
		expect((reg.items.find((i) => i.name === "command") as Item).dependencies).toBeUndefined();
		reg = upsertUiItem(reg, "command", ["cmdk"]);
		const agg = reg.items.find((i) => i.name === "registry") as Item;
		expect(agg.registryDependencies.filter((d: string) => d === "command")).toHaveLength(1);
	});

	it("remove drops the item and the aggregate dep", () => {
		const reg = removeUiItem(upsertUiItem(base(), "command", []), "command");
		expect(hasUiItem(reg, "command")).toBe(false);
		const agg = reg.items.find((i) => i.name === "registry") as Item;
		expect(agg.registryDependencies).not.toContain("command");
	});
});
