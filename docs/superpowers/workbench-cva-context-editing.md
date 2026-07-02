# Workbench: multi-cva + editable pass-through contexts — implementation plan

## Context

The workbench's per-component editor (`workbench/src/components/cva-controls.tsx` + `inspector.tsx`)
lets you edit a component's cva (Base + variants) and its `data-slot`s, painting changes live via
`src/utils/live-css.ts` (unlayered CSS scoped to `[data-preview]`). Two gaps surfaced while working on
`item`, and the user wants both closed **per component** (explicitly *not* a global surface):

1. **Pass-through context styles are un-editable.** Tailwind arbitrary-selector variants —
   `[a]:hover:bg-accent/50` (the item as an `asChild` `<a>` link) and `[&_svg]:size-4` (icon sizing) —
   were skipped by the live engine and never reachable in the inspector.
2. **Only the first cva per component is surfaced.** `item` has two cvas — `itemVariants` (root) and
   `itemMediaVariants` (media, with `icon`/`image` variants). Icon/image sizing lives in the *second*,
   hidden one, so there's no path to it.

The `[a]` link case and the multi-cva foundation are already shipped (below). This plan is the rest.

## Already shipped — do NOT redo

- **`e20fdaf` — editable `[a]` link context.** In place now:
  - `Target` gained `{ kind: "context"; context: string }` (`src/utils/cva-edit.ts`). A context target
    edits the base string; the inspector scopes it through a prefix.
  - `Inspector` takes a `context` prop and edits `context + state` utilities — reuses every control
    (`src/components/inspector.tsx`, `fullState = context + state`).
  - `live-css.resolveState()` maps `[a]:` → element `a`, emitting `a[data-slot=…]:hover`
    (`src/utils/live-css.ts`).
  - `cva-controls` detects `/\[a\]:/` in `model.base`, adds a `link (a)` dropdown target, and passes
    `[a]:` as the inspector context.
  - `example-preview` renders `contextExamples[name][context]` (`ItemLinkExample`, an `asChild <a>`
    item) when a context target is selected. Registered in `src/examples/index.ts`.
  - Tests: `test/live-css.test.ts` ("link context").
- **`2d8180a` — `slotForCva(exportName)`** in `live-css.ts`: a cva's slot = export name minus the
  `Variants` suffix, kebab-cased (`itemMediaVariants` → `item-media`, `tabsListVariants` → `tabs-list`).
  `cssForModel` uses it. This is the correctness fix that makes a *second* cva target the right element.

## Key facts / gotchas (already discovered — save the rediscovery)

- **The plugin seeds every cva with `name = file`.** `plugin/live-cva.ts` rewrites
  `const xVariants = cva(...)` → `__liveCva("xVariants", "<file>", ...)`. So both item cvas have
  `name="item"`; only `exportName` distinguishes them. `useComponentModel(name)` returns the FIRST match
  (`itemVariants`). To get all: `Object.values(store.models).filter(m => m.name === name)`.
- **The tokenizer can't parse nested brackets.** `PREFIX_RE` in `src/utils/tw-tokens.ts` is
  `/^((?:[a-zA-Z0-9-]+:|\[[^\]]*\]:)+)/` — `[^\]]*` stops at the first `]`, so
  `[&_svg:not([class*='size-'])]:size-4` mis-tokenizes. Must be widened for svg sizing.
- **`live-css.declFor` handles color/border/radius/font/opacity/cursor — not width/height.** Icon size
  (`size-4`) needs new declarations.
- **`selectionVariantProps(sel)` applies the option to the ROOT primary** in `example-preview`. A media
  variant (`itemMediaVariants` `icon`) applied to `<Item variant="icon">` is wrong — it needs an example
  that puts the variant on `<ItemMedia>`.
- **`item.tsx` context inventory:** root `itemVariants` base has `[a]:transition-colors`
  `[a]:hover:bg-accent/50`. `itemMediaVariants`: base `[&_svg]:pointer-events-none`; `icon` variant
  `[&_svg:not([class*='size-'])]:size-4`; `image` variant `[&_img]:size-full [&_img]:object-cover`.
  `ItemDescription` slot: `[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary`.

