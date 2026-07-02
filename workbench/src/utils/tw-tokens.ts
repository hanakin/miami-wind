// Parse a cva class string into prefix-aware tokens so the inspector can edit individual
// CSS properties per interaction state and write valid Tailwind back. Anything the structured
// controls don't cover stays reachable as raw chips — so all of CSS remains editable.

export const STATES = [
	{ key: "", label: "Base" },
	{ key: "hover:", label: "Hover" },
	{ key: "focus-visible:", label: "Focus" },
	{ key: "active:", label: "Active" },
	{ key: "disabled:", label: "Disabled" },
] as const;

export interface Token {
	raw: string;
	state: string;
	utility: string;
}

// State/context prefixes: plain (`hover:`) or arbitrary-selector (`[a]:`, `[&_svg]:`), one level of
// bracket nesting allowed so `[&_svg:not([class*='size-'])]:` tokenizes as a single prefix.
const PREFIX_RE = /^((?:[a-zA-Z0-9-]+:|\[(?:[^[\]]|\[[^\]]*\])*\]:)+)/;

export function splitClass(raw: string): Token {
	const m = raw.match(PREFIX_RE);
	const state = m ? m[0] : "";
	return { raw, state, utility: raw.slice(state.length) };
}

export function parseClasses(value: string): Token[] {
	return value.split(/\s+/).filter(Boolean).map(splitClass);
}

export function buildClasses(tokens: Token[]): string {
	return tokens.map((t) => t.raw).join(" ");
}

/** Promote one state's prefixed utilities to base (strip the prefix) — for forced-state previews. */
export function flattenState(value: string, state: string): string {
	if (!state) return value;
	return parseClasses(value)
		.filter((t) => t.state === state)
		.map((t) => t.utility)
		.join(" ");
}

/** Replace tokens in `state` matching `match` with one `utility` (or remove all matches if null). */
export function applyUtility(
	value: string,
	state: string,
	match: (u: string) => boolean,
	utility: string | null,
): string {
	const tokens = parseClasses(value).filter((t) => !(t.state === state && match(t.utility)));
	if (utility) tokens.push({ raw: state + utility, state, utility });
	return buildClasses(tokens);
}

export function findUtility(
	value: string,
	state: string,
	match: (u: string) => boolean,
): string | null {
	const found = parseClasses(value).find((t) => t.state === state && match(t.utility));
	return found ? found.utility : null;
}

export function removeRaw(value: string, raw: string): string {
	return buildClasses(parseClasses(value).filter((t) => t.raw !== raw));
}

export function addRaw(value: string, raw: string): string {
	const tokens = parseClasses(value);
	return tokens.some((t) => t.raw === raw) ? value : buildClasses([...tokens, splitClass(raw)]);
}

// --- Colors -----------------------------------------------------------------
// Tokens that resolve to a --color-* variable (theme @theme layer + shadcn bridges).

export const COLOR_TOKENS = [
	"primary",
	"secondary",
	"destructive",
	"accent",
	"muted",
	"foreground",
	"background",
	"card",
	"popover",
	"border",
	"input",
	"surface",
	"base",
	"crust",
	"mantle",
	"text",
	"subtext",
	"subtext0",
	"interactive",
	"pink",
	"cyan",
	"yellow",
	"purple",
	"blue",
	"green",
	"red",
	"orange",
	"bright-pink",
	"bright-cyan",
	"success",
	"warn",
	"error",
	"info",
	"grey-50",
	"grey-100",
	"grey-200",
	"grey-300",
	"grey-400",
	"grey-500",
	"grey-600",
	"grey-700",
	"grey-800",
	"grey-900",
	"grey-1000",
	"grey-1100",
	"grey-1200",
	"grey-1300",
] as const;

// Recognized color tokens. Seeded with COLOR_TOKENS (the built-in theme) and replaced live from the
// theme store as vars are added/removed — so the menu and parser never drift from the CSS vars.
// ponytail: module-global set; fine because the workbench edits one theme at a time.
let colorSet = new Set<string>(COLOR_TOKENS);
export function setColorTokens(tokens: Iterable<string>): void {
	colorSet = new Set(tokens);
}

