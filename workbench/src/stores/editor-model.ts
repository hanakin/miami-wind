import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { ComponentModel } from "../../server/lib/component-model";

/**
 * The editor-model store — the pre-baked spine (editor rebuild, Stage 2).
 *
 * On launch `GET /api/models` runs the categorization + interaction reader over EVERY component; the
 * result loads here as `baseline` (the on-disk truth) plus a deep-cloned `working` copy the editor
 * mutates. Controls read the pre-baked value for whatever's selected — no per-click source search — and
 * write into `working`; the demo overlay paints the `working`-vs-`baseline` diff; Save persists working
 * and re-scan resets baseline.
 *
 * Editing here is on the raw per-piece×state class string (`setStateClasses`). The property-level
 * `setSetting(name, piece, interaction, property, value)` the plan names lands with the control set in
 * Stage 5 — it's a thin wrapper over this that turns a control edit into a class edit via tw-tokens.
 */
export interface EditorModelState {
	baseline: Record<string, ComponentModel>;
	working: Record<string, ComponentModel>;
	loadModels: (models: ComponentModel[]) => void;
	/** Overwrite one piece × interaction's class string in the working copy (the primitive edit). */
	setStateClasses: (name: string, piece: string, interaction: string, classes: string) => void;
}

export const editorModelStore = createStore<EditorModelState>((set) => ({
	baseline: {},
	working: {},
	loadModels: (models) =>
		set(() => {
			const baseline: Record<string, ComponentModel> = {};
			const working: Record<string, ComponentModel> = {};
			for (const m of models) {
				baseline[m.name] = m;
				working[m.name] = structuredClone(m);
			}
			return { baseline, working };
		}),
	setStateClasses: (name, piece, interaction, classes) =>
		set((s) => {
			const model = s.working[name];
			if (!model) return s;
			const next = structuredClone(model);
			const states = next.classesByPieceState[piece] ?? {};
			states[interaction] = classes;
			next.classesByPieceState[piece] = states;
			return { working: { ...s.working, [name]: next } };
		}),
}));

export function useEditorModel<T>(selector: (s: EditorModelState) => T): T {
	return useStore(editorModelStore, selector);
}

export const baselineModel = (name: string): ComponentModel | undefined =>
	editorModelStore.getState().baseline[name];

export const workingModel = (name: string): ComponentModel | undefined =>
	editorModelStore.getState().working[name];

/** The piece × interaction pairs whose working classes differ from baseline (what Save would write). */
export function dirtyDiff(name: string): { piece: string; interaction: string }[] {
	const s = editorModelStore.getState();
	const base = s.baseline[name];
	const work = s.working[name];
	if (!base || !work) return [];
	const out: { piece: string; interaction: string }[] = [];
	for (const [piece, states] of Object.entries(work.classesByPieceState)) {
		for (const [interaction, classes] of Object.entries(states)) {
			if (base.classesByPieceState[piece]?.[interaction] !== classes)
				out.push({ piece, interaction });
		}
	}
	return out;
}
