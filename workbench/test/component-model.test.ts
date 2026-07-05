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

const present = (m: ReturnType<typeof model>, piece: string) =>
	(m.interactionsByPiece[piece] ?? []).filter((i) => i.present).map((i) => i.name);
const addable = (m: ReturnType<typeof model>, piece: string) =>
	(m.interactionsByPiece[piece] ?? []).filter((i) => !i.present).map((i) => i.name);

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

	it("Render = the root can render as `a` (base-ui render / old asChild) — not a flag", () => {
		expect(m.render?.slot).toBe("item");
		expect(m.render?.elements).toContain("a");
		expect(flagNames(m)).not.toContain("as link"); // it's a render-element change, not a flag
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

describe("component-model — interactions (derived from real classes, per piece)", () => {
	const item = model("item");
	const dm = model("dropdown-menu");

	it("dropdown item: focus·disabled are real; hover·active offered to Add; no animation/checked", () => {
		const p = present(dm, "dropdown-menu-item");
		expect(p).toEqual(expect.arrayContaining(["default", "focus", "disabled"]));
		expect(p).not.toContain("hover"); // the highlight is focus:, NOT hover: — the exact bug
		expect(p).not.toContain("checked");
		expect(addable(dm, "dropdown-menu-item")).toEqual(expect.arrayContaining(["hover", "active"]));
	});

	it("scoped states attribute to their scope, not the plain piece: the destructive-variant focus is not in the plain item's focus classes", () => {
		// dropdown item's plain focus is `focus:bg-accent`; `data-[variant=destructive]:focus:…` is the
		// destructive variant's focus — it belongs to that variant, so it stays out of the plain classes.
		const focus = dm.classesByPieceState["dropdown-menu-item"]?.focus ?? "";
		expect(focus).toContain("focus:bg-accent");
		expect(focus).not.toContain("data-[variant=destructive]");
	});

	it("dropdown checkbox-item: focus·disabled real; NO checked (its check is an ItemIndicator, not an editable class)", () => {
		const p = present(dm, "dropdown-menu-checkbox-item");
		expect(p).toEqual(expect.arrayContaining(["default", "focus", "disabled"]));
		expect(p).not.toContain("checked");
	});

	it("dropdown sub-trigger: active is real (data-[state=open] → active), backed by editable classes", () => {
		expect(present(dm, "dropdown-menu-sub-trigger")).toEqual(
			expect.arrayContaining(["focus", "active"]),
		);
		// active carries real (non-animation) classes → editable
		expect(dm.classesByPieceState["dropdown-menu-sub-trigger"]?.active).toContain("bg-accent");
	});

	it("dropdown content: only default — its open/closed are animation-only and hidden", () => {
		expect(present(dm, "dropdown-menu-content")).toEqual(["default"]);
	});

	it("dropdown trigger: no own classes → default only; active is a core Add offer", () => {
		expect(present(dm, "dropdown-menu-trigger")).toEqual(["default"]);
		expect(addable(dm, "dropdown-menu-trigger")).toContain("active");
	});

	it("item root: focus-visible (ring) is the only real state — the [a]:hover: belongs to the as-link flag, not the plain item", () => {
		const p = present(item, "item");
		expect(p).toEqual(["default", "focus-visible"]);
		expect(p).not.toContain("hover"); // [a]:hover:bg-accent/50 is scoped to the link, surfaced via `as link`
		expect(item.classesByPieceState.item?.["focus-visible"]).toContain(
			"focus-visible:ring-ring/50",
		);
		// hover is now a core Add offer (no longer wrongly present); visited too, since item can be a link.
		expect(addable(item, "item")).toEqual(
			expect.arrayContaining(["hover", "focus", "active", "disabled", "visited"]),
		);
	});
});
