import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { WORKBENCH_ROOT } from "../lib/registry-paths";

// source — return a slice of a scene source file for the click-to-source popover.
//
//   GET /api/source?path=src/components/scenes/cards-scene.tsx&start=120&end=480
//     → { source: "<that element's TSX>" }
//
// The scene-loc Vite plugin stamps `data-loc="<path>:<start>:<end>"` on every JSX element;
// the client passes those three back here. SECURITY: the path is resolved against the
// workbench src/ root and rejected (400) if it escapes it or isn't a .ts/.tsx file —
// same path-safety mindset as registry-paths' safeName.

const SRC_ROOT = resolve(WORKBENCH_ROOT, "src");

const querySchema = z.object({
	path: z.string(),
	start: z.coerce.number().int().nonnegative(),
	end: z.coerce.number().int().nonnegative(),
});

/** Resolve `rel` under src/, or null if it escapes the root or isn't a source file. */
export function safePath(rel: string): string | null {
	const abs = resolve(WORKBENCH_ROOT, rel);
	if (abs !== SRC_ROOT && !abs.startsWith(SRC_ROOT + sep)) return null;
	if (!abs.endsWith(".ts") && !abs.endsWith(".tsx")) return null;
	return abs;
}

/** Strip the common leading indentation from every line so a mid-file slice reads flush-left. */
export function dedent(s: string): string {
	let min = Number.POSITIVE_INFINITY;
	for (const line of s.split("\n")) {
		if (!line.trim()) continue; // blank lines don't constrain the indent
		min = Math.min(min, line.length - line.trimStart().length);
	}
	if (!Number.isFinite(min) || min === 0) return s;
	return s
		.split("\n")
		.map((l) => l.slice(min))
		.join("\n");
}

const source = new Hono().get("/", zValidator("query", querySchema), async (c) => {
	const { path, start, end } = c.req.valid("query");
	const abs = safePath(path);
	if (!abs) return c.json({ error: "invalid path" }, 400);
	try {
		const file = await readFile(abs, "utf8");
		// `start` is the element's tag offset — past its line's leading indentation. Back up to the
		// line start so the first line keeps its indent, then dedent the block to read flush-left.
		const lineStart = file.lastIndexOf("\n", start - 1) + 1;
		return c.json({ source: dedent(file.slice(lineStart, end)) });
	} catch {
		return c.json({ error: "not found" }, 404);
	}
});

export default source;
