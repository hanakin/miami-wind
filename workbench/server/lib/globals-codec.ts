import type { ThemeModel } from "./theme-codec";

// Regenerate the workbench's globals.css from the theme tokens, so saving the theme re-themes
// the whole tool (Vite HMR reloads the css). The @theme layer + the shadcn bridges generate the
// utilities; new "var + utilities" tokens are --color-* in the theme layer (utilities for free),
// new "var only" tokens live in :root and are deliberately NOT bridged (no utility).

// The fixed shadcn fallback tokens that need a --color-* bridge to become utilities (bg-card, …).
// primary/secondary already have --color-* twins in the @theme layer; --radius is not a color.
const SHADCN_BRIDGE = new Set([
	"background",
	"foreground",
	"border",
	"ring",
	"input",
	"popover",
	"popover-foreground",
	"card",
	"card-foreground",
	"sidebar",
	"sidebar-foreground",
	"sidebar-primary",
	"sidebar-primary-foreground",
	"sidebar-accent",
	"sidebar-accent-foreground",
	"sidebar-border",
	"sidebar-ring",
	"accent",
	"accent-foreground",
	"secondary-foreground",
	"primary-foreground",
	"destructive",
	"destructive-foreground",
	"muted",
	"muted-foreground",
]);

export function generateGlobalsCss(model: ThemeModel): string {
	const theme = model.tokens.filter((t) => t.layer === "theme");
	const dark = model.tokens.filter((t) => t.layer === "dark");
	const line = (name: string, value: string) => `\t${name}: ${value};`;

	const themeBlock = theme.map((t) => line(t.name, t.value)).join("\n");
	const darkBlock = dark.map((t) => line(t.name, t.value)).join("\n");
	const bridges = dark
		.filter((t) => SHADCN_BRIDGE.has(t.name.slice(2)))
		.map((t) => line(`--color-${t.name.slice(2)}`, `var(${t.name})`))
		.join("\n");

	return `@import "tailwindcss";

@theme {
${themeBlock}
}

:root {
\tcolor-scheme: dark;
${darkBlock}
}

@theme inline {
${bridges}
\t--radius-sm: calc(var(--radius) - 4px);
\t--radius-md: calc(var(--radius) - 2px);
\t--radius-lg: var(--radius);
\t--radius-xl: calc(var(--radius) + 4px);
}

@layer base {
\t* {
\t\tborder-color: var(--color-border);
\t}
\tbody {
\t\tbackground-color: var(--color-background);
\t\tcolor: var(--color-foreground);
\t\tfont-family: var(--font-sans);
\t}
}
`;
}