/** A theme var name (`--color-primary`, `--primary`) as its utility token (`primary`). */
export function tokenUtil(name: string): string {
	return name.replace(/^--(color-)?/, "");
}

/** Heuristic: a theme value that renders as a color — excludes lengths like `--radius: 0.375rem`. */
export function isColorValue(value: string): boolean {
	return !/^\s*[\d.]+(px|rem|em|%)\s*$/.test(value);
}

// Valid CSS color values that aren't theme tokens — used to override an inherited color
// (e.g. bg-transparent kills a hover bg inherited from base). Order = picker order.
export const COLOR_KEYWORDS = ["transparent", "current", "inherit"] as const;
const KEYWORD_SET = new Set<string>(COLOR_KEYWORDS);
export type ColorProp = "bg" | "text" | "border";

export interface ColorValue {
	token: string;
	opacity: number;
}

export function parseColor(utility: string, prop: ColorProp): ColorValue | null {
	if (!utility.startsWith(`${prop}-`)) return null;
	const rest = utility.slice(prop.length + 1);
	const [token, op] = rest.split("/");
	if (!token || !(colorSet.has(token) || KEYWORD_SET.has(token))) return null;
	return { token, opacity: op ? Number(op) : 100 };
}

export function colorUtility(prop: ColorProp, token: string, opacity: number): string {
	return opacity >= 100 ? `${prop}-${token}` : `${prop}-${token}/${opacity}`;
}

export function isColor(prop: ColorProp) {
	return (u: string) => parseColor(u, prop) !== null;
}

/** CSS color for a token, resilient to shadcn-bridge tokens that exist only as `--x` (not `--color-x`). */
export function swatchVar(token: string): string {
	if (token === "transparent") return "transparent";
	if (token === "current") return "currentColor";
	if (token === "inherit") return "inherit";
	return `var(--color-${token}, var(--${token}))`;
}

/** Matches a color utility for a prop: a known token (bg-pink, bg-pink/50) or arbitrary (bg-[#abc]). */
export function colorMatch(prop: ColorProp) {
	return (u: string) => parseColor(u, prop) !== null || u.startsWith(`${prop}-[`);
}

export interface ReadColor {
	token: string | null;
	opacity: number;
	arbitrary: string | null;
}

/** Read the current color utility for a prop in a given state into a structured value. */
export function readColor(value: string, state: string, prop: ColorProp): ReadColor {
	const u = findUtility(value, state, colorMatch(prop));
	if (!u) return { token: null, opacity: 100, arbitrary: null };
	const parsed = parseColor(u, prop);
	if (parsed) return { token: parsed.token, opacity: parsed.opacity, arbitrary: null };
	const m = u.match(/^[a-z]+-\[(.+)\]$/);
	return { token: null, opacity: 100, arbitrary: m?.[1] ?? null };
}

export interface EffectiveColor extends ReadColor {
	/** True when the shown value comes from `inherited` (base/underlying), not the edited target. */
	inherited: boolean;
}

/**
 * The color a prop/state actually renders, across the cva cascade: the edited target's own value if
 * it sets one, else the value inherited from `inherited` (the classes beneath it — e.g. base when
 * editing a variant). Flagged so the UI can show "inherited" and offer an explicit override. Writes
 * always target the own value, so setting e.g. transparent here beats the inherited color.
 */
export function readEffectiveColor(
	own: string,
	inherited: string,
	state: string,
	prop: ColorProp,
): EffectiveColor {
	if (findUtility(own, state, colorMatch(prop))) {
		return { ...readColor(own, state, prop), inherited: false };
	}
	const inh = readColor(inherited, state, prop);
	return { ...inh, inherited: inh.token !== null || inh.arbitrary !== null };
}

export function arbitraryColor(prop: ColorProp, value: string): string {
	return `${prop}-[${value}]`;
}

// --- Size -------------------------------------------------------------------
// A width+height utility (`size-4`, `size-full`) the Size control edits and cva-controls uses to spot
// `[&_svg]`/`[&_img]` sizing contexts. w-/h- resolve in live-css too but aren't offered by the control.
export function sizeMatch(u: string): boolean {
	return /^size-(\d+(?:\.\d+)?|full)$/.test(u);
}
