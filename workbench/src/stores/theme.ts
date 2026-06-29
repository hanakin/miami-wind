import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { ThemeToken } from "../../server/lib/theme-codec";

// Theme draft: working tokens + the last-saved baseline. Edits apply live to the document root
// (see __root), so the whole workbench recolors while you tweak; Save persists to registry.json.
interface ThemeState {
	tokens: ThemeToken[];
	saved: ThemeToken[];
	loadSaved: (tokens: ThemeToken[]) => void;
	setValue: (name: string, value: string) => void;
	addToken: (token: ThemeToken) => void;
	removeToken: (name: string) => void;
	revert: () => void;
	markSaved: () => void;
}

export const themeStore = createStore<ThemeState>((set) => ({
	tokens: [],
	saved: [],
	loadSaved: (tokens) => set((s) => (s.saved.length ? s : { tokens, saved: tokens })),
	setValue: (name, value) =>
		set((s) => ({ tokens: s.tokens.map((t) => (t.name === name ? { ...t, value } : t)) })),
	addToken: (token) =>
		set((s) =>
			s.tokens.some((t) => t.name === token.name) ? s : { tokens: [...s.tokens, token] },
		),
	removeToken: (name) => set((s) => ({ tokens: s.tokens.filter((t) => t.name !== name) })),
	revert: () => set((s) => ({ tokens: s.saved })),
	markSaved: () => set((s) => ({ saved: s.tokens })),
}));

export function useTheme<T>(selector: (s: ThemeState) => T): T {
	return useStore(themeStore, selector);
}

export function themeDirty(s: ThemeState): boolean {
	if (s.tokens.length !== s.saved.length) return true;
	const saved = new Map(s.saved.map((t) => [t.name, t.value]));
	return s.tokens.some((t) => saved.get(t.name) !== t.value);
}
