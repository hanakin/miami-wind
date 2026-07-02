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
// ponytail: covers exactly the Inspector controls (color/opacity/radius/border/font/cursor) +
// base and the four interaction states. dark:/aria:/arbitrary-selector variants are passed over,
// not resolved — add them here if the inspector ever edits them.

const SCOPE = "[data-preview] ";

const STATE_PSEUDO: Record<string, string> = {
	"": "",
	"hover:": ":hover",
	"focus-visible:": ":focus-visible",
	"active:": ":active",
	"disabled:": ":disabled",
};

// A token's state prefix → the element it targets + its pseudo. Plain states target the slot itself
// (`el: ""`); the `[a]:` link context targets the slot only when it's an <a> (asChild), e.g.
// `[a]:hover:` → `a[data-slot=…]:hover`. Anything else (`[&_svg]:`, `data-[state]:`, dark:, aria:)
// stays Tailwind's job — returns null so it's skipped.
function resolveState(state: string): { el: string; pseudo: string } | null {
	let el = "";
	let rest = state;
	if (rest.startsWith("[a]:")) {
		el = "a";
		rest = rest.slice("[a]:".length);
	}
	const pseudo = STATE_PSEUDO[rest];
	return pseudo === undefined ? null : { el, pseudo };
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

/** Rules for one target (base classes or one variant option), one per interaction state present. */
function rulesForTarget(slot: string, attr: string, classString: string): string[] {
	const byState = new Map<string, string[]>();
	for (const t of parseClasses(classString)) {
		if (!resolveState(t.state)) continue; // skip dark:/aria:/[&_svg]: — Tailwind's job
		const list = byState.get(t.state) ?? [];
		list.push(t.utility);
		byState.set(t.state, list);
	}
	const out: string[] = [];
	for (const [state, utils] of byState) {
		const r = resolveState(state);
		const decls = declsFor(utils);
		if (r && decls) {
			out.push(`${SCOPE}${r.el}[data-slot="${slot}"]${attr}${r.pseudo} { ${decls} }`);
		}
	}
	return out;
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
