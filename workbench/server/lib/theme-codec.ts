import { z } from "zod";
import { type CssValue, parseCss, serializeCss } from "./css-codec";

/**
 * theme-codec — read/write the Miami Wind theme tokens stored in registry.json
 * (the item named "theme", under cssVars.theme + cssVars.dark). Pure functions;
 * the route owns file I/O so the rest of registry.json is preserved untouched.
 */

export const themeTokenSchema = z.object({
	name: z.string(),
	value: z.string(),
	layer: z.enum(["theme", "dark"]),
});

export const themeModelSchema = z.object({
	tokens: z.array(themeTokenSchema),
	// Cross-cutting CSS shipped on the theme item's `css` field, as raw text for the editor.
	customCss: z.string().default(""),
});

export type ThemeToken = z.infer<typeof themeTokenSchema>;
export type ThemeModel = z.infer<typeof themeModelSchema>;

type CssVars = { theme?: Record<string, string>; dark?: Record<string, string> };
interface RegistryItem {
	name: string;
	cssVars?: CssVars;
	css?: Record<string, CssValue>;
	[k: string]: unknown;
}
export interface RegistryJson {
	items: RegistryItem[];
	[k: string]: unknown;
}

export function parseTheme(registry: RegistryJson): ThemeModel {
	const item = registry.items.find((i) => i.name === "theme");
	if (!item?.cssVars) throw new Error("registry.json has no `theme` item with cssVars");
	const tokens: ThemeToken[] = [];
	for (const [name, value] of Object.entries(item.cssVars.theme ?? {})) {
		tokens.push({ name, value, layer: "theme" });
	}
	for (const [name, value] of Object.entries(item.cssVars.dark ?? {})) {
		tokens.push({ name, value, layer: "dark" });
	}
	return { tokens, customCss: serializeCss(item.css ?? {}) };
}

export function applyTheme(registry: RegistryJson, model: ThemeModel): RegistryJson {
	const next = structuredClone(registry);
	const item = next.items.find((i) => i.name === "theme");
	if (!item) throw new Error("registry.json has no `theme` item");
	const theme: Record<string, string> = {};
	const dark: Record<string, string> = {};
	for (const t of model.tokens) {
		(t.layer === "theme" ? theme : dark)[t.name] = t.value;
	}
	item.cssVars = { theme, dark };
	const css = parseCss(model.customCss ?? "");
	if (Object.keys(css).length > 0) item.css = css;
	else delete item.css;
	return next;
}
