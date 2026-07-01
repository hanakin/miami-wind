import type { RegistryJson } from "./theme-codec";

/**
 * ui-items — upsert/remove a custom-component item in registry.json.
 *
 * When a primitive is "owned" (its full source vendored into registry/components/ui/<name>.tsx), it
 * ships as a `registry:ui` item — the whole file, no cva/slots delta, no mw-cva. Pure functions; the
 * route does file I/O so the rest of registry.json is preserved. Also keeps the aggregate `registry`
 * item's registryDependencies in sync so the customized component installs with the full set.
 *
 * The custom item declares the npm packages the vendored source imports (radix, cmdk, vaul…) so it
 * installs standalone, and registryDependencies:["theme"] for the tokens it references.
 */

const AGGREGATE = "registry";

interface UiFile {
	path: string;
	type: "registry:ui";
	target: string;
}
interface RegistryItem {
	name: string;
	type?: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files?: UiFile[];
	[k: string]: unknown;
}

function humanize(name: string): string {
	return name
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

// Peers a consumer app already has — never worth listing as a dependency.
const IMPLICIT = new Set(["react", "react-dom"]);

/** The npm packages a source file imports (bare specifiers), for a custom item's `dependencies`. */
export function externalDeps(source: string): string[] {
	const out = new Set<string>();
	for (const m of source.matchAll(/\bfrom\s*["']([^"']+)["']/g)) {
		const spec = m[1];
		if (!spec || spec.startsWith(".") || spec.startsWith("~") || spec.startsWith("node:")) continue;
		// Package name: "@scope/pkg/sub" → "@scope/pkg"; "pkg/sub" → "pkg".
		const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
		if (pkg && !IMPLICIT.has(pkg)) out.add(pkg);
	}
	return [...out].sort();
}

function uiItem(name: string, deps: string[]): RegistryItem {
	const item: RegistryItem = {
		name,
		type: "registry:ui",
		title: humanize(name),
		description: `Miami Wind ${name} — customized primitive (full source).`,
		registryDependencies: ["theme"],
		files: [
			{
				path: `registry/components/ui/${name}.tsx`,
				type: "registry:ui",
				target: `~/components/ui/${name}.tsx`,
			},
		],
	};
	if (deps.length > 0) item.dependencies = deps;
	return item;
}

/** True once a custom-component item for `name` exists in the registry. */
export function hasUiItem(registry: RegistryJson, name: string): boolean {
	return registry.items.some((i) => i.name === name && (i as RegistryItem).type === "registry:ui");
}

/** Add or replace the custom-component item for `name` (deps from its source), and list it in the aggregate. */
export function upsertUiItem(
	registry: RegistryJson,
	name: string,
	deps: string[] = [],
): RegistryJson {
	const next = structuredClone(registry);
	const items = next.items as RegistryItem[];
	const idx = items.findIndex((i) => i.name === name);
	const item = uiItem(name, deps);
	if (idx >= 0) items[idx] = item;
	else items.push(item);

	const agg = items.find((i) => i.name === AGGREGATE);
	if (agg) {
		agg.registryDependencies ??= [];
		if (!agg.registryDependencies.includes(name)) agg.registryDependencies.push(name);
	}
	return next;
}

/** Remove the custom-component item for `name` (revert to vanilla) and drop it from the aggregate. */
export function removeUiItem(registry: RegistryJson, name: string): RegistryJson {
	const next = structuredClone(registry);
	let items = next.items as RegistryItem[];
	items = items.filter((i) => !(i.name === name && i.type === "registry:ui"));
	const agg = items.find((i) => i.name === AGGREGATE);
	if (agg?.registryDependencies) {
		agg.registryDependencies = agg.registryDependencies.filter((d) => d !== name);
	}
	next.items = items;
	return next;
}
