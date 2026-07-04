import * as ts from "typescript";
import { readSlots } from "./tsx-slots";

/**
 * component-model — the categorization half of the editor pre-bake (Stage 1 of the editor rebuild).
 *
 * Turns a component's real source into the Editing-menu's 5 categories, derived (never hand-mapped),
 * so the pre-bake can run it over every component. Pure + architecture-agnostic (source string in,
 * model out) — the server route / client loader that scans all components wires around it later.
 *
 * Categories (see the `editing-menu-structure` memory for the locked rules):
 *   Root · Trigger · Layout/Structure · Parts · Variants · Flags
 * The interaction derivation + per-setting value extraction are the NEXT slices, not this one.
 */

export interface Variant {
	/** the option a user picks, e.g. "outline", "destructive", "sm" */
	name: string;
	/** which part/cva it belongs to, e.g. "item", "item-media" */
	namespace: string;
	/** the axis it lives on, e.g. "variant", "size" */
	axis: string;
}

export interface Flag {
	name: string;
	namespace: string;
}

export interface ComponentModel {
	name: string;
	/** the primary visible element's slot (the `*-content` for a triggered pair, else the root) */
	root: string | null;
	/** the top-level opener slot, when one exists */
	trigger: string | null;
	/** containers/dividers that wrap or sit between siblings */
	structure: string[];
	/** elements inside the root that carry their own classes */
	parts: string[];
	variants: Variant[];
	flags: Flag[];
}

// --- cva discovery (multi-cva; parseCva only returns the last one) -----------------------------------

interface CvaInfo {
	/** the cva's slot namespace, e.g. itemMediaVariants → "item-media" */
	slot: string;
	/** the cva's base class string (where contexts like `[a]:` live) */
	base: string;
	/** axis → the option keys (minus `default`, which folds into Root) */
	axes: Record<string, string[]>;
}

/** `itemMediaVariants` → `item-media` (drop `Variants`, kebab-case). */
function slotForCva(exportName: string): string {
	return exportName
		.replace(/Variants$/, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase();
}

/** Every `const <x>Variants = cva(...)` in the file, with its variant axes → option keys. */
function findCvas(source: string): CvaInfo[] {
	const sf = ts.createSourceFile("c.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const out: CvaInfo[] = [];
	const visit = (node: ts.Node) => {
		if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
			const init = node.initializer;
			if (
				ts.isCallExpression(init) &&
				ts.isIdentifier(init.expression) &&
				init.expression.text === "cva"
			) {
				const axes: Record<string, string[]> = {};
				const config = init.arguments[1];
				if (config && ts.isObjectLiteralExpression(config)) {
					const variantsProp = config.properties.find(
						(p) =>
							ts.isPropertyAssignment(p) && p.name.getText().replace(/['"]/g, "") === "variants",
					);
					if (
						variantsProp &&
						ts.isPropertyAssignment(variantsProp) &&
						ts.isObjectLiteralExpression(variantsProp.initializer)
					) {
						for (const axisProp of variantsProp.initializer.properties) {
							if (
								!ts.isPropertyAssignment(axisProp) ||
								!ts.isObjectLiteralExpression(axisProp.initializer)
							)
								continue;
							const axis = axisProp.name.getText().replace(/['"]/g, "");
							axes[axis] = axisProp.initializer.properties
								.filter((o): o is ts.PropertyAssignment => ts.isPropertyAssignment(o))
								.map((o) => o.name.getText().replace(/['"]/g, ""))
								.filter((k) => k !== "default"); // default = the Root look
						}
					}
				}
				const baseArg = init.arguments[0];
				const base = baseArg && ts.isStringLiteral(baseArg) ? baseArg.text : "";
				out.push({ slot: slotForCva(node.name.text), base, axes });
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return out;
}

// --- categorization ---------------------------------------------------------------------------------

const strip = (name: string, slot: string) =>
	slot.startsWith(`${name}-`) ? slot.slice(name.length + 1) : slot;

/** A slot is a no-DOM provider if it carries no classes, is not cva-styled, and reads as a Radix
 *  wrapper (root/portal/sub). The cva check is what keeps item's cva-styled root (empty literal
 *  className) from being mistaken for dropdown-menu's true Root provider. */
function isProvider(name: string, slot: string, classes: string, hasCva: boolean): boolean {
	if (classes.trim() !== "" || hasCva) return false;
	const tail = strip(name, slot);
	return slot === name || tail === "portal" || tail === "sub";
}

/** Structure = wraps or sits between siblings. Matched by role suffix. */
function isStructure(name: string, slot: string): boolean {
	const tail = strip(name, slot);
	return (
		/(^|-)(group|list|separator|radio-group)$/.test(tail) ||
		tail === "group" ||
		tail === "separator"
	);
}

export function readComponentModel(source: string, name: string): ComponentModel {
	const slots = readSlots(source); // { slot: classes }
	const cvas = findCvas(source);
	const cvaSlots = new Set(cvas.map((c) => c.slot));

	// DOM pieces only.
	const pieces = Object.entries(slots).filter(
		([slot, cls]) => !isProvider(name, slot, cls, cvaSlots.has(slot)),
	);
	const slotNames = pieces.map(([slot]) => slot);

	// Root: a `*-content` slot when the component has a top-level trigger (revealed pair), else the
	// name-matching slot, else the first piece.
	const trigger = slotNames.find((s) => strip(name, s) === "trigger") ?? null;
	const contentSlot = slotNames.find((s) => strip(name, s) === "content");
	const root =
		trigger && contentSlot ? contentSlot : slotNames.includes(name) ? name : (slotNames[0] ?? null);

	const structure = slotNames.filter((s) => s !== root && s !== trigger && isStructure(name, s));

	// Variants: cva options (namespaced by cva slot) + any `data-[variant=x]` baked into class strings.
	const variants: Variant[] = [];
	for (const cva of cvas) {
		for (const [axis, opts] of Object.entries(cva.axes)) {
			for (const opt of opts) variants.push({ name: opt, namespace: cva.slot, axis });
		}
	}
	const flags: Flag[] = [];
	for (const [slot, cls] of pieces) {
		for (const m of cls.matchAll(/data-\[variant=([a-z-]+)\]/g)) {
			const v = m[1];
			if (v && !variants.some((x) => x.name === v && x.namespace === slot))
				variants.push({ name: v, namespace: slot, axis: "variant" });
		}
		// Flags: boolean `data-[flag]` (no `=value`) baked into a class string (inset, …).
		for (const m of cls.matchAll(/data-\[([a-z-]+)\]:/g)) {
			const f = m[1];
			if (f && f !== "disabled" && !flags.some((x) => x.name === f && x.namespace === slot))
				flags.push({ name: f, namespace: slot });
		}
	}
	// asChild → an "as link" flag when the root carries an `[a]:` context — which for a cva component
	// lives in the cva BASE, not the slot's literal className.
	const linkSurface = [root ? (slots[root] ?? "") : "", ...cvas.map((c) => c.base)].join(" ");
	if (/\[a\]:/.test(linkSurface)) flags.push({ name: "as link", namespace: root ?? name });

	// Parts: DOM pieces that aren't Root/Trigger/Structure. (Own-classes is implicit — a class-less
	// element still has a cva or is editable; icon/image aren't slots at all, so they never land here.)
	const parts = slotNames.filter((s) => s !== root && s !== trigger && !structure.includes(s));

	return { name, root, trigger, structure, parts, variants, flags };
}
