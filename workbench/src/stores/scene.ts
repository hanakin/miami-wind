import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

// The active preview scene. Lifted out of PreviewCanvas so the navbar owns the tab selector (next to
// the scope dropdown) while the pane owns the scene content.
export const SCENES = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "cards", label: "Cards" },
	{ key: "mail", label: "Mail" },
	{ key: "marketing", label: "Marketing" },
	{ key: "forms", label: "Forms" },
	{ key: "surfaces", label: "Surfaces" },
] as const;

export type SceneKey = (typeof SCENES)[number]["key"];

interface SceneState {
	scene: SceneKey;
	setScene: (scene: SceneKey) => void;
}

export const sceneStore = createStore<SceneState>((set) => ({
	scene: "dashboard",
	setScene: (scene) => set({ scene }),
}));

export function useScene<T>(selector: (s: SceneState) => T): T {
	return useStore(sceneStore, selector);
}
