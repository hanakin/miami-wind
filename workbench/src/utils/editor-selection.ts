import type { CvaModel } from "../../server/lib/cva-codec";
import type { Target } from "./cva-edit";

// What the editor is both editing AND previewing: a cva target (shared base / one variant option),
// or a component surface (a data-slot, e.g. dropdown-menu-item). Shared by the left controls and the
// right preview so selecting a variant filters the view and selecting a slot scopes editing.
export type Selection = { type: "cva"; target: Target } | { type: "slot"; slot: string };

// Start editing where the colors live — the default variant — not the (usually colorless) base, so
// the controls reflect the component you see and "none" clears a real color.
export function firstVariantTarget(model: CvaModel | undefined): Target {
	if (!model) return { kind: "base" };
	for (const [axis, opt] of Object.entries(model.defaultVariants)) {
		if (typeof opt === "string") return { kind: "option", axis, option: opt };
	}
	const [axis, opts] = Object.entries(model.variants)[0] ?? [];
	const opt = opts && Object.keys(opts)[0];
	return axis && opt ? { kind: "option", axis, option: opt } : { kind: "base" };
}

export function initialSelection(model: CvaModel | undefined): Selection {
	return { type: "cva", target: firstVariantTarget(model) };
}

/** The variant props the preview renders with — filters the view to the selected option, else defaults. */
export function selectionVariantProps(sel: Selection): Record<string, string> {
	return sel.type === "cva" && sel.target.kind === "option"
		? { [sel.target.axis]: sel.target.option }
		: {};
}

/**
 * The class string the component effectively renders with for the given variant props: base ⊕ the
 * chosen option per axis (defaults where unset). The baseline for forced-state (hover/focus/…)
 * previews, so a forced state reflects the variant currently in view.
 */
export function effectiveClasses(model: CvaModel, variantProps: Record<string, string>): string {
	const parts = [model.base];
	const axes = new Set([...Object.keys(model.defaultVariants), ...Object.keys(variantProps)]);
	for (const axis of axes) {
		const opt = variantProps[axis] ?? model.defaultVariants[axis];
		if (typeof opt === "string") parts.push(model.variants[axis]?.[opt] ?? "");
	}
	return parts.filter(Boolean).join(" ");
}
