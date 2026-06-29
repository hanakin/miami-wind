import { describe, expect, it } from "vitest";
import {
	addRaw,
	applyUtility,
	colorUtility,
	findUtility,
	isColor,
	parseClasses,
	parseColor,
	removeRaw,
} from "~/utils/tw-tokens";

describe("tw-tokens", () => {
	it("splits interaction-state prefixes from utilities", () => {
		const tokens = parseClasses("bg-primary hover:bg-pink focus-visible:underline");
		expect(tokens.map((t) => t.state)).toEqual(["", "hover:", "focus-visible:"]);
		expect(tokens[1]?.utility).toBe("bg-pink");
	});

	it("parses and serializes color utilities with opacity", () => {
		expect(parseColor("bg-primary", "bg")).toEqual({ token: "primary", opacity: 100 });
		expect(parseColor("bg-pink/50", "bg")).toEqual({ token: "pink", opacity: 50 });
		expect(parseColor("border-2", "border")).toBeNull(); // width, not a color token
		expect(colorUtility("bg", "pink", 100)).toBe("bg-pink");
		expect(colorUtility("bg", "pink", 50)).toBe("bg-pink/50");
	});

	it("applyUtility replaces only the matched utility within one state", () => {
		const out = applyUtility("bg-primary text-text hover:bg-pink", "", isColor("bg"), "bg-surface");
		expect(out).toBe("text-text hover:bg-pink bg-surface");
		expect(findUtility(out, "hover:", isColor("bg"))).toBe("bg-pink"); // hover bg untouched
	});

	it("applyUtility removes the matched utility when given null", () => {
		expect(applyUtility("bg-primary p-2", "", isColor("bg"), null)).toBe("p-2");
	});

	it("addRaw dedupes and removeRaw drops exact tokens", () => {
		expect(addRaw("p-2", "gap-2")).toBe("p-2 gap-2");
		expect(addRaw("p-2", "p-2")).toBe("p-2");
		expect(removeRaw("p-2 gap-2", "p-2")).toBe("gap-2");
	});
});
