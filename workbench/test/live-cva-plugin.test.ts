import { describe, expect, it } from "vitest";
import { transformLiveCva } from "../plugin/live-cva";

const sample = `import { cva } from "class-variance-authority";

const buttonVariants = cva("inline-flex", {
	variants: { size: { sm: "h-8", lg: "h-10" } },
	defaultVariants: { size: "sm" },
});

export { buttonVariants };
`;

describe("transformLiveCva", () => {
	it("swaps an inline cva for a store-backed __liveCva call", () => {
		const out = transformLiveCva(sample, "button");
		expect(out).not.toBeNull();
		expect(out).toContain(`import { __liveCva } from "~/utils/live-cva";`);
		expect(out).toContain(
			`const buttonVariants = __liveCva("buttonVariants", "button", "inline-flex", {`,
		);
		// original cva config is passed through verbatim
		expect(out).toContain(`defaultVariants: { size: "sm" }`);
		expect(out).not.toContain("= cva(");
	});

	it("returns null when there is no inline cva", () => {
		expect(transformLiveCva("export const Icon = () => null;\n", "icon")).toBeNull();
	});

	it("handles multiple cva declarations in one file", () => {
		const multi = `const aVariants = cva("a");\nconst bVariants = cva("b", { variants: {} });\n`;
		const out = transformLiveCva(multi, "multi");
		expect(out).toContain(`__liveCva("aVariants", "multi", "a")`);
		expect(out).toContain(`__liveCva("bVariants", "multi", "b", { variants: {} })`);
	});

	it("preserves arbitrary-value classes with brackets and parens", () => {
		const src = `const x = cva("p-2", { variants: { v: { a: "hover:bg-[var(--color-pink-500)]" } } });\n`;
		const out = transformLiveCva(src, "x");
		expect(out).toContain(`hover:bg-[var(--color-pink-500)]`);
		expect(out).toContain(`__liveCva("x", "x", "p-2",`);
	});
});