## Remaining work (one commit per step; `bun run check` + a screenshot must pass each)

### Step 1 — Surface every cva (multi-cva dropdown)
Files: `cva-edit.ts`, `editor-selection.ts`, `cva-controls.tsx`.
- Add optional `symbol` (the cva's exportName) to every cva `Target` kind; `sameTarget` compares it.
- `firstVariantTarget(model)` sets `symbol: model.exportName`.
- In `cva-controls`: get all real cvas (filter above, memoized on the models map). Resolve the **active**
  model per selection: `models.find(m => m.exportName === sel.target.symbol) ?? models[0]`. Build dropdown
  options across ALL cvas with a uniform value scheme `cva:${symbol}:…`; group by cva with a
  `SelectGroup` labeled `slotForCva(exportName)` when `models.length > 1` (stay flat for one cva).
  `value` / `onChange` / `inherited` / `apply` / the "Manage variants" section all use the ACTIVE model.
- Outcome: item's `itemMediaVariants` `variant · icon` / `image` appear (grouped under "item-media"),
  each editing the right cva.
- Verify: button/badge unchanged (single cva, flat); tabs now edits `tabs-list` correctly.

### Step 2 — Per-cva variant preview
Files: `example-preview.tsx`, `src/examples/index.ts`, a new `src/examples/item/item-media.tsx`.
- Key `variantExamples` (and the render lookup) by **symbol**: e.g.
  `variantExamples.item["itemMediaVariants:variant:icon"]` → an item whose `<ItemMedia variant="icon">`
  holds an `<Icon/>`; `…:image` → media with an `<img>`. Fall back to the root primary for root-cva
  variants (current behavior).

### Step 3 — `[&_svg]` / `[&_img]` size editing (the icon-sizing payoff)
Files: `tw-tokens.ts`, `live-css.ts`, `inspector.tsx`, `cva-controls.tsx`, `src/examples/…`.
- **Tokenizer:** widen `PREFIX_RE` to one level of nesting:
  `/^((?:[a-zA-Z0-9-]+:|\[(?:[^\[\]]|\[[^\]]*\])*\]:)+)/`. Add a tokenizer test for
  `[&_svg:not([class*='size-'])]:size-4`.
- **live-css context resolution:** generalize `resolveState` (or add a sibling) so a `[&…]:` context
  becomes a descendant selector: bracket-content with `&` → `[data-slot="X"]` and `_` → space, e.g.
  `[&_svg:not([class*='size-'])]:` → `[data-slot="item-media"] svg:not([class*='size-'])`. Keep `[a]:`
  as its special element-is-anchor case (`a[data-slot="X"]`).
- **`declFor`:** map size utilities → dimensions — `size-N` → `width` + `height` (`N*0.25rem`),
  `w-N`/`h-N` → one axis, `size-full` → `100%`.
- **Inspector:** add a Size control (a `SelectField` of `size-4/5/6/8/10`, or a number field) driven by a
  `sizeMatch` + `applyUtility`.
- **cva-controls:** detect `[&_svg]` / `[&_img]` in the ACTIVE cva (base + variants) and add context
  targets (label e.g. `icon size`), with the inspector `context` = the exact source prefix (so
  `applyUtility` edits the real class, e.g. `[&_svg:not([class*='size-'])]:size-4`).
- **Example:** an item with an icon in the media (the `icon` media variant) for the svg context.
- (Optional, same machinery: `[&>a]` nested links in `ItemDescription` — needs text-decoration/color
  decls in `declFor`. Lower priority.)

### Step 4 — Verify + land
- `bun run check` green after each step.
- Playwright (reuse `/tmp/wb-*.mjs` pattern; `playwright-core` + Chrome are available). Start
  `bun run dev:web` (API on :3000; web auto-picks a port — confirm it's *this* worktree; foreign apps
  may hold `517x`). Screenshot: item → `variant · icon` (media group) renders + edits; the `icon size`
  context changes the rendered icon live; `link (a)` still works; button/badge/tabs unregressed.

## Non-goals / decided
- **No global anchor surface** — per-component only (user decision). The main-dropdown global `[a]`
  idea was dropped.
- Portal/overlay components are out of scope here (see the rollout playbook's Recipe B).
