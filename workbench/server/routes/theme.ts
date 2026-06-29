import { readFile, writeFile } from "node:fs/promises";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { formatFile } from "../lib/format";
import { generateGlobalsCss } from "../lib/globals-codec";
import { GLOBALS_CSS, REGISTRY_JSON } from "../lib/registry-paths";
import { clearClassListCache } from "../lib/tailwind-classlist";
import { applyTheme, parseTheme, type RegistryJson, themeModelSchema } from "../lib/theme-codec";

async function readRegistry(): Promise<RegistryJson> {
	return JSON.parse(await readFile(REGISTRY_JSON, "utf8"));
}

const theme = new Hono()
	.get("/", async (c) => {
		return c.json(parseTheme(await readRegistry()));
	})
	.put("/", zValidator("json", themeModelSchema), async (c) => {
		const model = c.req.valid("json");
		const next = applyTheme(await readRegistry(), model);
		await writeFile(REGISTRY_JSON, `${JSON.stringify(next, null, "\t")}\n`, "utf8");
		await formatFile(REGISTRY_JSON);
		// Re-theme the workbench itself: registry.json is the source of truth, globals.css mirrors it.
		await writeFile(GLOBALS_CSS, generateGlobalsCss(model), "utf8");
		await formatFile(GLOBALS_CSS);
		clearClassListCache();
		return c.json({ ok: true });
	});

export default theme;
