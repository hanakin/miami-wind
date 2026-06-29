import { access, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	type CvaModel,
	CvaParseError,
	cvaModelSchema,
	parseCva,
	serializeCva,
} from "../lib/cva-codec";
import { formatFile } from "../lib/format";
import { CVA_DIR, safeName } from "../lib/registry-paths";

const filePath = (name: string) => join(CVA_DIR, `${safeName(name)}.ts`);

async function exists(path: string): Promise<boolean> {
	return access(path).then(
		() => true,
		() => false,
	);
}

async function listNames(): Promise<string[]> {
	try {
		const entries = await readdir(CVA_DIR);
		return entries.filter((f) => f.endsWith(".ts")).map((f) => f.replace(/\.ts$/, ""));
	} catch {
		return [];
	}
}

const cva = new Hono()
	.get("/", async (c) => {
		const models: CvaModel[] = [];
		const errors: { name: string; error: string }[] = [];
		for (const name of await listNames()) {
			try {
				models.push(parseCva(await readFile(filePath(name), "utf8"), name));
			} catch (e) {
				errors.push({ name, error: e instanceof Error ? e.message : String(e) });
			}
		}
		return c.json({ models, errors });
	})
	.get("/:name", async (c) => {
		const name = c.req.param("name");
		const path = filePath(name);
		if (!(await exists(path))) return c.json({ error: "not found" }, 404);
		try {
			return c.json(parseCva(await readFile(path, "utf8"), name));
		} catch (e) {
			const msg = e instanceof CvaParseError ? e.message : "parse error";
			return c.json({ error: msg }, 422);
		}
	})
	.put("/:name", zValidator("json", cvaModelSchema), async (c) => {
		const path = filePath(c.req.param("name"));
		await writeFile(path, serializeCva(c.req.valid("json")), "utf8");
		await formatFile(path);
		return c.json({ ok: true });
	})
	.post("/:name", zValidator("json", cvaModelSchema), async (c) => {
		const path = filePath(c.req.param("name"));
		if (await exists(path)) return c.json({ error: "already exists" }, 409);
		await writeFile(path, serializeCva(c.req.valid("json")), "utf8");
		await formatFile(path);
		return c.json({ ok: true }, 201);
	})
	.delete("/:name", async (c) => {
		const path = filePath(c.req.param("name"));
		await unlink(path).catch(() => {});
		return c.json({ ok: true });
	});

export default cva;
