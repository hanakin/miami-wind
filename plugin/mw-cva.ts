// mw-cva — Miami Wind cva plugin
//
// Links a *vanilla* shadcn primitive to its separate Miami Wind cva by filename
// convention, at build time, with a clean inline fallback. This is what makes the
// cva layer work without editing the shadcn component source.
//
// Convention
// ----------
//   components/ui/<name>.tsx        the vanilla shadcn primitive (inline `const <x>Variants = cva(...)`)
//   components/ui/cva/<name>.ts     the Miami Wind variant layer, exporting the same `<x>Variants`
//
// Behavior
// --------
//   - cva sibling present → the inline `const <x>Variants = cva(...)` in the primitive is replaced with
//     `import { <x>Variants } from "./cva/<name>"`, so the component renders the Miami Wind variants.
//   - cva sibling absent  → the primitive is left byte-for-byte vanilla (the inline cva is its fallback).
//
// The component is never hand-edited; the swap happens only in the bundle.
//
// Usage (vite.config.ts):
//   import { mwCva } from "./mw-cva";
//   export default defineConfig({ plugins: [mwCva(), react(), ...] });

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";

const UI_COMPONENT = /[\\/]components[\\/]ui[\\/]([^\\/]+)\.tsx$/;
const INLINE_CVA = /const\s+([A-Za-z0-9_$]+Variants)\s*=\s*cva\s*\(/;

export interface MwCvaOptions {
	/** Folder name (inside components/ui/) holding the cva files. Default: "cva". */
	cvaDir?: string;
}

export function mwCva(options: MwCvaOptions = {}): Plugin {
	const cvaDir = options.cvaDir ?? "cva";

	return {
		name: "mw-cva",
		enforce: "pre",

		transform(code, id) {
			const file = id.split("?")[0];
			const match = file.match(UI_COMPONENT);
			if (!match) return null;

			const name = match[1];
			if (name === cvaDir) return null; // never process files inside the cva dir itself

			let out = code;
			let changed = false;

			// Sibling cva: components/ui/cva/<name>.ts — swap the inline cva for the Miami Wind one.
			// Components with no inline cva are customized by shipping the full source instead (a
			// registry:ui item under registry/components/ui/<name>.tsx), not by build-time injection.
			const cvaPath = join(dirname(file), cvaDir, `${name}.ts`);
			if (existsSync(cvaPath)) {
				const swapped = swapInlineCva(out, name, cvaDir);
				if (swapped !== null) {
					out = swapped;
					changed = true;
				}
			}

			return changed ? { code: out, map: null } : null;
		},
	};
}

/**
 * Replace `const <x>Variants = cva( ... )` with `import { <x>Variants } from "./<cvaDir>/<name>"`.
 * Paren-depth matching handles multi-line cva bodies. Returns null if no inline cva is present.
 */
function swapInlineCva(code: string, name: string, cvaDir: string): string | null {
	const m = INLINE_CVA.exec(code);
	if (!m) return null;

	const symbol = m[1];
	const start = m.index;

	// Walk from the opening paren of cva( to its matching close.
	let i = INLINE_CVA.lastIndex - 1; // index of '('
	let depth = 0;
	let inString: string | null = null;
	for (; i < code.length; i++) {
		const ch = code[i];
		if (inString) {
			if (ch === "\\")
				i++; // skip escaped char
			else if (ch === inString) inString = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") inString = ch;
		else if (ch === "(") depth++;
		else if (ch === ")") {
			depth--;
			if (depth === 0) {
				i++;
				break;
			}
		}
	}
	if (depth !== 0) return null; // unbalanced — leave the file untouched

	if (code[i] === ";") i++; // consume trailing semicolon
	const end = i;

	const importStmt = `import { ${symbol} } from "./${cvaDir}/${name}";`;
	return code.slice(0, start) + importStmt + code.slice(end);
}

export default mwCva;
