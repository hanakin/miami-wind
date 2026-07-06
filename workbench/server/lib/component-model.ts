import * as ts from "typescript";
// tw-tokens is pure prefix-parsing (no React/DOM) — reuse its class/state splitter so the reader and
// the client's controls agree on what a "state" is, instead of a second, drifting regex here.
import { parseClasses } from "../../src/utils/tw-tokens";
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

/** The root's render-element choice (base-ui `render` prop; radix's old asChild). Not a flag — it swaps
 *  the element the root renders as. `elements` are the alternates beyond the default (e.g. `["a"]` when
 *  the cva carries `[a]:` link styling). Selecting one edits that element's `[<tag>]:` pass-through. */
export interface Render {
	slot: string;
	elements: string[];
}

export interface Interaction {
	/** design word (shown to the user) — one of `default` (resting) · hover · focus · active · disabled.
	 *  Every underlying code-state is translated to one of these; `active` is the catch-all for any
	 *  engaged/on/open/selected/pressed state. */
	name: string;
	/** true = the piece really carries this state's classes (edit it); false = a core state offered to Add (create) */
	present: boolean;
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
	/** the root's render-element choice (div default + alternates like `a`), or null if it can't swap */
	render: Render | null;
	/** per DOM piece: its real interactions (present) + the core states it could add (present:false) */
	interactionsByPiece: Record<string, Interaction[]>;
	/** per piece × interaction: the raw class substring carrying that state — what the controls read/edit */
	classesByPieceState: Record<string, Record<string, string>>;
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

// --- interaction derivation -------------------------------------------------------------------------
// Each piece's real interactions come from its OWN classes (cva base for a cva'd slot, else the slot
// className). This is where the hover-vs-`focus:` bug dies: the "this piece highlights on `focus:`"
// mapping is computed ONCE from the real file, not guessed per click.

/** One prefix segment: a word/word+bracket state (`hover:`, `data-[state=open]:`) OR a bracket-only
 *  arbitrary-selector context (`[a]:`, `[&_svg]:`). We keep the contexts here (unlike tw-tokens'
 *  statePart, which drops them) — because a context/variant scope is exactly what re-attributes a
 *  state away from the plain piece. */
const SEGMENT = /[a-zA-Z0-9-]+(?:\[[^\]]*\])?:|\[(?:[^[\]]|\[[^\]]*\])*\]:/g;
/** The fixed design words offered to Add on any element. Others show only when the piece has them. */
const CORE = ["hover", "focus", "active", "disabled"] as const;
/** A utility that only animates — a state made entirely of these carries nothing the controls edit. */
const ANIM = /^(animate-|fade-(in|out)|zoom-(in|out)|slide-(in|out)|spin$|pulse$|bounce$|ping$)/;

/** True when a segment SCOPES the class to a flag/variant/context (`[a]:`, `data-[variant=…]:`,
 *  `data-[inset]:`, `data-[size=…]:`) rather than to an interaction. A scoped state belongs to that
 *  flag/variant, never the plain piece — so its hover/focus is surfaced only when you select it. */
/** data-/aria-attr words that are interaction STATES (radix/vega/base-ui set these) — never flags/scopes. */
const STATE_ATTR =
	/^(open|closed|active|disabled|checked|selected|on|pressed|expanded|indeterminate)$/;
/** The subset of STATE_ATTR words (and `data-[state=…]` values) that read as engaged → the "Active"
 *  catch-all. Excludes the transient/off states (`closed`, `indeterminate`) and `disabled`. */
const ENGAGED = /^(open|active|on|pressed|checked|selected|expanded)$/;

function isScope(seg: string): boolean {
	if (seg.startsWith("[")) return true; // arbitrary-selector context: [a]: (as link), [&_svg]: (icon)
	const s = seg.replace(/:$/, "");
	// bracketed data/aria attr (optionally not-/group-/peer- prefixed): data-[variant=x], data-[inset],
	// not-data-[variant=destructive] (scoped to the non-destructive case).
	const m = s.match(/^(?:not-)?(?:group-|peer-)?(?:data|aria)-\[([a-z-]+)(?:=[a-z0-9-]+)?\]$/);
	if (m) {
		const key = m[1];
		return !(key === "state" || key === "disabled" || key === "checked" || key === "selected");
	}
	// vega / Tailwind v4 boolean-attr shorthand (no brackets): data-inset scopes (a flag); data-open /
	// aria-pressed / data-disabled are interaction states, not scopes.
	const b = s.match(/^(?:not-)?(?:group-|peer-)?(?:data|aria)-([a-z-]+)$/);
	if (b) return !STATE_ATTR.test(b[1] ?? "");
	return false; // a pseudo (hover:) or an env word (dark:, sm:) — not a scope
}

/** The design word a single (non-scope) segment maps to, or null if it isn't a steady state. Only ever
 *  returns one of `hover` / `focus` / `active` / `disabled` — every engaged/on/open/selected/pressed
 *  code-state collapses to the `active` catch-all (the user never sees the underlying selector). */
