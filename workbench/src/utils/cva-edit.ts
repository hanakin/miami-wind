import type { CvaModel } from "../../server/lib/cva-codec";

// What the inspector is currently editing: the shared base classes, one option of one axis, or a
// pass-through context (e.g. `a` — the `[a]:` classes that only apply when the item is an <a>). A
// context target edits the base string too, but the inspector scopes it through the `[<context>]:` lens.
export type Target =
	| { kind: "base" }
	| { kind: "option"; axis: string; option: string }
	| { kind: "context"; context: string };

export function targetClass(model: CvaModel, target: Target): string {
	if (target.kind === "option") return model.variants[target.axis]?.[target.option] ?? "";
	return model.base; // base and context both live in the base string
}

export function setTargetClass(model: CvaModel, target: Target, value: string): CvaModel {
	if (target.kind === "option") {
		const axis = model.variants[target.axis] ?? {};
		return {
			...model,
			variants: { ...model.variants, [target.axis]: { ...axis, [target.option]: value } },
		};
	}
	return { ...model, base: value };
}

export function targetLabel(target: Target): string {
	if (target.kind === "base") return "Base";
	if (target.kind === "context") return `[${target.context}]`;
	return `${target.axis}: ${target.option}`;
}

export function sameTarget(a: Target, b: Target): boolean {
	if (a.kind !== b.kind) return false;
	if (a.kind === "option" && b.kind === "option") return a.axis === b.axis && a.option === b.option;
	if (a.kind === "context" && b.kind === "context") return a.context === b.context;
	return true; // base === base
}

// --- Structural edits: add/remove variant axes and options -------------------

export function addAxis(model: CvaModel, axis: string): CvaModel {
	if (!axis || model.variants[axis]) return model;
	return { ...model, variants: { ...model.variants, [axis]: { default: "" } } };
}

export function removeAxis(model: CvaModel, axis: string): CvaModel {
	const variants = { ...model.variants };
	delete variants[axis];
	const defaultVariants = { ...model.defaultVariants };
	delete defaultVariants[axis];
	return { ...model, variants, defaultVariants };
}

export function addOption(model: CvaModel, axis: string, option: string): CvaModel {
	const current = model.variants[axis] ?? {};
	if (!option || current[option] !== undefined) return model;
	return { ...model, variants: { ...model.variants, [axis]: { ...current, [option]: "" } } };
}

export function removeOption(model: CvaModel, axis: string, option: string): CvaModel {
	const current = { ...(model.variants[axis] ?? {}) };
	delete current[option];
	const defaultVariants = { ...model.defaultVariants };
	if (defaultVariants[axis] === option) delete defaultVariants[axis];
	return { ...model, variants: { ...model.variants, [axis]: current }, defaultVariants };
}
