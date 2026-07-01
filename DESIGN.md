# DESIGN

The shared visual baseline. Miami Wind owns the **complete** theme — neutrals and accents — as a
dark-only system. Projects inherit it and refine on top.

## Foundation

- Stack: Bun, Tailwind CSS v4, shadcn/ui themed with Miami Wind.
- The theme is **authored** as a layered set of CSS variables in the registry's `theme` item (dark-only).
  `palette.json` is the canonical palette **reference** (and feeds the editor-theme repos); it does **not**
  generate the theme. Colors are authored once — as the greyscale and as aliases of native Tailwind
  accents; everything else references those.
- Default app radius is `6px` (`--radius: 0.375rem`).

## Theme ownership

Miami Wind defines **all** shadcn tokens — a deliberate, complete dark theme, layered so the greys and
native Tailwind accents stay the single source. Each layer references the one beneath it.

**1 — Greyscale** (authored hex; Catppuccin tones aren't in Tailwind): `--color-grey-50 … --color-grey-1300`.

**2 — Grey semantics** (code-named, by *elevation* — deeper = further back, lighter = closer to the user):
`crust→1300`, `mantle→1200`, `base→1100`, `surface→1000`; `text→50`, `subtext→100`, `subtext0→200`.

**3 — Color names** alias native Tailwind accents (the only place Tailwind steps are named):
`pink→pink-300` (`bright-pink→pink-500`), `cyan→cyan-400` (`bright-cyan→sky-400`), and likewise
yellow/purple/blue/green/red/orange with bright companions. 50% `*-transparent` variants via `color-mix`.

**4 — Status + interactive**: `success/warn/error/info` → bright green/yellow/red/blue, each foreground
`base`; `interactive → grey-800` (neutral hover surface).

**5 — Brand roles** (override shadcn's own `--color-primary`/`--color-secondary`): `primary → pink`,
`secondary → cyan`; `destructive → error` (bright-red). `*-transparent` brand variants ride the 50% tints.

**6 — shadcn fallbacks** so unwrapped stock components still render, mapped by elevation:

```
background → crust (grey-1300)        border  → white/7  (color-mix, no grey tone)
card       → base  (grey-1100)        ring    → transparent  (no focus ring; see No rings)
popover    → surface (grey-1000)      radius  → 0.375rem
input/accent → interactive (grey-800)
muted      → grey-500                 muted-foreground → grey-700
sidebar    → mantle (grey-1200)       --sidebar-* alias the global tokens

foregrounds → text, EXCEPT  secondary→base · accent→pink · destructive→base · muted-foreground→grey-700
```

Because cards (grey-1100) sit *lighter* than the page (grey-1300), layers separate by elevation alone — no
border or shadow crutch needed.

**The full greyscale** (light → dark), tailwind-named, with Catppuccin code names where they apply:

```
grey-50   #cdd6f4  Text
grey-100  #bac2de  Subtext
grey-200  #a6adc8  Subtext 0
grey-300  #9399b2
grey-400  #7f849c
grey-500  #6c7086
grey-600  #585b70
grey-700  #45475a
grey-800  #313244
grey-900  #1e1e2e
grey-1000 #181825  Surface
grey-1100 #11111b  Base
grey-1200 #0d0d14  Mantle
grey-1300 #09090b  Crust
```

White `#ffffff` and Black `#000000` bound the ends. The two darkest (grey-1200/1300) were added so the
page and app shell get their own depth below the card — the ladder is now final.

## No light mode

Light mode does not exist. Ship dark-forced: no `light`/`:root` light block, `color-scheme: dark`. Do
not invent a light palette. (The dark greyscale above *is* the Miami Wind ladder — use it, don't fork it.)

## No rings

There is **no ring or outline focus styling anywhere.** Primitives strip every `ring-*` / `outline`
class. `focus-visible` must still be visible for keyboard users — but it shows the same way a strong
hover reads (a background or border shift), never a ring. The `--ring` token exists only so
un-customized third-party components don't break; owned primitives never use it.

## Visual direction

- Dark, flat colors. Separation comes from elevation (lighter surfaces forward), not ornament.
- **No gradients. No glass. No glow-heavy neon.** Restrained contrast and color.

## Accent palette (roles)

Base hues (bright companion in parens, used for hover/emphasis/active states):

- Pink `pink-300` (`pink-500`) — primary, keywords, highlight, important
- Cyan `cyan-400` (`sky-400`) — secondary, accent; **`sky-400`** = links, variables, properties
- Yellow `yellow-200` (`yellow-300`) — strings, italic
- Purple `purple-400` (`violet-400`) — headings
- Blue `indigo-400` (`blue-600`) — comments, header alt, horizontal rules
- Green `emerald-400` (`green-400`) — inline code, functions
- Red `red-400` (`rose-500`) — error, destructive
- Orange `orange-300` (`orange-400`) — markup, values, bold

Bright steps are support variants for emphasis, active highlights, badges, charts, syntax — used
sparingly. They never replace neutral surfaces.

## Icons

- Icons render through the `Icon` component. It's a **discriminated union**:
  - `type: "iconify"` (default) — `icon` is an Iconify name string: `<Icon icon="mdi:add" />`.
  - `type: "custom"` — `icon` is your own SVG component: `<Icon type="custom" icon={ChargerSvg} />`.
- Default size **20px**, overridable per use. There is **no baked default set** — the component is fully
  agnostic. "Prefer `mdi:` unless the user specifies another set for that icon" is *agent guidance*
  here, a per-icon judgment, not a code default.
- Custom SVGs theme via `currentColor` (author them with `fill`/`stroke="currentColor"`), so
  `className="text-primary"` works identically on both branches.
- Shared controls (buttons, selects, tabs, accordions, alerts, banners, badges, menus) keep the 20px
  default. Product logos/brand marks are not control icons and may use a documented brand size.

## Component guidance

- Follow shadcn patterns but **own the variants, not the component.** Primitives in `components/ui/` stay
  **vanilla shadcn** — never hand-edited (fixed only for the rare upstream bug). Each primitive's Miami
  Wind variants live in a **separate** file, `components/ui/cva/<name>.ts`. The two files never import
  each other; the **`mw-cva` plugin** links them by filename at load and falls back to the primitive's
  inline cva when no cva file is present.
- To restyle a primitive (variants, theme, behavior tied to variants), edit its `cva/<name>.ts` — not the
  component, never per-call `className` overrides. shadcn's usability defaults (e.g. missing pointer
  cursors) are insufficient — fix them once, in the cva.
- Buttons, inputs, dialogs, tables, menus, navigation change theme/variants only unless a project
  genuinely needs a redesign.

## Interaction standards

shadcn defaults aren't sufficient for affordance. Guarantee:

- Every enabled clickable element: `cursor: pointer`. Text inputs/textareas keep the text cursor.
  Disabled controls: disabled cursor + visibly muted state.
- Every enabled clickable element: a visible hover state changing at least one of background, border,
  foreground, underline, or opacity — visible in dark mode without relying on tiny contrast.
- Active/selected/checked/current states visually distinct from hover.
- `focus-visible` present for keyboard users via a background/border shift — **no ring** (see No rings).
- Links: hover affordance via underline, foreground change, or both.
- Primary buttons: pink + white text + visible hover (→ `pink-500`). Secondary: cyan + white text +
  visible hover (→ `sky-400`).
- Icon-only actions hover by intent: primary/pink icon → pink background, white foreground;
  destructive/red icon → red background, white foreground; neutral icon → accent background/foreground.
- Menus/command palettes show highlighted/focused/selected item states clearly. Tabs show
  hover/active/selected clearly (`accent` is the default higher-surface neutral).
- Clickable rows/cards need a hover treatment and pointer cursor — the card shape alone isn't enough.
- Verify visually; don't assume generated components satisfy these.

## Anti-goals

- No light mode. No rings/outlines. No gradients. No glass. No glow-heavy neon.
- Don't hardcode colors or invent project-specific neutral scales — use the theme tokens / Tailwind vars.
- Don't add theme abstractions beyond what's defined here unless genuinely needed.

## Source

- Canonical palette: `palette.json` (multi-format reference; the `tailwind` field records each accent's native Tailwind step). It does not generate the theme.
- Preview: `docs/color-scheme-preview.html`.
