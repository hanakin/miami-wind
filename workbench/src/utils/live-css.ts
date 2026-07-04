import { parseSurface } from "~/stores/workbench";
import type { CvaModel } from "../../server/lib/cva-codec";
import { parseClasses, parseColor, swatchVar } from "./tw-tokens";

// Live preview without Tailwind. Tailwind only generates classes it finds in source at build
// time, so a class the inspector creates at runtime (bg-primary/73, a freshly typed utility)
// produces no CSS. Instead we resolve the inspector's structured utilities straight to CSS and
// inject them as an unlayered stylesheet — which beats Tailwind's @layer utilities regardless of
// specificity — keyed by the data-slot/data-<axis> attributes shadcn primitives already expose.
// Scoped to [data-preview] so it only restyles the canvas, never the workbench's own chrome.
// Anything outside this bounded set stays Tailwind's job and compiles for real on Save.
//
// ponytail: covers the Inspector controls (color/opacity/radius/border/font/cursor/size) + base, the
// four interaction states, and the `[a]` / `[&_svg]` / `[&_img]` pass-through contexts. dark:/aria:/
// data-[state]: variants are still passed over, not resolved — add them here if the inspector edits them.

const SCOPE = "[data-preview] ";

const STATE_PSEUDO: Record<string, string> = {
	"": "",
	"hover:": ":hover",
	"focus-visible:": ":focus-visible",
	"active:": ":active",
	"disabled:": ":disabled",
};

// Peel a leading arbitrary-selector context (`[a]:`, `[&_svg:not([class*='size-'])]:`) off a state
// prefix, bracket-nesting aware. Returns the inner content + the remaining plain-state chain, or null
// if the leading `[…]` isn't a closed, colon-terminated context.
function splitContext(state: string): { content: string; rest: string } | null {
	let depth = 0;
	for (let i = 0; i < state.length; i++) {
		if (state[i] === "[") depth++;
		else if (state[i] === "]" && --depth === 0) {
			return state[i + 1] === ":" ? { content: state.slice(1, i), rest: state.slice(i + 2) } : null;
		}
	}
	return null;
}

// A token's state prefix → the full selector (after SCOPE) it targets, or null if the engine doesn't
// handle it. Plain states target the slot itself (`[data-slot=…]:hover`). `[a]:` targets the slot only
// when it's an <a> (asChild): `a[data-slot=…]`. A `[&…]:` context becomes a descendant of the slot,
// with `&` → the slot and `_` → a space: `[&_svg:not(…)]:` → `[data-slot=…] svg:not(…)`. Anything else
// (`data-[state]:`, dark:, aria:) stays Tailwind's job — returns null so it's skipped.
function resolveSelector(state: string, slotSel: string): string | null {
	let target = slotSel;
	let rest = state;
	if (rest.startsWith("[")) {
		const ctx = splitContext(rest);
		if (!ctx) return null;
		rest = ctx.rest;
		if (ctx.content === "a") target = `a${slotSel}`;
		else if (ctx.content.startsWith("&"))
			target = `${slotSel}${ctx.content.slice(1).replace(/_/g, " ")}`;
		else return null;
	}
	const pseudo = STATE_PSEUDO[rest];
	return pseudo === undefined ? null : `${target}${pseudo}`;
}

const RADIUS: Record<string, string> = {
	"rounded-none": "0",
	rounded: "var(--radius-md)",
	"rounded-sm": "var(--radius-sm)",
	"rounded-md": "var(--radius-md)",
	"rounded-lg": "var(--radius-lg)",
	"rounded-xl": "var(--radius-xl)",
	"rounded-2xl": "calc(var(--radius-lg) + 8px)",
	"rounded-full": "9999px",
};

const FONT_SIZE: Record<string, [size: string, line: string]> = {
	"text-xs": ["0.75rem", "1rem"],
	"text-sm": ["0.875rem", "1.25rem"],
	"text-base": ["1rem", "1.5rem"],
	"text-lg": ["1.125rem", "1.75rem"],
	"text-xl": ["1.25rem", "1.75rem"],
	"text-2xl": ["1.5rem", "2rem"],
};

const FONT_WEIGHT: Record<string, string> = {
	"font-normal": "400",
	"font-medium": "500",
	"font-semibold": "600",
	"font-bold": "700",
};

function colorValue(token: string, opacity: number): string {
	const base = swatchVar(token); // var(--color-X, var(--X)) — resolves @theme + shadcn-bridge tokens
	return opacity >= 100 ? base : `color-mix(in oklab, ${base} ${opacity}%, transparent)`;
}

