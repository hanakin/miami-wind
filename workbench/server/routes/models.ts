import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { type ComponentModel, readComponentModel } from "../lib/component-model";
import { UI_DIR, VENDORED_UI } from "../lib/registry-paths";

// models — the launch-time pre-bake. Runs the categorization + interaction reader over EVERY component
// so the client's editor store never searches per click.
//
//   GET /api/models → { models: ComponentModel[] }  (custom registry source wins over vanilla)

async function listNames(dir: string): Promise<string[]> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((e) => e.isFile() && e.name.endsWith(".tsx"))
			.map((e) => e.name.slice(0, -4));
	} catch {
		return [];
	}
}

async function currentSource(name: string): Promise<string | null> {
	const custom = join(UI_DIR, `${name}.tsx`);
	const ok = await access(custom).then(
		() => true,
		() => false,
	);
	const path = ok ? custom : join(VENDORED_UI, `${name}.tsx`);
	return readFile(path, "utf8").catch(() => null);
}

const models = new Hono().get("/", async (c) => {
	const names = [
		...new Set([...(await listNames(VENDORED_UI)), ...(await listNames(UI_DIR))]),
	].sort();
	const out: ComponentModel[] = [];
	for (const name of names) {
		const src = await currentSource(name);
		if (src == null) continue;
		try {
			out.push(readComponentModel(src, name));
		} catch {
			// A component the reader can't parse is skipped, not fatal — the pre-bake is best-effort.
		}
	}
	return c.json({ models: out });
});

export default models;
