import { describe, expect, it } from "vitest";
import { cssForModel } from "~/utils/live-css";
import type { CvaModel } from "../server/lib/cva-codec";

const model: CvaModel = {
	name: "button",
	localName: "button",
	exportName: "buttonVariants",
	base: "rounded-md text-sm",
	variants: {
		variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90" },
		size: { default: "h-9 px-4" },
	},
	defaultVariants: { variant: "default", size: "default" },
	compoundVariants: [],
};

describe("live-css resolver", () => {
	const css = cssForModel(model);

	it("scopes every rule to the preview canvas + component slot", () => {
		const lines = css.split("\n").filter(Boolean);
		expect(lines.length).toBeGreaterThan(0);
		expect(lines.every((l) => l.startsWith('[data-preview] [data-slot="button"]'))).toBe(true);
	});

	it("resolves a color token to a var with shadcn-bridge fallback", () => {
		expect(css).toContain("background-color: var(--color-primary, var(--primary));");
	});

	it("resolves fractional opacity to color-mix — the case Tailwind never compiles at runtime", () => {
		expect(css).toContain('[data-variant="default"]:hover');
		expect(css).toContain(
			"color-mix(in oklab, var(--color-primary, var(--primary)) 90%, transparent)",
		);
	});

	it("maps radius and font-size from the base classes", () => {
		expect(css).toContain("border-radius: var(--radius-md);");
		expect(css).toContain("font-size: 0.875rem;");
	});

	it("ignores utilities it doesn't control (layout stays Tailwind's job)", () => {
		expect(css).not.toContain("h-9");
		expect(css).not.toContain("px-4");
	});
});

// The `[a]:` pass-through context (item asChild <a>) resolves to an anchor-scoped rule, so its hover
// becomes editable — while other arbitrary-selector contexts stay Tailwind's job.
describe("live-css link context", () => {
	const linkModel: CvaModel = {
		name: "item",
		localName: "item",
		exportName: "itemVariants",
		base: "rounded-md [a]:transition-colors [a]:hover:bg-accent/50",
		variants: {},
		defaultVariants: {},
		compoundVariants: [],
	};

	it("emits [a]:hover as an anchor-scoped rule", () => {
		const css = cssForModel(linkModel);
		expect(css).toContain('[data-preview] a[data-slot="item"]:hover {');
		expect(css).toContain(
			"color-mix(in oklab, var(--color-accent, var(--accent)) 50%, transparent)",
		);
	});

	it("resolves an [&_svg]: size context to a descendant rule (no longer skipped)", () => {
		const css = cssForModel({ ...linkModel, base: "[&_svg]:size-4" });
		expect(css).toContain('[data-preview] [data-slot="item"] svg { width: 1rem; height: 1rem; }');
	});
});

// A media cva's icon/image variants size bare child svgs/imgs via `[&_svg:not([class*='size-'])]:size-4`
// and `[&_img]:size-full`. The engine scopes each to its data-variant and renders it as a descendant
// rule, so the icon/image size is live-editable — the payoff of the widened tokenizer + declFor.
describe("live-css svg/img size contexts", () => {
	const media: CvaModel = {
		name: "item",
		localName: "itemMedia",
		exportName: "itemMediaVariants",
		base: "",
		variants: {
			variant: {
				icon: "[&_svg:not([class*='size-'])]:size-4",
				image: "[&_img]:size-full",
			},
		},
		defaultVariants: {},
		compoundVariants: [],
	};
	const css = cssForModel(media);

	it("scopes an icon-variant svg size to its data-variant + a descendant selector", () => {
		expect(css).toContain(
			`[data-preview] [data-slot="item-media"][data-variant="icon"] svg:not([class*='size-'])`,
		);
		expect(css).toContain("width: 1rem; height: 1rem;");
	});

	it("resolves an image-variant [&_img]:size-full to 100%", () => {
		expect(css).toContain(`[data-slot="item-media"][data-variant="image"] img`);
		expect(css).toContain("width: 100%; height: 100%;");
	});
});

// The plugin seeds every cva with name=file, so a component's secondary cva must get its slot from the
// export name — else itemMediaVariants would paint [data-slot="item"] instead of "item-media".
describe("live-css slot from export name", () => {
	it("derives a secondary cva's slot from its export name", () => {
		const media: CvaModel = {
			name: "item",
			localName: "itemMedia",
			exportName: "itemMediaVariants",
			base: "rounded-sm",
			variants: {},
			defaultVariants: {},
			compoundVariants: [],
		};
		expect(cssForModel(media)).toContain('[data-preview] [data-slot="item-media"]');
	});
});
