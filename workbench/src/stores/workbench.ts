import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { CvaModel } from "../../server/lib/cva-codec";

/**
 * The workbench store holds three views of every cva, keyed by export symbol:
 *   seeds  — the vanilla shadcn default (registered by the live-cva plugin at load)
 *   saved  — the last-saved baseline (the registry override if one exists, else the seed)
 *   models — the working copy that previews render from
 *
 * Live preview always reads `models`. Nothing is written to disk until Save, which
 * advances `saved`. `isDirty` compares working against the baseline.
 */
export interface WorkbenchState {
	seeds: Record<string, CvaModel>;
	saved: Record<string, CvaModel>;
	models: Record<string, CvaModel>;
	// Per-slot classes for non-cva components: working + last-saved, keyed by data-slot. slotOwner maps
	// each slot back to the component it was loaded from (so Save groups slots onto the right file).
	slots: Record<string, string>;
	savedSlots: Record<string, string>;
	slotOwner: Record<string, string>;
	registerSeed: (key: string, model: CvaModel) => void;
	loadOverrides: (models: CvaModel[]) => void;
	setModel: (key: string, model: CvaModel) => void;
	revert: (key: string) => void;
	revertToSeed: (key: string) => void;
	markSaved: (key: string) => void;
	setSlot: (slot: string, classes: string) => void;
	loadSlots: (owner: string, map: Record<string, string>) => void;
	revertSlots: () => void;
	markSlotsSaved: () => void;
}

export const workbenchStore = createStore<WorkbenchState>((set) => ({
	seeds: {},
	saved: {},
	models: {},
	slots: {},
	savedSlots: {},
	slotOwner: {},

	registerSeed: (key, model) =>
		set((s) => {
			if (s.seeds[key]) return s; // idempotent: never clobber an edited working copy
			return {
				seeds: { ...s.seeds, [key]: model },
				saved: s.saved[key] ? s.saved : { ...s.saved, [key]: model },
				models: s.models[key] ? s.models : { ...s.models, [key]: model },
			};
		}),

	loadOverrides: (models) =>
		set((s) => {
			const saved = { ...s.saved };
			const working = { ...s.models };
			for (const m of models) {
				saved[m.exportName] = m;
				working[m.exportName] = m;
			}
			return { saved, models: working };
		}),

	setModel: (key, model) => set((s) => ({ models: { ...s.models, [key]: model } })),

	revert: (key) =>
		set((s) => {
			const baseline = s.saved[key] ?? s.seeds[key];
			return baseline ? { models: { ...s.models, [key]: baseline } } : s;
		}),

	// After deleting a registry override: drop back to the vanilla seed for both working + saved.
	revertToSeed: (key) =>
		set((s) => {
			const seed = s.seeds[key];
			return seed
				? { saved: { ...s.saved, [key]: seed }, models: { ...s.models, [key]: seed } }
				: s;
		}),

	markSaved: (key) =>
		set((s) => {
			const model = s.models[key];
			return model ? { saved: { ...s.saved, [key]: model } } : s;
		}),

	setSlot: (slot, classes) => set((s) => ({ slots: { ...s.slots, [slot]: classes } })),
	loadSlots: (owner, map) =>
		set((s) => {
			const slotOwner = { ...s.slotOwner };
			for (const k of Object.keys(map)) slotOwner[k] = owner;
			return {
				slots: { ...s.slots, ...map },
				savedSlots: { ...s.savedSlots, ...map },
				slotOwner,
			};
		}),
	revertSlots: () => set((s) => ({ slots: { ...s.savedSlots } })),
	markSlotsSaved: () => set((s) => ({ savedSlots: { ...s.slots } })),
}));

// A classNames surface (a cn() inside a `classNames={{…}}` object, e.g. calendar's day/weekday) rides
// the same slot machinery — working/saved/owner/dirty — under a namespaced key so it never collides
// with a data-slot. Only its preview selector (.rdp-<key>) and write path (writeClassNames) differ,
// branched at those two seams. `owner` keeps a short key like `day` unique across components.
export const SURFACE = "surface:";
export const surfaceKey = (owner: string, key: string): string => `${SURFACE}${owner}:${key}`;
export function parseSurface(id: string): { owner: string; key: string } | null {
	if (!id.startsWith(SURFACE)) return null;
	const rest = id.slice(SURFACE.length);
	const i = rest.indexOf(":");
	return i < 0 ? null : { owner: rest.slice(0, i), key: rest.slice(i + 1) };
}

/** Surfaces whose working classes differ from the last-saved baseline. */
export function dirtySlots(state: WorkbenchState): string[] {
	const keys = new Set([...Object.keys(state.slots), ...Object.keys(state.savedSlots)]);
	return [...keys].filter((k) => (state.slots[k] ?? "") !== (state.savedSlots[k] ?? ""));
}

export function useWorkbench<T>(selector: (s: WorkbenchState) => T): T {
	return useStore(workbenchStore, selector);
}

export function baseline(state: WorkbenchState, key: string): CvaModel | undefined {
	return state.saved[key] ?? state.seeds[key];
}

export function isDirty(state: WorkbenchState, key: string): boolean {
	const working = state.models[key];
	const base = baseline(state, key);
	if (!working || !base) return false;
	return !deepEqual(working, base);
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const oa = a as Record<string, unknown>;
	const ob = b as Record<string, unknown>;
	const keys = Object.keys(oa);
	if (keys.length !== Object.keys(ob).length) return false;
	return keys.every((k) => deepEqual(oa[k], ob[k]));
}
