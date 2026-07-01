import { describe, expect, it } from "vitest";
import { transformSceneLoc } from "../plugin/scene-loc";

const REL = "src/components/scenes/x.tsx";
const LOC = /data-loc="([^:]+):(\d+):(\d+)"/g;

describe("transformSceneLoc", () => {
	it("stamps every element with offsets that slice the original source back", () => {
		const src = `export function S() { return <div className="card"><span>hi</span></div> }`;
		const out = transformSceneLoc(src, REL);

		// Both elements gained a data-loc.
		expect(out.match(/data-loc=/g)?.length).toBe(2);

		// Every stamped span, when used to slice the ORIGINAL string, returns that element's TSX.
		const hits = [...out.matchAll(LOC)];
		expect(hits.length).toBe(2);
		for (const [, path, start, end] of hits) {
			expect(path).toBe(REL);
			expect(src.slice(Number(start), Number(end))).toMatch(/^<(div|span)\b/);
		}

		// The outer div's span covers the whole element; the inner span's covers just `<span>hi</span>`.
		const spans = hits.map(([, , s, e]) => src.slice(Number(s), Number(e)));
		expect(spans).toContain(`<div className="card"><span>hi</span></div>`);
		expect(spans).toContain("<span>hi</span>");
	});

	it("stamps self-closing elements too", () => {
		const src = `export const S = () => <img src="a.png" />;`;
		const out = transformSceneLoc(src, REL);
		const hits = [...out.matchAll(LOC)];
		expect(hits.length).toBe(1);
		const [, , s, e] = hits[0] ?? [];
		expect(src.slice(Number(s), Number(e))).toBe(`<img src="a.png" />`);
	});

	it("inserts the attribute after the tag name, before existing attributes", () => {
		const out = transformSceneLoc(`const S = () => <a href="/x">y</a>;`, REL);
		expect(out).toContain(`<a data-loc="`);
		expect(out).toContain(`" href="/x">y</a>`);
	});

	it("skips fragments without throwing and leaves them unstamped", () => {
		const src = `export const S = () => <><span>a</span></>;`;
		const out = transformSceneLoc(src, REL);
		// The fragment got no attribute (fragments take none); the inner element still did.
		expect(out).toContain("<>");
		expect(out.match(/data-loc=/g)?.length).toBe(1);
	});

	it("returns the original source unchanged when there is no JSX", () => {
		const src = `export const n = 1 + 2;`;
		expect(transformSceneLoc(src, REL)).toBe(src);
	});
});
