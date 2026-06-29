import { readFile } from "node:fs/promises";
import { __unstable__loadDesignSystem } from "@tailwindcss/node";
import { GLOBALS_CSS, WORKBENCH_ROOT } from "./registry-paths";

/**
 * Full Tailwind v4 class list via the design-system introspection the language
 * service is built on. Loaded from the workbench's own globals.css, so Miami
 * Wind's custom utilities (bg-pink, text-surface, bg-grey-800, ...) are included.
 *
 * ponytail: rides the __unstable__ loader; if it churns, pin tailwindcss + snapshot
 * the list. Cached until a theme save invalidates it (new tokens ⇒ new utilities).
 */

let cache: string[] | null = null;

export async function getClassList(): Promise<string[]> {
	if (cache) return cache;
	const css = await readFile(GLOBALS_CSS, "utf8");
	const design = await __unstable__loadDesignSystem(css, { base: WORKBENCH_ROOT });
	const entries = design.getClassList() as Array<[string, unknown]>;
	cache = entries.map((e) => e[0]);
	return cache;
}

export function clearClassListCache(): void {
	cache = null;
}
