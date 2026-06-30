import type { CvaModel } from "../../server/lib/cva-codec";

// What the inspector is currently editing: the shared base classes, or one option of one axis.
export type Target = { kind: "base" } | { kind: "option"; axis: string; option: string };

export function targetClass(model: CvaModel, target: Target): string {
	if (target.kind === "base") return model.base;
	return model.variants[target.axis]?.[target.option] ?? "";
}

export function setTargetClass(model: CvaModel, target: Target, value: string): CvaModel {
	if (target.kind === "base") return { ...model, base: value };
	const axis = model.variants[target.axis] ?? {};
	return {
		...model,
		variants: { ...model.variants, [target.axis]: { ...axis, [target.option]: value } },
	};
}

export function targetLabel(target: Target): string {
	return target.kind === "base" ? "Base" : `${target.axis}: ${target.option}`;
}

export function sameTarget(a: Target, b: Target): boolean {
	if (a.kind !== b.kind) return false;
	if (a.kind === "base" || b.kind === "base") return true;
	return a.axis === b.axis && a.option === b.option;
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
