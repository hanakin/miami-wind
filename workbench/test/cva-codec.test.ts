import { describe, expect, it } from "vitest";
import { type CvaModel, parseCva, serializeCva } from "../server/lib/cva-codec";

// The codec is pure logic, so it's tested against a self-contained cva string — NOT a real
// registry/customization file (those get reset when the base changes; a codec test must not depend on one).
const buttonSrc = `import { cva } from "class-variance-authority";
const button = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
				outline: "border bg-background shadow-xs hover:bg-accent",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 gap-1.5 px-3",
				lg: "h-10 px-6",
				icon: "size-9",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);
export { button as buttonVariants };
`;

describe("cva-codec", () => {
	it("parses a button cva into a model", () => {
		const m = parseCva(buttonSrc, "button");
		expect(m.localName).toBe("button");
		expect(m.exportName).toBe("buttonVariants");
		expect(m.base).toContain("inline-flex");
		expect(m.variants.variant?.default).toContain("bg-primary");
		expect(Object.keys(m.variants.size ?? {})).toEqual(["default", "sm", "lg", "icon"]);
		expect(m.defaultVariants).toEqual({ variant: "default", size: "default" });
		expect(m.compoundVariants).toEqual([]);
	});

	it("round-trips a button cva: parse → serialize → parse is stable", () => {
		const a = parseCva(buttonSrc, "button");
		const b = parseCva(serializeCva(a), "button");
		expect(b).toEqual(a);
	});

	it("round-trips compound variants and boolean defaults", () => {
		const model: CvaModel = {
			name: "demo",
			localName: "demo",
			exportName: "demoVariants",
			base: "inline-flex gap-2",
			variants: {
				intent: { primary: "bg-primary", ghost: "bg-transparent" },
				block: { true: "w-full", false: "w-auto" },
			},
			defaultVariants: { intent: "primary", block: false },
			compoundVariants: [
				{ conditions: { intent: "primary", block: true }, class: "shadow" },
				{ conditions: { intent: ["primary", "ghost"] }, class: "rounded-full" },
			],
		};
		expect(parseCva(serializeCva(model), "demo")).toEqual(model);
	});

	it("rejects a file with no cva declaration", () => {
		expect(() => parseCva("export const x = 1;", "x")).toThrow();
	});
});
