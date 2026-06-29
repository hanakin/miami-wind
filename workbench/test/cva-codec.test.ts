import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type CvaModel, parseCva, serializeCva } from "../server/lib/cva-codec";
import { CVA_DIR } from "../server/lib/registry-paths";

const buttonSrc = readFileSync(join(CVA_DIR, "button.ts"), "utf8");

describe("cva-codec", () => {
	it("parses the real button.ts into a model", () => {
		const m = parseCva(buttonSrc, "button");
		expect(m.localName).toBe("button");
		expect(m.exportName).toBe("buttonVariants");
		expect(m.base).toContain("inline-flex");
		expect(m.variants.variant?.default).toContain("bg-primary");
		expect(Object.keys(m.variants.size ?? {})).toEqual(["default", "sm", "lg", "icon"]);
		expect(m.defaultVariants).toEqual({ variant: "default", size: "default" });
		expect(m.compoundVariants).toEqual([]);
	});

	it("round-trips button.ts: parse → serialize → parse is stable", () => {
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
