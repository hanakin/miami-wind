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

const PREFIX_RE = /^((?:[a-zA-Z0-9-]+:|\[[^\]]*\]:)+)/;

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

const COLOR_SET = new Set<string>(COLOR_TOKENS);
export type ColorProp = "bg" | "text" | "border";

export interface ColorValue {
	token: string;
	opacity: number;
}

export function parseColor(utility: string, prop: ColorProp): ColorValue | null {
	if (!utility.startsWith(`${prop}-`)) return null;
	const rest = utility.slice(prop.length + 1);
	const [token, op] = rest.split("/");
	if (!token || !COLOR_SET.has(token)) return null;
	return { token, opacity: op ? Number(op) : 100 };
}

export function colorUtility(prop: ColorProp, token: string, opacity: number): string {
	return opacity >= 100 ? `${prop}-${token}` : `${prop}-${token}/${opacity}`;
}

export function isColor(prop: ColorProp) {
	return (u: string) => parseColor(u, prop) !== null;
}

/** CSS value usable as a swatch background for a color token. */
export function swatchVar(token: string): string {
	return `var(--color-${token})`;
}
