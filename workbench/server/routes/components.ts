import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { formatFile } from "../lib/format";
import { REGISTRY_JSON, REGISTRY_ROOT, safeName, UI_DIR, VENDORED_UI } from "../lib/registry-paths";
import type { RegistryJson } from "../lib/theme-codec";
import {
	addSlotAt,
	readClassNames,
	readSlots,
	writeClassNames,
	writeSlots,
} from "../lib/tsx-slots";
import { externalDeps, removeUiItem, upsertUiItem } from "../lib/ui-items";

// components — the slot-editing round-trip for components that have no cva.
//
//   GET    /api/components/:name  → { slots: { "<data-slot>": "<classes>" }, custom: bool }
//   PUT    /api/components/:name  → promote the vanilla primitive to a custom (full source vendored
//                                   into registry/components/ui/<name>.tsx), write the slot classes,
//                                   and register the registry:ui item. Body: { "<data-slot>": classes }.
//   DELETE /api/components/:name  → revert: delete the custom file + its registry item.
//
// A custom component is the source of truth — its classes ARE the install output, no build-time
// injection. The workbench renders it live (custom-resolve plugin redirects ~/components/ui/<name>).

const customPath = (name: string) => join(UI_DIR, `${name}.tsx`);
const vendoredPath = (name: string) => join(VENDORED_UI, `${name}.tsx`);

async function exists(path: string): Promise<boolean> {
	return access(path).then(
		() => true,
		() => false,
	);
}

/** The file backing this component's current source: the custom file once promoted, else the vanilla. */
async function currentSourcePath(name: string): Promise<string | null> {
	if (await exists(customPath(name))) return customPath(name);
	if (await exists(vendoredPath(name))) return vendoredPath(name);
	return null;
}

/** Current source: the custom file once promoted, else the vendored vanilla. */
async function currentSource(name: string): Promise<string | null> {
	const path = await currentSourcePath(name);
	return path ? readFile(path, "utf8") : null;
}

/** Write `next` to the custom path (the promotion), format it, and register the registry:ui item. */
async function promote(name: string, next: string): Promise<void> {
	await writeFile(customPath(name), next, "utf8"); // promote: now owned in the registry
	await formatFile(customPath(name));
	await writeRegistry(upsertUiItem(await readRegistry(), name, externalDeps(next)));
}

async function readRegistry(): Promise<RegistryJson> {
	return JSON.parse(await readFile(REGISTRY_JSON, "utf8")) as RegistryJson;
}

async function writeRegistry(reg: RegistryJson): Promise<void> {
	await writeFile(REGISTRY_JSON, `${JSON.stringify(reg, null, "\t")}\n`, "utf8");
}

const classMap = z.record(z.string(), z.string());
// A component may expose two kinds of editable class surface: data-slot elements (writeSlots) and the
// cn()s inside a classNames={{…}} object (writeClassNames). The client sends whichever it edited.
const putSchema = z.object({ slots: classMap.optional(), surfaces: classMap.optional() });

const components = new Hono()
	.get("/:name", async (c) => {
		const name = safeName(c.req.param("name"));
		const src = await currentSource(name);
		if (src == null) return c.json({ error: "not found" }, 404);
		return c.json({
			slots: readSlots(src),
			surfaces: readClassNames(src),
			custom: await exists(customPath(name)),
		});
	})
	.put("/:name", zValidator("json", putSchema), async (c) => {
		const name = safeName(c.req.param("name"));
		const base = await currentSource(name);
		if (base == null) return c.json({ error: "not found" }, 404);
		const { slots, surfaces } = c.req.valid("json");
		let next = base;
		if (slots) next = writeSlots(next, slots);
		if (surfaces) next = writeClassNames(next, surfaces);
		await promote(name, next);
		return c.json({ ok: true });
	})
	// Exposure tool: promote a raw, un-tagged node (an icon/indicator) to a real data-slot, so the editor
	// can address it. `src` is the dev source-stamp (data-mw-src) the client read off the clicked pixel:
	// "<repoRelPath>:<line>:<col>". Same promote tail as PUT — only the "apply edit" step differs.
	.post(
		"/:name/expose",
		zValidator(
			"json",
			z.object({ src: z.string(), part: z.string().regex(/^[a-z0-9][a-z0-9-]*$/) }),
		),
		async (c) => {
			const name = safeName(c.req.param("name"));
			const { src, part } = c.req.valid("json");
			const m = src.match(/^(.*):(\d+):(\d+)$/);
			if (!m?.[1]) return c.json({ error: "malformed src" }, 400);
			const [, relPath, line, col] = m;
			// Path guard: the stamped file must BE this component's current source (traversal / wrong-file).
			const path = await currentSourcePath(name);
			if (path == null) return c.json({ error: "not found" }, 404);
			if (resolve(REGISTRY_ROOT, relPath) !== path) return c.json({ error: "src mismatch" }, 400);
			const source = await readFile(path, "utf8");
			const slot = `${name}-${part}`;
			if (slot in readSlots(source)) return c.json({ error: "slot exists" }, 409);
			let next: string;
			try {
				next = addSlotAt(source, Number(line), Number(col), slot);
			} catch (e) {
				return c.json({ error: (e as Error).message }, 400);
			}
			await promote(name, next);
			return c.json({ ok: true, slot });
		},
	)
	.delete("/:name", async (c) => {
		const name = safeName(c.req.param("name"));
		await unlink(customPath(name)).catch(() => {});
		await writeRegistry(removeUiItem(await readRegistry(), name));
		return c.json({ ok: true });
	});

export default components;
