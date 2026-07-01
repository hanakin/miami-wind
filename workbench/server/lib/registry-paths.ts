import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env";

// server/lib → workbench root → registry repo root (REGISTRY_DIR, default "..").
const here = dirname(fileURLToPath(import.meta.url));
export const WORKBENCH_ROOT = resolve(here, "..", "..");
export const REGISTRY_ROOT = resolve(WORKBENCH_ROOT, env.REGISTRY_DIR);

export const REGISTRY_JSON = resolve(REGISTRY_ROOT, "registry.json");
export const UI_DIR = resolve(REGISTRY_ROOT, "registry/components/ui");
export const CVA_DIR = resolve(UI_DIR, "cva");

// The workbench's vendored vanilla shadcn primitives — the base a component is promoted from.
export const VENDORED_UI = resolve(WORKBENCH_ROOT, "src/components/ui");

// The workbench's own compiled stylesheet — source of truth for the Tailwind design system.
export const GLOBALS_CSS = resolve(WORKBENCH_ROOT, "src/styles/globals.css");

const SAFE_NAME = /^[a-z0-9][a-z0-9-]*$/;

/** Guard against path traversal in user-supplied component names. */
export function safeName(name: string): string {
	if (!SAFE_NAME.test(name)) throw new Error(`Invalid name: ${name}`);
	return name;
}
