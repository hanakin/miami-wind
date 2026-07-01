import { describe, expect, it } from "vitest";
import { dedent, safePath } from "../server/routes/source";

describe("source route path-safety", () => {
	it("accepts a .tsx file under src/", () => {
		expect(safePath("src/components/scenes/cards-scene.tsx")).toMatch(
			/src[\\/]components[\\/]scenes[\\/]cards-scene\.tsx$/,
		);
	});

	it("rejects traversal out of src/", () => {
		expect(safePath("../../package.json")).toBeNull();
		expect(safePath("src/../../package.json")).toBeNull();
	});

	it("rejects paths outside src/ and non-source extensions", () => {
		expect(safePath("server/index.ts")).toBeNull();
		expect(safePath("src/styles/globals.css")).toBeNull();
	});
});

describe("dedent", () => {
	it("strips the common leading indentation, keeping relative nesting", () => {
		expect(dedent("\t\t<Card>\n\t\t\t<Inner />\n\t\t</Card>")).toBe("<Card>\n\t<Inner />\n</Card>");
	});

	it("ignores blank lines when measuring the common indent", () => {
		expect(dedent("\t\ta\n\n\t\tb")).toBe("a\n\nb");
	});
});
