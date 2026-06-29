// live-cva — the workbench's live-editing counterpart to mw-cva.
//
// Where mw-cva swaps a primitive's inline `const xVariants = cva(...)` for an import
// of a static cva file, live-cva swaps it for a store-backed runtime lookup:
//
//   const xVariants = cva(BASE, CONFIG)
//     ⇩
//   const xVariants = __liveCva("xVariants", "<file>", BASE, CONFIG)
//
// __liveCva (src/utils/live-cva.ts) registers the vanilla shadcn default as a seed,
// then returns a function that reads the *current* model from the workbench store —
// so edits re-render instantly with the real primitive, and nothing is written to
// disk until Save. BASE and CONFIG are passed through verbatim, so the seed is the
// primitive's true default.

import type { Plugin } from "vite";

const UI_COMPONENT = /[\\/]components[\\/]ui[\\/]([^\\/]+)\.tsx$/;

/** Walk from the `(` at `open` to its matching `)`, string-aware. Returns -1 if unbalanced. */
function matchParen(code: string, open: number): number {
	let depth = 0;
	let inString: string | null = null;
	for (let i = open; i < code.length; i++) {
		const ch = code[i];
		if (inString) {
			if (ch === "\\") i++;
			else if (ch === inString) inString = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") inString = ch;
		else if (ch === "(") depth++;
		else if (ch === ")") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * Replace every `const <sym> = cva(<args>)` with `const <sym> = __liveCva("<sym>", "<file>", <args>)`
 * and inject the runtime import. Returns null when the file has no inline cva (left untouched).
 *
 * ponytail: the paren walk treats template literals as plain strings (no ${} nesting). cva bases are
 * normal string literals, so this holds; revisit if a cva base ever uses a template literal.
 */
export function transformLiveCva(code: string, file: string): string | null {
	const decl = /const\s+([A-Za-z0-9_$]+)\s*=\s*cva\s*\(/g;
	let out = "";
	let last = 0;
	let found = false;
	let m: RegExpExecArray | null = decl.exec(code);
	while (m !== null) {
		const sym = m[1];
		const open = decl.lastIndex - 1;
		const close = matchParen(code, open);
		if (close < 0) {
			m = decl.exec(code);
			continue;
		}
		const args = code.slice(open + 1, close);
		out += code.slice(last, m.index);
		out += `const ${sym} = __liveCva(${JSON.stringify(sym)}, ${JSON.stringify(file)}, ${args})`;
		last = close + 1;
		decl.lastIndex = close + 1;
		found = true;
		m = decl.exec(code);
	}
	if (!found) return null;
	out += code.slice(last);
	return `import { __liveCva } from "~/utils/live-cva";\n${out}`;
}

export function liveCva(): Plugin {
	return {
		name: "live-cva",
		enforce: "pre",
		transform(code, id) {
			const file = id.split("?")[0] ?? id;
			const name = file.match(UI_COMPONENT)?.[1];
			if (!name || name === "cva") return null;
			const swapped = transformLiveCva(code, name);
			return swapped === null ? null : { code: swapped, map: null };
		},
	};
}

export default liveCva;
