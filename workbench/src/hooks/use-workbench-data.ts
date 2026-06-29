import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { isDirty, useWorkbench, workbenchStore } from "~/stores/workbench";
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