/** One utility → one CSS declaration, or null if it isn't an inspector-controlled property. */
function declFor(u: string): string | null {
	for (const [prefix, prop] of [
		["bg", "background-color"],
		["text", "color"],
		["border", "border-color"],
	] as const) {
		const c = parseColor(u, prefix);
		if (c) return `${prop}: ${colorValue(c.token, c.opacity)};`;
		if (u.startsWith(`${prefix}-[`)) {
			const m = u.match(/^[a-z]+-\[(.+)\]$/);
			if (m) return `${prop}: ${m[1]};`;
		}
	}
	if (u === "border") return "border-width: 1px; border-style: solid;";
	const bw = u.match(/^border-(\d+)$/);
	if (bw) return `border-width: ${bw[1]}px; border-style: solid;`;
	if (u in RADIUS) return `border-radius: ${RADIUS[u]};`;
	const fs = FONT_SIZE[u];
	if (fs) return `font-size: ${fs[0]}; line-height: ${fs[1]};`;
	const fw = FONT_WEIGHT[u];
	if (fw) return `font-weight: ${fw};`;
	const op = u.match(/^opacity-(\d+)$/);
	if (op) return `opacity: ${Number(op[1]) / 100};`;
	if (u.startsWith("cursor-")) return `cursor: ${u.slice("cursor-".length)};`;
	// size/width/height — the icon (`size-4`) and image (`size-full`) contexts. N is Tailwind's
	// 0.25rem scale; `full` → 100%.
	const size = u.match(/^(size|w|h)-(\d+(?:\.\d+)?|full)$/);
	if (size) {
		const val = size[2] === "full" ? "100%" : `${Number(size[2]) * 0.25}rem`;
		if (size[1] === "w") return `width: ${val};`;
		if (size[1] === "h") return `height: ${val};`;
		return `width: ${val}; height: ${val};`;
	}
	return null;
}

function declsFor(utils: string[]): string {
	const out: string[] = [];
	for (const u of utils) {
		const d = declFor(u);
		if (d) out.push(d);
	}
	return out.join(" ");
}

/** Rules for one base selector, one per interaction state present in the class string. */
function rulesForSelector(baseSel: string, classString: string): string[] {
	const byState = new Map<string, string[]>();
	for (const t of parseClasses(classString)) {
		if (!resolveSelector(t.state, baseSel)) continue; // skip dark:/aria:/data-[state]: — Tailwind's job
		const list = byState.get(t.state) ?? [];
		list.push(t.utility);
		byState.set(t.state, list);
	}
	const out: string[] = [];
	for (const [state, utils] of byState) {
		const sel = resolveSelector(state, baseSel);
		const decls = declsFor(utils);
		if (sel && decls) out.push(`${SCOPE}${sel} { ${decls} }`);
	}
	return out;
}

/** Rules for one data-slot target (base classes or one variant option). */
function rulesForTarget(slot: string, attr: string, classString: string): string[] {
	return rulesForSelector(`[data-slot="${slot}"]${attr}`, classString);
}

// A cva's slot is its export name minus the `Variants` suffix, kebab-cased: itemMediaVariants →
// item-media, tabsListVariants → tabs-list. The plugin seeds every cva with name=file, so name alone
// can't tell a component's multiple cvas apart — the export name carries the slot.
export function slotForCva(exportName: string): string {
	return exportName
		.replace(/Variants$/, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase();
}

export function cssForModel(model: CvaModel): string {
	const slot = slotForCva(model.exportName);
	const rules = rulesForTarget(slot, "", model.base);
	for (const [axis, opts] of Object.entries(model.variants)) {
		for (const [option, cls] of Object.entries(opts)) {
			rules.push(...rulesForTarget(slot, `[data-${axis}="${option}"]`, cls));
		}
	}
	return rules.join("\n");
}

export function cssForModels(models: Record<string, CvaModel>): string {
	return Object.values(models).map(cssForModel).filter(Boolean).join("\n");
}

// Live overlay for per-slot raw-class edits (the non-cva path). Each slot's working classes resolve to
// the same `[data-preview] [data-slot=…]` rules the cva path uses, so a slot edit paints BEFORE Save —
// exactly like a cva edit — instead of waiting on the Save-triggered HMR. Mirrors cssForModels; append
// it after so an explicit slot edit wins over a cva rule on the same element.
export function cssForSlots(slots: Record<string, string>): string {
	return Object.entries(slots)
		.flatMap(([id, classes]) => {
			// A classNames surface maps to its rendered class — react-day-picker's `.rdp-<key>` (calendar is
			// the only classNames-wrapper today). ponytail: rdp convention hardcoded; generalize per-library
			// if a second one appears. A plain data-slot targets `[data-slot="…"]`.
			const surf = parseSurface(id);
			return rulesForSelector(surf ? `.rdp-${surf.key}` : `[data-slot="${id}"]`, classes);
		})
		.join("\n");
}
