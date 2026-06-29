import { z } from "zod";

const schema = z.object({
	// Path to the registry repo root (where registry.json + registry/ live), relative to workbench/.
	REGISTRY_DIR: z.string().default(".."),
	PORT: z.coerce.number().default(3000),
});

export const env = schema.parse(process.env);
