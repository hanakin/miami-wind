import { describe, expect, it } from "vitest";
import { cn } from "~/utils/cn";

describe("cn", () => {
	it("merges conflicting tailwind classes, last wins", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
	});

	it("keeps non-conflicting classes and drops falsy values", () => {
		expect(cn("flex", false, "items-center")).toBe("flex items-center");
	});
});
