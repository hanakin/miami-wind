import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

// Expose mode: point at a raw, un-tagged node in the preview (an icon, indicator) and promote it to a
// real data-slot so the editor can address it. A session toggle — no persistence, no notes. The overlay
// (expose-overlay) does the pixel → source work; this just gates it on/off.
interface ExposeState {
	on: boolean;
	toggle: () => void;
}

export const exposeStore = createStore<ExposeState>((set) => ({
	on: false,
	toggle: () => set((s) => ({ on: !s.on })),
}));

export function useExpose<T>(selector: (s: ExposeState) => T): T {
	return useStore(exposeStore, selector);
}
