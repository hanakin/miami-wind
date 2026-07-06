import { describe, expect, it } from "vitest";
import { addSlotAt, readSlots } from "../server/lib/tsx-slots";

// Fixture with known 0-based line:col coordinates (the same coords the dev source-stamp records):
//   line 1, col 1 → the already-slotted <div  (getStart of the opening element = the `<`)
//   line 2, col 2 → the un-tagged <span
const SRC = [
	"const X = () => (",
	'\t<div data-slot="x-root">',
	'\t\t<span className="a" />',
	"\t</div>",
	");",
	"",
].join("\n");

describe("addSlotAt", () => {
	it("injects a data-slot on the element at line:col and keeps its classes", () => {
		const out = addSlotAt(SRC, 2, 2, "x-icon");
		expect(out).toContain('<span data-slot="x-icon" className="a"');
		expect(readSlots(out)["x-icon"]).toBe("a"); // re-readable as a real slot
		expect(readSlots(out)["x-root"]).toBe(""); // untouched
	});

	it("rejects a position that isn't a JSX opening element", () => {
		expect(() => addSlotAt(SRC, 0, 0, "x-nope")).toThrow(/No JSX opening element/);
	});

	it("rejects an element that already has a data-slot", () => {
		expect(() => addSlotAt(SRC, 1, 1, "x-dupe")).toThrow(/already has a data-slot/);
	});
});
