import { resolve } from "node:path";
import { WORKBENCH_ROOT } from "./registry-paths";

const BIOME = resolve(WORKBENCH_ROOT, "node_modules/.bin/biome");

/**
 * Best-effort Biome format of a written file. The file lives in the registry repo,
 * so Biome resolves that repo's config. Non-fatal: the serializer already emits
 * house-style output, this just normalizes it to whatever the registry config says.
 */
export async function formatFile(path: string): Promise<void> {
	const proc = Bun.spawn([BIOME, "format", "--write", path], {
		stdout: "ignore",
		stderr: "ignore",
	});
	await proc.exited;
}
