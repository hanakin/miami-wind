import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	dirtySlots,
	isDirty,
	parseSurface,
	surfaceKey,
	useWorkbench,
	workbenchStore,
} from "~/stores/workbench";
import { client } from "~/utils/api";
import type { CvaModel } from "../../server/lib/cva-codec";

/** Registry custom primitives + the cva files that currently exist. */
export function usePrimitives() {
	return useQuery({
		queryKey: ["primitives"],
		queryFn: async () => client.api.primitives.$get().then((r) => r.json()),
	});
}

/** Load the registry cva overrides into the store once on mount. */
export function useInitOverrides() {
	const query = useQuery({
		queryKey: ["cva"],
		queryFn: async () => client.api.cva.$get().then((r) => r.json()),
	});
	const models = query.data?.models as CvaModel[] | undefined;
	useEffect(() => {
		if (models) workbenchStore.getState().loadOverrides(models);
	}, [models]);
	return query;
}

/** The source of a custom primitive (registry/components/ui/<name>.tsx), for read-only display. */
export function useComponentSource(name: string) {
	return useQuery({
		queryKey: ["source", name],
		queryFn: async (): Promise<{ source: string } | { error: string }> => {
			const r = await client.api.primitives.source[":name"].$get({ param: { name } });
			return r.json();
		},
	});
}

/** Full Tailwind class list for the inspector's IntelliSense. */
export function useTailwindClasses() {
	return useQuery({
		queryKey: ["tailwind-classes"],
		queryFn: async () => client.api.tailwind.classes.$get().then((r) => r.json()),
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useHasCva(name: string): boolean {
	return useWorkbench((s) => {
		for (const m of Object.values(s.models)) if (m.name === name) return true;
		return false;
	});
}

export function useDirtyByName(name: string): boolean {
	return useWorkbench((s) => {
		for (const m of Object.values(s.models)) if (m.name === name) return isDirty(s, m.exportName);
		return false;
	});
}

export function useDirtyCount(): number {
	return useWorkbench((s) =>
		Object.values(s.models).reduce((n, m) => n + (isDirty(s, m.exportName) ? 1 : 0), 0),
	);
}

/** The working cva model for a component (by file name), or undefined if it has no cva. */
export function useComponentModel(name: string): CvaModel | undefined {
	return useWorkbench((s) => Object.values(s.models).find((m) => m.name === name));
}

/**
 * Guarantee a model exists for a component. cva primitives register their seed via the live-cva
 * plugin; non-cva and custom primitives get an empty one here, so every component gets the same
 * full editor (variants + inspector) and live override — not just the ones shadcn ships a cva for.
 */
export function useEnsureModel(name: string): void {
	const missing = useWorkbench((s) => !Object.values(s.models).some((m) => m.name === name));
	useEffect(() => {
		if (missing) {
			workbenchStore.getState().registerSeed(name, {
				name,
				localName: name,
				exportName: name,
				base: "",
				variants: {},
				defaultVariants: {},
				compoundVariants: [],
			});
		}
	}, [missing, name]);
}

/** Save a model to its registry cva file (PUT creates or overwrites), then rebaseline. */
export function useSaveCva() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (model: CvaModel) => {
			const res = await client.api.cva[":name"].$put({ param: { name: model.name }, json: model });
			if (!res.ok) throw new Error(`Save failed (${res.status})`);
			return res.json();
		},
		onSuccess: (_data, model) => {
			workbenchStore.getState().markSaved(model.exportName);
			qc.invalidateQueries({ queryKey: ["primitives"] });
			qc.invalidateQueries({ queryKey: ["tailwind-classes"] });
		},
	});
}

/** Save every dirty cva at once (toolbar "Save all"). */
export function useSaveAll() {
	const save = useSaveCva();
	// Count is a stable number selector; the dirty set is computed on click via getState, never
	// returned from a selector — a fresh array each render makes the store snapshot unstable and
	// loops ("Maximum update depth exceeded").
	const count = useDirtyCount();
	return {
		saveAll: () => {
			const s = workbenchStore.getState();
			for (const m of Object.values(s.models)) {
				if (isDirty(s, m.exportName)) save.mutate(m);
			}
		},
		isPending: save.isPending,
		count,
	};
}

/** Delete the registry override file, reverting the component to its vanilla seed. */
export function useDeleteCva() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (model: CvaModel) => {
			const res = await client.api.cva[":name"].$delete({ param: { name: model.name } });
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			return res.json();
		},
		onSuccess: (_data, model) => {
			workbenchStore.getState().revertToSeed(model.exportName);
			qc.invalidateQueries({ queryKey: ["primitives"] });
		},
	});
}

// Controls a label operates: their demo pairs the control with a <Label htmlFor> that toggles it, so
// the label's affordance (cursor:pointer) is part of editing the control. The label is a separate
// primitive, so its edits save to the Label component (data-slot="label") — the editor just surfaces
// it here as a linked target (E8/AFFORD).
export const LABEL_CONTROLS = new Set(["checkbox", "switch", "radio-group"]);

/** Load one component's current per-slot classes (vanilla or promoted custom) into the store. */
export function useComponentSlots(name: string) {
	const query = useQuery({
		queryKey: ["components", name],
		queryFn: async (): Promise<
			| { slots: Record<string, string>; surfaces: Record<string, string>; custom: boolean }
			| { error: string }
		> => {
			const r = await client.api.components[":name"].$get({ param: { name } });
			return r.json();
		},
	});
	const data = query.data && "slots" in query.data ? query.data : undefined;
	useEffect(() => {
		if (!data) return;
		// classNames surfaces load into the same store under a namespaced key (surface:<owner>:<key>).
		const surfaces = Object.fromEntries(
			Object.entries(data.surfaces).map(([k, v]) => [surfaceKey(name, k), v]),
		);
		workbenchStore.getState().loadSlots(name, { ...data.slots, ...surfaces });
	}, [data, name]);
	return query;
}

export function useSlotDirtyCount(): number {
	return useWorkbench((s) => dirtySlots(s).length);
}

/**
 * Save every dirty slot, grouped by component. A PUT promotes the vanilla primitive to a custom (full
 * source vendored into the registry) and bakes the slot classes in — so what shipped is what you see.
 */
export function useSaveSlots() {
	const qc = useQueryClient();
	const count = useSlotDirtyCount();
	const saveSlots = async () => {
		const s = workbenchStore.getState();
		// Group by owning component, splitting data-slot edits (writeSlots) from classNames-surface edits
		// (writeClassNames) — the server applies each to the right place in the source.
		const byComp = new Map<
			string,
			{ slots: Record<string, string>; surfaces: Record<string, string> }
		>();
		for (const id of dirtySlots(s)) {
			const comp = s.slotOwner[id];
			if (!comp) continue;
			const bucket = byComp.get(comp) ?? { slots: {}, surfaces: {} };
			const surf = parseSurface(id);
			if (surf) bucket.surfaces[surf.key] = s.slots[id] ?? "";
			else bucket.slots[id] = s.slots[id] ?? "";
			byComp.set(comp, bucket);
		}
		for (const [comp, { slots, surfaces }] of byComp) {
			await client.api.components[":name"].$put({
				param: { name: comp },
				json: {
					...(Object.keys(slots).length ? { slots } : {}),
					...(Object.keys(surfaces).length ? { surfaces } : {}),
				},
			});
		}
		workbenchStore.getState().markSlotsSaved();
		qc.invalidateQueries({ queryKey: ["components"] });
		qc.invalidateQueries({ queryKey: ["primitives"] });
	};
	return { saveSlots, count };
}
