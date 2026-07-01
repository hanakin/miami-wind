import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { isColorValue, setColorTokens, tokenUtil } from "~/utils/tw-tokens";
import type { ThemeToken } from "../../server/lib/theme-codec";

// Theme draft: working tokens + the last-saved baseline. Edits apply live to the document root
// (see __root), so the whole workbench recolors while you tweak; Save persists to registry.json.
interface ThemeState {
	tokens: ThemeToken[];
	saved: ThemeToken[];
	customCss: string;
	savedCss: string;
	loadSaved: (tokens: ThemeToken[], customCss: string) => void;
	setValue: (name: string, value: string) => void;
	setCustomCss: (css: string) => void;
	addToken: (token: ThemeToken) => void;
	removeToken: (name: string) => void;
	revert: () => void;
	markSaved: () => void;
}

export const themeStore = createStore<ThemeState>((set) => ({
	tokens: [],
	saved: [],
	customCss: "",
	savedCss: "",
	loadSaved: (tokens, customCss) =>
		set((s) => (s.saved.length ? s : { tokens, saved: tokens, customCss, savedCss: customCss })),
	setValue: (name, value) =>
		set((s) => ({ tokens: s.tokens.map((t) => (t.name === name ? { ...t, value } : t)) })),
	setCustomCss: (css) => set({ customCss: css }),
	addToken: (token) =>
		set((s) =>
			s.tokens.some((t) => t.name === token.name) ? s : { tokens: [...s.tokens, token] },
		),
	removeToken: (name) => set((s) => ({ tokens: s.tokens.filter((t) => t.name !== name) })),
	revert: () => set((s) => ({ tokens: s.saved, customCss: s.savedCss })),
	markSaved: () => set((s) => ({ saved: s.tokens, savedCss: s.customCss })),
}));

// Keep the class parser's recognized color tokens in lockstep with the live theme (fires on load
// and on every add/remove), so classes emitted from the picker round-trip for every CSS var.
themeStore.subscribe((s) =>
	setColorTokens(s.tokens.filter((t) => isColorValue(t.value)).map((t) => tokenUtil(t.name))),
);

export function useTheme<T>(selector: (s: ThemeState) => T): T {
	return useStore(themeStore, selector);
}

export function themeDirty(s: ThemeState): boolean {
	if (s.customCss !== s.savedCss) return true;
	if (s.tokens.length !== s.saved.length) return true;
	const saved = new Map(s.saved.map((t) => [t.name, t.value]));
	return s.tokens.some((t) => saved.get(t.name) !== t.value);
}
