import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readComponentModel } from "../server/lib/component-model";
import { WORKBENCH_ROOT } from "../server/lib/registry-paths";

const UI = join(WORKBENCH_ROOT, "src/components/ui");
const model = (name: string) =>
	readComponentModel(readFileSync(join(UI, `${name}.tsx`), "utf8"), name);

const variantNames = (m: ReturnType<typeof model>) => m.variants.map((v) => v.name);
const flagNames = (m: ReturnType<typeof model>) => m.flags.map((f) => f.name);

describe("component-model — item (the done reference)", () => {
	const m = model("item");

	it("Root is the item itself; no trigger", () => {
		expect(m.root).toBe("item");
		expect(m.trigger).toBeNull();
	});

	it("Layout/Structure = the wrappers/dividers, not parts of one item", () => {
		expect(m.structure).toEqual(expect.arrayContaining(["item-group", "item-separator"]));
	});

	it("Parts = the sub-elements; NOT the root, NOT icon/image (they have no own slot)", () => {
		expect(m.parts).toEqual(
			expect.arrayContaining(["item-media", "item-content", "item-title", "item-description"]),
		);
		expect(m.parts).not.toContain("item");
		expect(m.parts).not.toContain("icon");
		expect(m.parts).not.toContain("image");
	});

	it("Variants come from BOTH cvas; `default` folds into Root; icon/image are media variants", () => {
		expect(variantNames(m)).toEqual(
			expect.arrayContaining(["outline", "muted", "sm", "xs", "icon", "image"]),
		);
		expect(variantNames(m)).not.toContain("default");
		expect(m.variants.find((v) => v.name === "icon")?.namespace).toBe("item-media");
		expect(m.variants.find((v) => v.name === "outline")?.namespace).toBe("item");
	});

	it("Flags = as link (asChild → <a>, via the [a]: context)", () => {
		expect(flagNames(m)).toContain("as link");
	});
});

describe("component-model — dropdown-menu (the dynamic reference)", () => {
	const m = model("dropdown-menu");

	it("Root is the open menu (content); Trigger is the opener", () => {
		expect(m.root).toBe("dropdown-menu-content");
		expect(m.trigger).toBe("dropdown-menu-trigger");
	});

	it("no-DOM providers (dropdown-menu, portal, sub) are dropped", () => {
		const all = [m.root, m.trigger, ...m.structure, ...m.parts];
		expect(all).not.toContain("dropdown-menu");
		expect(all).not.toContain("dropdown-menu-portal");
		expect(all).not.toContain("dropdown-menu-sub");
	});

	it("Structure = group / radio-group / separator", () => {
		expect(m.structure).toEqual(
			expect.arrayContaining([
				"dropdown-menu-group",
				"dropdown-menu-radio-group",
				"dropdown-menu-separator",
			]),
		);
	});

	it("Parts = the rows/panels inside the menu (item, sub-content, …)", () => {
		expect(m.parts).toEqual(
			expect.arrayContaining([
				"dropdown-menu-item",
				"dropdown-menu-checkbox-item",
				"dropdown-menu-radio-item",
				"dropdown-menu-label",
				"dropdown-menu-shortcut",
				"dropdown-menu-sub-trigger",
				"dropdown-menu-sub-content",
			]),
		);
	});

	it("Variants = destructive (data-[variant]); Flags = inset (data-[inset]) — no cva here", () => {
		expect(variantNames(m)).toContain("destructive");
		expect(flagNames(m)).toContain("inset");
		expect(flagNames(m)).not.toContain("disabled"); // data-[disabled] is a state, not a flag
	});
});
