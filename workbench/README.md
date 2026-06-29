# Miami Wind Workbench

A local dev tool for authoring the Miami Wind registry — the **cvas** for every shadcn primitive,
the **theme** tokens, and the custom primitives — with live preview and save-on-click. Think
[tweakcn](https://tweakcn.com/editor/theme), but inverted: instead of producing a one-off theme, it
reads and writes the registry that is this repo's source of truth.

It is itself a Miami Wind app — hand-rolled against the conventions in `../conventions/` (Bun · Vite ·
TanStack Router · Hono · Tailwind v4 · Biome, dark-only, no focus rings) — so the registry's
conventions get dogfooded.

## Run

```sh
cd workbench
bun install
bun run dev      # Vite (web) + Hono (api) together
```

Open the printed Vite URL. `bun run check` (Biome + typecheck + Vitest) is the completion gate.

The backend reads and writes the sibling registry directly (`../registry/components/ui/cva/*.ts`,
`../registry/components/ui/*.tsx`, `../registry.json`); set `REGISTRY_DIR` to point elsewhere.

## What it does

- **Wall** (`/`) — every shadcn primitive + the custom `icon`, rendered live. Cards flag which have a
  `cva` layer and which have unsaved edits.
- **Detail** (`/components/:name`) — one component's variants in a labelled table, plus a **rich
  inspector**: per-state (base / hover / focus / active / disabled) color controls with opacity
  sliders, radius / border / font / cursor selects, element opacity, removable class chips, and a
  full Tailwind-v4 IntelliSense add-class field. Anything the controls don't cover stays reachable as
  a raw class string — so all of CSS is editable. Edits preview instantly; **Save** writes the cva to
  `registry/components/ui/cva/<name>.ts`. Custom primitives (no cva) are preview-only with a props
  playground.
- **Theme** (`/theme`) — edit every token with live recolor, and **create new tokens** as a plain CSS
  variable or as a `--color-*` that generates Tailwind utilities. Save writes `registry.json` and
  regenerates the workbench's `globals.css`.

## How it works

The novel piece is the **`live-cva` Vite plugin** (`plugin/live-cva.ts`), the live-editing sibling of
the registry's `mw-cva`. Where `mw-cva` swaps a primitive's inline `const xVariants = cva(...)` for an
import of a static cva file, `live-cva` swaps it for `__liveCva("xVariants", "<file>", BASE, CONFIG)`,
which registers the vanilla shadcn default as a seed and then reads the *current* model from a Zustand
store on every render. So real primitives re-render instantly as you edit, and nothing touches disk
until Save.

```
Browser (Vite SPA)                              Hono backend (Bun)
  Wall · Detail (table + inspector) · Theme       /api/cva        ⇄ registry/.../cva/*.ts
  Zustand store: seeds ⊕ registry overrides       /api/primitives → registry/.../ui/*.tsx
    ▲ seeded by live-cva plugin                    /api/theme      ⇄ registry.json (+ globals.css)
    ▼ read by real primitives at render            /api/tailwind/classes → TW v4 design system
```

The backend owns all file I/O and the codecs: `cva-codec` (parse via the TypeScript compiler API,
serialize back + Biome-format), `theme-codec` (registry.json tokens), `globals-codec` (regenerate
`globals.css`), and `tailwind-classlist` (the full class list, including Miami Wind's custom
utilities, via Tailwind v4's design-system introspection).

## Layout

```
src/
  app/                 routes: __root (shell), index (wall), components.$name (detail), theme
  components/          previews, variants-table, cva-editor, inspector, sidebar
    ui/                vanilla shadcn primitives (vendored — not linted/edited)
  stores/              workbench (cva drafts), theme (token drafts)
  utils/               cn, api (hc RPC client), live-cva runtime, cva-edit, tw-tokens
server/
  routes/              cva, primitives, theme, tailwind
  lib/                 cva-codec, theme-codec, globals-codec, tailwind-classlist, format, registry-paths
plugin/live-cva.ts     the live-editing Vite plugin
```

## Scope notes

- Only primitives that ship an inline cva are cva-editable (the others are styled inline, with nothing
  for `mw-cva` to override). Adding a shadcn primitive with a cva makes it editable automatically.
- The cva codec supports the documented Miami Wind shape (string base + object of string-literal
  classes); anything dynamic is rejected with a clear error rather than mangled.
