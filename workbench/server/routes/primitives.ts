import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { CVA_DIR, safeName, UI_DIR } from "../lib/registry-paths";

async function listFiles(dir: string, ext: string): Promise<string[]> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((e) => e.isFile() && e.name.endsWith(ext))
			.map((e) => e.name.slice(0, -ext.length));
	} catch {
		return [];
	}
}

const primitives = new Hono()
	.get("/", async (c) => {
		// Custom primitives authored in the registry (icon, ...) and the cvas that currently exist.
		const [custom, cvas] = await Promise.all([
			listFiles(UI_DIR, ".tsx"),
			listFiles(CVA_DIR, ".ts"),
		]);
		return c.json({ custom, cvas });
	})
	.get("/source/:name", async (c) => {
		const name = safeName(c.req.param("name"));
		try {
			const source = await readFile(join(UI_DIR, `${name}.tsx`), "utf8");
			return c.json({ source });
		} catch {
			return c.json({ error: "not found" }, 404);
		}
	});

export default primitives;
