// scene-loc — stamp every JSX element in a scene source with its source span.
//
// For the example scenes only, each `<El …>` gains a `data-loc="<relPath>:<start>:<end>"`
// attribute, where start/end are the element's character offsets in the *original* source
// (opening tag through closing tag). The client reads that attribute on click and asks
// /api/source for the exact slice — click a card, see its TSX.
//
// We parse with the TypeScript compiler API (same approach as cva-codec) and splice the
// attribute into each opening tag, walking the file bottom-up so earlier offsets stay valid.

import * as ts from "typescript";
import type { Plugin } from "vite";

// The scene set: everything under scenes/ plus the canvas that hosts the inline scenes.
const SCENE = /[\\/]src[\\/]components[\\/](scenes[\\/][^\\/]+|preview-canvas)\.tsx$/;

/**
 * Inject `data-loc` onto every JSX element in `code`. `relPath` is the value stamped into the
 * attribute (a workbench-relative path the source route can resolve). Pure and total: on any
 * parse/splice failure it returns the original code unchanged so the build never breaks.
 */
export function transformSceneLoc(code: string, relPath: string): string {
	try {
		const sf = ts.createSourceFile(relPath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
		// One edit per element: insert the attribute right after the tag name in the opening tag.
		const edits: { at: number; text: string }[] = [];

		const visit = (node: ts.Node): void => {
			const opening = ts.isJsxElement(node)
				? node.openingElement
				: ts.isJsxSelfClosingElement(node)
					? node
					: undefined;
			if (opening) {
				const start = node.getStart(sf);
				const end = node.getEnd();
				// Insert after the tag name (`<Card` → `<Card data-loc="…"`), before existing attrs.
				const at = opening.tagName.getEnd();
				edits.push({ at, text: ` data-loc=${JSON.stringify(`${relPath}:${start}:${end}`)}` });
			}
			ts.forEachChild(node, visit);
		};
		visit(sf);

		// Splice from the bottom up so each insertion leaves lower offsets untouched.
		edits.sort((a, b) => b.at - a.at);
		let out = code;
		for (const { at, text } of edits) out = out.slice(0, at) + text + out.slice(at);
		return out;
	} catch {
		return code;
	}
}

export function sceneLoc(): Plugin {
	return {
		name: "scene-loc",
		enforce: "pre",
		transform(code, id) {
			const file = id.split("?")[0] ?? id;
			const m = file.match(SCENE);
			if (!m) return null;
			// Stamp a stable workbench-relative path: "src/components/<…>.tsx".
			const rel = file.slice(file.indexOf("src/components/"));
			const out = transformSceneLoc(code, rel);
			return out === code ? null : { code: out, map: null };
		},
	};
}

export default sceneLoc;
