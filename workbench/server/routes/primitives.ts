import { readdir } from "node:fs/promises";
import { Hono } from "hono";
import { CVA_DIR, UI_DIR } from "../lib/registry-paths";

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

const primitives = new Hono().get("/", async (c) => {
	// Custom primitives authored in the registry (icon, ...) and the cvas that exist for them.
	const [custom, cvas] = await Promise.all([listFiles(UI_DIR, ".tsx"), listFiles(CVA_DIR, ".ts")]);
	return c.json({ custom, cvas });
});

export default primitives;
