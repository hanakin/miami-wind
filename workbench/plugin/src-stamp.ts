// src-stamp — the pixel → source bridge for the Exposure tool (dev only).
//
// Stamps every JSX opening element in an *owned* component file with its origin:
//
//   data-mw-src="<repoRelPath>:<line>:<col>"   (0-based line/col of the element's `<`)
//
// so a click on the rendered node maps straight back to the exact JSX element the server must edit —
// no walking DOM structure against source structure (base-ui injects wrapper nodes, the trees don't
// line up). "Owned" = the files Exposure is allowed to rewrite: the registry custom copies and the
// vendored vanilla primitives. Because only those files carry the stamp, "has data-mw-src" already
// means "authored in an editable component" — that IS the exposable filter, no heuristic needed.
//
// The stamp reaches the DOM only for elements that spread props onto their host node (base-ui parts and
// lucide icons do — the targets we care about). Same TS-compiler splice as scene-loc; pure and total.

import { relative, resolve } from "node:path";
import * as ts from "typescript";
import type { Plugin } from "vite";

// The owned component files: registry/components/ui/<name>.tsx and workbench/src/components/ui/<name>.tsx.
// The cva layer under ui/cva is `.ts` (no JSX) so it can't match.
const OWNED = /[\\/]components[\\/]ui[\\/][a-z0-9-]+\.tsx$/;
const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** Inject `data-mw-src` onto every JSX opening element in `code`. Pure/total — returns `code` on failure. */
export function transformSrcStamp(code: string, relPath: string): string {
	try {
		const sf = ts.createSourceFile(relPath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
		const edits: { at: number; text: string }[] = [];
		const visit = (node: ts.Node): void => {
			if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
				const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
				const at = node.tagName.getEnd();
				edits.push({
					at,
					text: ` data-mw-src=${JSON.stringify(`${relPath}:${pos.line}:${pos.character}`)}`,
				});
			}
			ts.forEachChild(node, visit);
		};
		visit(sf);
		edits.sort((a, b) => b.at - a.at);
		let out = code;
		for (const { at, text } of edits) out = out.slice(0, at) + text + out.slice(at);
		return out;
	} catch {
		return code;
	}
}

export function srcStamp(): Plugin {
	return {
		name: "mw-src-stamp",
		enforce: "pre",
		apply: "serve", // dev only — never in the production build
		transform(code, id) {
			const file = id.split("?")[0] ?? id;
			if (!OWNED.test(file)) return null;
			const rel = relative(REPO_ROOT, file).replace(/\\/g, "/");
			const out = transformSrcStamp(code, rel);
			return out === code ? null : { code: out, map: null };
		},
	};
}

export default srcStamp;
