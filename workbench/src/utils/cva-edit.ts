import type { CvaModel } from "../../server/lib/cva-codec";

// What the inspector is currently editing: the shared base classes, one option of one axis, or a
// pass-through context — the `[a]:` classes that only apply when the item is an <a>, or the `[&_svg]:` /
// `[&_img]:` classes that size a descendant. The inspector scopes a context through its exact source
// `prefix` (`[a]:`, `[&_svg:not([class*='size-'])]:`). `context` is a short display/example key. A
// context usually lives in the base, but a size context can live in a variant option (the icon media
// variant) — `axis`/`option` say where so it reads/writes that option instead of base. `symbol` names
// the owning cva (its export name) — a component can have several (item has itemVariants and
// itemMediaVariants), so the target must say which one it edits.
export type Target =
	| { kind: "base"; symbol?: string }
	| { kind: "option"; axis: string; option: string; symbol?: string }
	| {
			kind: "context";
			context: string;
			prefix: string;
			symbol?: string;
			axis?: string;
			option?: string;
	  };

// A context can point at a variant option (a size context living in the icon media variant); else it,
// like base, edits the base string.
function optionOf(target: Target): { axis: string; option: string } | null {
	if (target.kind === "option") return { axis: target.axis, option: target.option };
	if (target.kind === "context" && target.axis && target.option)
		return { axis: target.axis, option: target.option };
	return null;
}

export function targetClass(model: CvaModel, target: Target): string {
	const opt = optionOf(target);
	if (opt) return model.variants[opt.axis]?.[opt.option] ?? "";
	return model.base; // base and base-level contexts both live in the base string
}

export function setTargetClass(model: CvaModel, target: Target, value: string): CvaModel {
	const opt = optionOf(target);
	if (opt) {
		const axis = model.variants[opt.axis] ?? {};
		return {
			...model,
			variants: { ...model.variants, [opt.axis]: { ...axis, [opt.option]: value } },
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
	if (a.kind !== b.kind || a.symbol !== b.symbol) return false;
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
