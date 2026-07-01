import { describe, expect, it } from "vitest";
import { parseCss, serializeCss } from "../server/lib/css-codec";

describe("css-codec", () => {
	it("splits top-level blocks by prelude", () => {
		const css = parseCss("@layer base { a { color: red; } }\n.btn { display: flex; }");
		expect(Object.keys(css)).toEqual(["@layer base", ".btn"]);
		expect(css[".btn"]).toBe("display: flex;");
	});

	it("preserves nested braces in a body verbatim", () => {
		const css = parseCss("@layer base { a { color: red; } b { color: blue; } }");
		expect(css["@layer base"]).toContain("a { color: red; }");
		expect(css["@layer base"]).toContain("b { color: blue; }");
	});

	it("handles @keyframes", () => {
		const css = parseCss("@keyframes x { from { opacity: 0 } to { opacity: 1 } }");
		expect(css["@keyframes x"]).toContain("from { opacity: 0 }");
		expect(css["@keyframes x"]).toContain("to { opacity: 1 }");
	});

	it("captures a bodyless at-rule", () => {
		expect(parseCss('@import "x.css";')).toEqual({ '@import "x.css"': "" });
	});

	it("ignores braces inside strings and comments", () => {
		const css = parseCss('.a { content: "}"; /* } */ color: red; }');
		expect(Object.keys(css)).toEqual([".a"]);
		expect(css[".a"]).toContain('content: "}";');
		expect(css[".a"]).toContain("color: red;");
	});

	it("concatenates duplicate preludes", () => {
		const css = parseCss("@layer base { a {} }\n@layer base { b {} }");
		expect(css["@layer base"]).toContain("a {}");
		expect(css["@layer base"]).toContain("b {}");
	});

	it("collapses whitespace in the prelude key", () => {
		expect(Object.keys(parseCss("@media  (min-width:\n700px) { a{} }"))).toEqual([
			"@media (min-width: 700px)",
		]);
	});

	it("empty / whitespace input → empty object", () => {
		expect(parseCss("   \n  ")).toEqual({});
	});

	it("serializes an empty body as a bodyless rule", () => {
		expect(serializeCss({ '@import "x"': "" })).toBe('@import "x";');
	});

	it("round-trips: parse(serialize(parse(x))) is stable", () => {
		const x =
			"@layer base {\n\ta { color: var(--color-primary); }\n}\n\n@keyframes mw-in {\n\tfrom { opacity: 0 }\n\tto { opacity: 1 }\n}";
		const once = parseCss(x);
		const twice = parseCss(serializeCss(once));
		expect(twice).toEqual(once);
	});
});