function segmentInteraction(seg: string): string | null {
	const s = seg.replace(/:$/, "");
	if (s === "hover") return "hover";
	if (s === "focus" || s === "focus-visible") return "focus";
	if (s === "active" || s === "visited") return "active"; // engaged / visited link → Active
	if (s === "disabled") return "disabled";
	const m = s.match(/^(?:group-|peer-)?(?:data|aria)-\[([a-z-]+)(?:=([a-z0-9-]+))?\]$/);
	if (m) {
		const [, key, val] = m;
		if (key === "state") {
			if (val === "disabled") return "disabled";
			if (val && ENGAGED.test(val)) return "active"; // open / checked / on / selected / … → Active
			return null; // closed / indeterminate / … — transient, nothing steady to edit
		}
		if (key === "disabled") return "disabled";
		if (key && ENGAGED.test(key)) return "active"; // aria-[pressed] / data-[checked] / … → Active
		return null;
	}
	// vega / Tailwind v4 / base-ui boolean-attr shorthand: aria-pressed / data-open → active, … → disabled
	const b = s.match(/^(?:group-|peer-)?(?:data|aria)-([a-z-]+)$/);
	if (b) {
		const key = b[1] ?? "";
		if (key === "disabled") return "disabled";
		if (ENGAGED.test(key)) return "active";
	}
	return null;
}

/** Which interaction a plain (unscoped) class belongs to: `""` chain → default; a scoped chain → null
 *  (owned by a flag/variant); else its first interaction segment, or null for pure env (dark:, sm:). */
function classInteraction(state: string): string | null {
	if (state === "") return "default";
	const segs = state.match(SEGMENT) ?? [];
	if (segs.some(isScope)) return null; // attributed to the flag/variant/context, not the plain piece
	for (const seg of segs) {
		const i = segmentInteraction(seg);
		if (i) return i;
	}
	return null;
}

/** Group a piece's own classes into `{ interaction: classes }` and the ordered interaction list. */
function deriveInteractions(own: string): {
	interactions: Interaction[];
	classesByState: Record<string, string>;
} {
	const groups: Record<string, string[]> = {};
	for (const t of parseClasses(own)) {
		const which = classInteraction(t.state);
		if (which === null) continue; // scoped by a flag/variant/context, or pure env — not a plain state
		// ponytail: if a piece carries two *different* engaged prefixes (e.g. aria-pressed: and
		// data-[state=on]:) they both land in `active` and an edit targets the first — acceptable; a real
		// component styles its on-state one way. Split by prefix only if that ever bites.
		const group = groups[which] ?? [];
		group.push(t.raw);
		groups[which] = group;
	}

	const classesByState: Record<string, string> = {};
	const present: string[] = [];
	for (const [state, raws] of Object.entries(groups)) {
		// Hide an animation-only state (a content's open = animate/fade/zoom) — nothing to edit yet.
		if (state !== "default" && raws.every((r) => ANIM.test(r.slice(r.lastIndexOf(":") + 1))))
			continue;
		classesByState[state] = raws.join(" ");
		present.push(state);
	}
	if (!present.includes("default")) {
		classesByState.default = "";
		present.unshift("default");
	}

	const core = [...CORE];
	const interactions: Interaction[] = [{ name: "default", present: true }];
	for (const s of present) if (s !== "default") interactions.push({ name: s, present: true });
	for (const c of core) if (!present.includes(c)) interactions.push({ name: c, present: false });
	return { interactions, classesByState };
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
		// Flags: boolean data-attr (no `=value`) — bracketed `data-[inset]:` (old) or bare `data-inset:`
		// (vega / Tailwind v4 shorthand). State attrs (disabled/open/checked/…) are interactions, not flags.
		for (const re of [/data-\[([a-z-]+)\]:/g, /(?<![a-z-])data-([a-z-]+):/g]) {
			for (const m of cls.matchAll(re)) {
				const f = m[1];
				if (
					f &&
					f !== "state" &&
					!STATE_ATTR.test(f) &&
					!flags.some((x) => x.name === f && x.namespace === slot)
				)
					flags.push({ name: f, namespace: slot });
			}
		}
	}
	// Render element: the root can render as a different tag (base-ui `render`, old asChild). Its
	// alternates are the bare element-tag contexts in the root's classes — `[a]:` (link), `[button]:` …
	// — as opposed to descendant contexts like `[&_svg]:`. NOT a flag: it swaps the root's element.
	const rootSurface = [root ? (slots[root] ?? "") : "", ...cvas.map((c) => c.base)].join(" ");
	const renderEls = [
		...new Set(
			[...rootSurface.matchAll(/\[([a-z][a-z0-9]*)\]:/g)]
				.map((m) => m[1])
				.filter((x): x is string => x !== undefined),
		),
	];
	const render: Render | null =
		root && renderEls.length ? { slot: root, elements: renderEls } : null;

	// Parts: DOM pieces that aren't Root/Trigger/Structure. (Own-classes is implicit — a class-less
	// element still has a cva or is editable; icon/image aren't slots at all, so they never land here.)
	const parts = slotNames.filter((s) => s !== root && s !== trigger && !structure.includes(s));

	// Interactions per piece — from its OWN classes (cva base for a cva'd slot, else its slot className).
	const cvaBySlot = new Map(cvas.map((c) => [c.slot, c]));
	const interactionsByPiece: Record<string, Interaction[]> = {};
	const classesByPieceState: Record<string, Record<string, string>> = {};
	for (const piece of [root, trigger, ...structure, ...parts]) {
		if (!piece) continue;
		const own = cvaBySlot.get(piece)?.base ?? slots[piece] ?? "";
		const { interactions, classesByState } = deriveInteractions(own);
		interactionsByPiece[piece] = interactions;
		classesByPieceState[piece] = classesByState;
	}

	return {
		name,
		root,
		trigger,
		structure,
		parts,
		variants,
		flags,
		render,
		interactionsByPiece,
		classesByPieceState,
	};
}
