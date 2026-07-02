# Workbench Demo/Examples — Component Rollout Playbook (later pass)

## Context

The workbench's per-component editor renders **shadcn's real demos**, ported to our components / icons /
theme — not self-authored approximations, which drift and mis-render. The architecture was **rebuilt**
(see `docs/superpowers/workbench-demo-examples-architecture.md`, the source of truth): the old
four-parallel-maps design (`examples`, `primaryExamples`, `variantExamples`, `contextExamples` in
`src/examples/index.ts`, plus synthetic `ItemPrimary` / `ItemLinkExample`) is **gone**. In its place:

- **`workbench/src/components/demo/<component>/<demo>.tsx`** — one proper shadcn demo per file, one concern
  per file, no multi-export / parameterized components.
- **`workbench/src/components/examples/<component>/<filterKey>.tsx`** — **override files only**, sparse: a
  forced/exploded render for a filter that can't just reuse a demo (e.g. a force-open dropdown so its
  hidden slots are reachable). Most components have none.
- **`workbench/src/components/demo-scene.tsx`** — a **glob-based** scene (`import.meta.glob`, **no index
  maps, no registration**) that renders the demos and derives every filter from them.

The reference pass proved this on **`item`** and **`separator`**. This doc is the **later pass**: port the
other ~55 components into `components/demo/` (+ sparse `components/examples/` overrides where a portal's
slots are otherwise unreachable), and **retire the legacy path** as each lands.

## Read first (the reference implementation + spec)

Study these before touching anything — the rollout is "do what `item` / `separator` now do":

- `docs/superpowers/workbench-demo-examples-architecture.md` — **the source-of-truth spec.** Two folders,
  glob scene, demo-per-file, filter override-or-derive, no maps. Follow it exactly.
- `workbench/src/components/demo/item/*.tsx` — the canonical demo set: `item-demo`, `item-group`,
  `item-header`, `item-icon`, `item-image`, `item-link`, `item-variant`. Each is one proper radix demo,
  one file, named export, our imports/icons. Together they cover every item `data-slot`, every
  `variant` / `size` option (size derives from the variant demo), and the `[a]` link context.
- `workbench/src/components/demo/separator/separator-demo.tsx` — the trivial (non-cva, single-demo)
  template.
- `workbench/src/components/demo-scene.tsx` — **generic; never edit per component.** Globs both folders,
  renders the demo section, computes the filter key, and does override-first / derive-from-demos.
- `workbench/src/components/examples/dropdown-menu/*` (built by this pass) — the first real
  **override** example: a force-open menu. The template for every portal component's overrides.
- **Companion plan:** `docs/superpowers/workbench-cva-context-editing.md` — the editor-engine work
  (surfacing every cva, editing `[a]` / `[&_svg]` / `[&_img]` contexts). Read it if a component has
  multiple cvas or pass-through context styles; its inspector / `resolveState` / target model are
  unchanged by this rebuild.

## Architecture you can rely on (don't rebuild it)

- **No registration. Glob, don't map.** `demo-scene.tsx` does
  `import.meta.glob("./demo/*/*.tsx", { eager: true })` and `("./examples/*/*.tsx", { eager: true })`,
  keyed by `component/file`. **Adding a demo = dropping a file** in `components/demo/<component>/`; adding
  an override = dropping a file in `components/examples/<component>/`. There is **no** `index.ts` to edit,
  and the four old maps (`examples`, `primaryExamples`, `variantExamples`, `contextExamples`) **do not
  exist**. Do not recreate them.
- **`DemoScene` is already generic** — same signature as the old `ExamplePreview`
  (`{ name: string; sel: Selection }`), wired at `src/app/components.$name.tsx`. It auto-renders any
  component's demos and derives any filter. You do **not** edit it per component.
- **The filter reuses the demos** (never invents or fetches at filter time). Given the active `Selection`,
  the scene computes a **filter key** and resolves it:
  1. **Filter key.** `Selection = { type:"cva"; target } | { type:"slot"; slot }` (`src/utils/editor-selection.ts`).
     - a **slot** → the `data-slot` name (e.g. `item-title`);
     - a **variant / size option** (`target.kind === "option"`) → `<axis>-<option>` (e.g. `variant-outline`, `size-sm`);
     - a **context** (`target.kind === "context"`) → `context-<context>` (e.g. `context-a`, `context-icon`).
  2. **Override-first.** If `components/examples/<component>/<filterKey>.tsx` exists (from the glob) →
     render that **override**.
  3. **Else derive from the demos:**
     - **Slot** → extract the **single default instance** of that `data-slot` (the DOM extraction already
       in the scene: first occurrence across the demos, one instance).
     - **Variant / context** → render the **whole demo that represents it**: the first `demo/<component>/*`
       whose rendered output contains a matching `[data-variant="<opt>"]` / `[data-size="<opt>"]`, or (for
       `context-a`) an `<a data-slot=…>`. Whole demo, not one instance — a lone transparent `default` item
       is meaningless; a link must be a real `<a>`.
- **Variants are still filterable automatically.** The `live-cva` Vite plugin (`workbench/vite.config.ts` →
  `plugin/live-cva.ts`, runtime `workbench/src/utils/live-cva.ts`) rewrites each component's inline
  `cva(...)` into `__liveCva(...)`, seeding a model in the Zustand store keyed by export symbol. A
  component's `variant` / `size` axes appear in the editor's "Editing" dropdown **automatically** once the
  component file loads (a demo imports it). Your job is only to (a) cover them in the demos and (b) let the
  scene derive the representing demo. Do **not** touch the cva route / server.
- **`custom-resolve`** (`plugin/custom-resolve.ts`): importing `~/components/ui/<name>` renders the
  registry override if one exists, else the vanilla primitive. Always import from `~/components/ui/<name>`.
- **Slots** are read from the component source by `readSlots` (AST) in `workbench/server/lib/tsx-slots.ts`
  (via `useComponentSlots` → `GET /api/components/:name`). To know a component's slots, read
  `workbench/src/components/ui/<name>.tsx` and collect every `data-slot="…"`.
- **Nav needs nothing.** `ScopeSelect` in `workbench/src/app/__root.tsx` lists components independently.
- **biome** already allows `href="#"` — the `useValidAnchor` override must cover the new demo/examples
  folders. If it still points at `src/examples/**`, repoint it to `src/components/demo/**` +
  `src/components/examples/**` as part of the first migration (orchestrator, one-time).

## Legacy path — DELETE it as you go (do not preserve)

Until this pass runs, the scene keeps a **transitional fallback** so the unported components still render:

- `workbench/src/components/previews.tsx` — `previews` (keyed by name) + `PreviewRender`: the old
  hand-authored, drift-prone previews.
- `workbench/src/components/open-renders.tsx` — `openRenders` / `OpenRender`: the 13 portal forced-open
  renders (`dropdown-menu`, `select`, `popover`, `dialog`, `alert-dialog`, `sheet`, `tooltip`,
  `hover-card`, `context-menu`, `menubar`, `command`, `combobox`, `drawer`).
- `workbench/src/components/example-preview.tsx` — the **old** scene; superseded by `demo-scene.tsx`.
  If it is still imported anywhere when this pass starts, the reference pass didn't finish deleting it —
  do so before migrating (route must import `demo-scene`, not `example-preview`).

**The later pass owns retiring all of this.** As each component migrates to `components/demo/`:

1. Delete that component's entry from `previews` (in `previews.tsx`) and, if it's a portal, from
   `openRenders` (in `open-renders.tsx`) — the scene now serves it from the glob, so the fallback entry is
   dead code.
2. When `previews` is empty, delete `previews.tsx` and the scene's `previews` fallback branch. When
   `openRenders` is empty, delete `open-renders.tsx` and the scene's `open-renders` fallback branch.
3. When both are gone, the scene has **no legacy branch left** — confirm `demo-scene.tsx` no longer
   imports `previews` / `open-renders`, and delete any lingering `example-preview.tsx`.

**Done state of the whole rollout:** `components/demo/` (+ sparse `components/examples/`) is the only
preview source; `previews.tsx`, `open-renders.tsx`, `example-preview.tsx`, and `src/examples/` are gone;
`demo-scene.tsx` has no fallback code.

## Source of truth for shadcn demos (verified)

No local copy exists. Fetch real demo source from `shadcn-ui/ui` with `gh` (returns clean raw `.tsx`;
`gh` is authed in this env). **Primary source = the radix style** (Miami Wind is radix-nova lineage):

```bash
# List every demo file for a component (radix style):
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<name>'
# Fetch one demo's raw source:
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>.tsx" -H "Accept: application/vnd.github.raw"
```

Fallback dir if a demo is missing from `radix/`: `apps/v4/registry/new-york-v4/examples/<name>-demo.tsx`.

**Mechanical swaps (required, verbatim otherwise):**
- `@/registry/new-york-v4/ui/<n>` and `@/components/ui/<n>` → `~/components/ui/<n>`.
- `lucide-react` icons → `@registry-ui/icon`: `<Icon icon="mdi:<best-guess>" className="size-…" />`. Icon
  choice does not matter — just use an icon; prefer `mdi:`. Never lucide, never bare `<svg>`.
- `next/image` → plain `<img>` (drop `fill` / `priority`; keep `width` / `height` / `className`).
- `export default function X()` → **named** `export function X()`. **One export per file.**
- Keep JSX structure, composition, and Tailwind classes as-is. `href="#"` is fine.

**Components with no stock shadcn demo** (author a faithful minimal demo from the component's own API +
slot list instead): `button-group`, `input-group`, `native-select`, `combobox`, `spinner`, `chart`,
`sonner`, `sidebar`, `kbd`, `empty`, `field`. List the dir first; only author-from-scratch if truly absent.

## Rules distilled from the `item` work (the user cared about each)

1. **One concern per demo file, ONE export.** No synthetic / parameterized components (no `ItemPrimary`),
   no multi-export files (`ItemPrimary` living inside `item-demo.tsx` is exactly what we removed). If a
   filter needs a shape a demo doesn't naturally show, that's an `examples/` **override file**, not an
   extra export.
2. **Cover every `data-slot` across the demo set, with as few demos as read well.** `item` uses seven
   focused demos so each slot, variant, and the `[a]` context resolves to a real demo. Prefer the shadcn
   demos that together span the slots; drop redundant ones. Don't collapse distinct concerns into one file
   just to cut count — the scene wants a *whole demo per variant/context* to derive from.
3. **Drop RTL and size-only-showcase demos** (e.g. `*-rtl`, `*-size`). **Size derives from the variant
   demo** — the scene reuses the demo carrying `[data-size="<opt>"]`; item covers `size` via `item-variant`
   / the size attributes its demos already emit, so no static `item-size.tsx` is needed.
4. **Slot view = exactly one instance** — the default use. The scene picks the first occurrence; make sure
   each slot's first occurrence across your demos is its canonical use.
5. **Every cva variant/context must resolve to a real demo (zero synthetic).** A variant that renders as
   "nothing" on a lone instance (item's transparent `default`) must be shown by a demo where it reads —
   e.g. inside a group. Ensure a demo emits the matching `[data-variant=…]` for **every** option, so the
   scene's derive step finds one. If none can, that option needs an `examples/` override.
6. **`[a]:` link context ⇒ a real `<a>` demo.** If any class carries `[a]:` (the whole element becomes a
   link — **scan the component file, not just the cva**), a demo must render an `asChild <a>` with
   `data-slot`, so `context-a` derives to it and `[a]:hover` is visible/editable (item: `item-link`,
   `item-demo`'s link row).
7. **Icons:** our `Icon` (iconify `mdi:` or `type="custom"` SVG). Never lucide, never bare `<svg>`.
8. **Match shadcn** — do not "simplify" content into invented copy. Port the real demo.

## `examples/` overrides — when a demo isn't enough (per component)

`components/examples/<component>/<filterKey>.tsx` is a **forced-render OVERRIDE** for a filter the demos
can't serve. It is **sparse** — author one only when derivation fails. The scene checks this folder
**first** (override-first), keyed by the exact filter key.

- **Portal / overlay components (the main use).** Their editable slots live in hidden surfaces
  (menu content, dialog body). The demo shows the closed trigger; the **content slots** need a
  **force-open / exploded** render so `dropdown-menu-content`, `dropdown-menu-item`, … are in the DOM and
  reachable. Author `components/examples/<component>/<contentSlot>.tsx` (and any inner-slot keys) as an
  open surface redirected into `[data-preview]` — this **absorbs the role of the old `open-renders.tsx`**.
  The **trigger** slot still reuses the demo (no override). Model these on the old `openRenders` entry for
  the component (port its open/exploded content into per-filter-key override files), then delete that
  `openRenders` entry.
- **A variant/context a demo can't naturally show.** Rare for non-portal components. If an option or
  context has no representing demo and can't get one cleanly, add
  `components/examples/<component>/<axis>-<option>.tsx` or `context-<name>.tsx`.
- **Item needs NO overrides.** Item-in-a-menu is not an item context: `[a]:` fires only when item is an
  `<a>` (the link demo covers it); an item inside a dropdown is just item (asChild-wrapped) in a menu
  **container**, whose editable surface (cva + slots) is identical in or out of the menu. The menu and its
  forced-open render are the **dropdown-menu** component's concern — that override lives in
  `components/examples/dropdown-menu/`.
- **Multi-cva / `[&_svg]` / `[&_img]` sizing.** Components with a second cva (item: `itemMediaVariants`;
  tabs: `tabsListVariants`) or icon/image sizing (`[&_svg]`, `[&_img]`) rely on the engine work in
  `workbench-cva-context-editing.md`. The scene keys variant derivation by `symbol` (the owning cva's
  export name) so a media-cva option resolves to the demo that puts the variant on the sub-part (item:
  `item-icon` / `item-image`), not the root. If a component's secondary-cva variants don't yet appear in
  the dropdown, note it — don't fight it; it's engine-track work.

## Per-component MULTI-AGENT pipeline (the required workflow)

Each component runs the following staged pipeline. The **orchestrator** owns every shared edit (deleting
legacy entries, wiring, biome), all verification, and all commits; **sub-agents own only their isolated
`components/demo/<component>/` and `components/examples/<component>/` files** and return contents (they do
not wire, delete legacy, or commit). Stages within a component are **sequential** (each gates the next);
you may run this whole pipeline for several *independent* components in parallel (distinct folders → no
conflict), but **serialize integration + `bun run check` + commits** — the full test run and the git index
race.

```
per component:
  ┌─ 1a demo-build agent  ─┐
  │  (subset of demos)     │           → (parallel authoring)
  └─ 1b demo-build agent  ─┘
            │  both return demo files
            ▼
     2  demo-QC agent      (verifies demos vs shadcn: coverage, swaps, one-export, renders)
            │  demos pass
            ▼   (trailing — only once demos are approved)
     3  example/override-build agent
            │  (authors the sparse components/examples/<component>/ overrides — force-open portals,
            │   any un-derivable variant/context; returns override files + findings on the demos)
            ▼
     4  demo-fix agent     (applies fixes to the demos surfaced by stage 3's findings —
            │               e.g. a demo missing a data-slot the override exposed, a variant that
            │               didn't emit [data-variant], an [a] demo the override proved wrong)
            ▼
     5  example-QC agent   (verifies the overrides: force-open surfaces expose content+inner slots
            │               in [data-preview]; each filter key resolves override-first correctly)
            ▼
     6  FINAL QC — orchestrator decision
        (integrate: write files, delete this component's legacy previews/open-renders entry, biome
         override if first; bun run check; playwright screenshots per Verification; commit to main)
```

**Stage responsibilities:**

- **1a / 1b — demo-build (two agents, parallel).** Split the component's demo list between them (e.g. by
  file). Each ports its `components/demo/<component>/<demo>.tsx` from `gh api …/apps/v4/examples/radix/…`
  with the swaps, one export per file. Returns file paths + full contents + which slots/variants/contexts
  each demo covers. Does **not** wire or commit.
- **2 — demo-QC (one agent).** Confirms: every `data-slot` covered ≥1 demo; every cva option has a demo
  emitting its `[data-variant=…]`/`[data-size=…]`; `[a]:` (if present in the component file) has a real
  `<a data-slot>` demo; swaps applied (no lucide / `next/image` / `@/registry`); one named export per file;
  content matches shadcn (no invented copy). Returns pass/fail + required fixes. **Demos must pass before
  stage 3 runs** (the overrides trail the demos).
- **3 — example/override-build (one agent, trailing).** Only after demos pass. Authors the **sparse**
  `components/examples/<component>/<filterKey>.tsx` overrides: for portals, the force-open/exploded content
  keyed by content slot + inner slots (porting the old `openRenders` shape); for any un-derivable
  variant/context, a `<axis>-<option>.tsx` / `context-<name>.tsx`. Returns override files **plus a
  findings list** of demo problems it hit (missing slots, mis-emitted variants).
- **4 — demo-fix (one agent).** Applies stage-3 findings back onto the demo files (surgical edits to
  `components/demo/<component>/`). Returns the updated demo contents.
- **5 — example-QC (one agent).** Verifies overrides: each force-open surface exposes its content slot +
  ≥1 inner slot inside `[data-preview]`; each filter key that has an override resolves override-first; the
  demos still cover everything after stage-4 edits. Returns pass/fail + fixes.
- **6 — final QC (orchestrator).** The integration + verification + commit gate below. The orchestrator
  makes the final ship/no-ship call; if any stage's fixes weren't applied, it loops the relevant stage
  rather than committing.

Non-portal components with no overrides still run the pipeline, but stages 3–5 are near-empty: stage 3
returns "no overrides needed", stage 4 is a no-op unless demo-QC deferred a fix, stage 5 confirms every
filter derives from a demo (no override, no synthetic). Trivial components (`separator`) can run 1a alone
+ 2 + 6.

## Sub-agent prompts (templates)

**Demo-build (stages 1a / 1b):**

> Author workbench **demo** files for **`<NAME>`**, matching shadcn's real radix demos.
> Working dir: `<repo>/workbench`. Write to `src/components/demo/<NAME>/` **only**. Do NOT wire, delete
> legacy, or commit. Return each file's path + full contents + a slot/variant/context coverage note.
>
> **Your demos (this agent):** `<SUBSET OF DEMO FILES>`.
> **Slots the full set must cover:** `<SLOT LIST>`. **cva axes/options:** `<AXES/OPTIONS or "none">`.
> **`[a]:` in the component file?** `<yes → needs a real asChild <a> demo / no>`.
>
> **Source:** `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<NAME>'`,
> then `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>" -H "Accept: application/vnd.github.raw"`.
> Fallback: `apps/v4/registry/new-york-v4/examples/<NAME>-demo.tsx`. If no stock demo exists, author a
> faithful minimal demo from the component's own API covering your slots.
>
> **Swaps:** `@/registry/new-york-v4/ui/<n>`→`~/components/ui/<n>`; `lucide-react`→`@registry-ui/icon`
> `<Icon icon="mdi:…" />` (any icon); `next/image`→`<img>`; `export default function`→**named**
> `export function`. **One export per file, one concern per file** — NO synthetic/parameterized components,
> NO multi-export files. Keep structure/classes verbatim. `href="#"` allowed. Drop rtl / size-showcase
> demos (size derives from the variant demo).

**Example/override-build (stage 3):**

> Author the **sparse** `src/components/examples/<NAME>/` **override** files for **`<NAME>`** — ONLY filters
> the finalized demos can't serve. Working dir: `<repo>/workbench`. Do NOT touch `demo/`, wire, or commit.
> Return override files + a **findings list** of demo problems you hit.
>
> **The demos** (already built, in `src/components/demo/<NAME>/`): `<DEMO FILES>`.
> **Filter keys:** slot → `data-slot`; option → `<axis>-<option>`; context → `context-<ctx>`.
>
> **Portal/overlay `<NAME>`:** author a **force-open / exploded** render keyed by the content slot
> (`<content-slot>.tsx`) and any inner slots, redirected into `[data-preview]` so the hidden surface's
> slots are reachable (port the old `open-renders.tsx` entry for `<NAME>` into these files). The trigger
> slot reuses the demo — no override for it.
> **Non-portal:** add `<axis>-<option>.tsx` / `context-<ctx>.tsx` ONLY for an option/context no demo can
> naturally represent. If every filter derives from a demo, return "no overrides needed".
>
> **Findings:** for each demo issue you relied on or hit (a missing `data-slot`, a variant that doesn't
> emit `[data-variant]`, a wrong/absent `<a>` for `context-a`), report the file + the exact fix so the
> demo-fix agent can apply it.

## Verification (end-to-end, per component — the orchestrator runs this at stage 6)

- **Gate:** `cd workbench && bun run check` (biome + `tsc` + vitest) must pass. Update
  `test/render-smoke.test.tsx` for the glob architecture:
  - the glob scene mounts and renders a component's demos (replace the old `examples`/`primaryExamples`
    index assertions — those maps are gone);
  - **every demo file mounts** without throwing (iterate the `import.meta.glob` result, mirror the old
    "every preview mounts" guard);
  - for a migrated component, **every filter resolves to a real demo or an override — never synthetic /
    "not present"** (assert the slot extraction finds the slot, the variant/context derive finds a demo);
  - for a migrated **portal**, its `examples/<component>/<contentSlot>.tsx` override exposes the content
    slot + ≥1 inner slot inside `[data-preview]` (reuse the old "exploded surfaces render in-scope"
    assertion, now pointed at the override file instead of `OpenRender`).
  - As legacy entries are deleted, delete their smoke cases too; when `previews` / `openRenders` are gone,
    delete the "every preview mounts" / `OpenRender` blocks.
- **Visual (required — the user catches what code-only reasoning misses):** playwright (`playwright-core` +
  Chrome present; reuse the `/tmp/wb-*.mjs` pattern). Start `bun run dev:web` (API on `:3000`; web
  auto-picks a free port — **confirm it's this worktree's**; foreign apps may hold `517x`). Script: goto
  `/components/<name>`, screenshot (a) the **demo section** renders all demos and matches shadcn; (b) each
  **filter** resolves to the right real demo / override — every slot (one instance + `from <label>`), each
  variant (its representing demo on a bordered/filled shape), `size·sm`, `context-a`/link (a real `<a>`),
  and for a portal the force-open content; (c) editing a variant and an `[a]` / `[&_svg]` context still
  paints live.
- **Done (per component):** every `data-slot` covered by a demo · every filter resolves to a demo or
  override (zero synthetic) · portals expose content+inner slots via an `examples/` override · this
  component's legacy `previews` / `openRenders` entry **deleted** · gate green · screenshots verified ·
  committed to `main` (`feat: workbench demos for <name>` — one commit per component).

## Orchestration & conflict model

- **Orchestrator owns every shared edit + all verification + all commits.** Shared/global files:
  `demo-scene.tsx` (only if the generic scene needs a fix — normally untouched), `previews.tsx` /
  `open-renders.tsx` (legacy deletions), `biome.json` (folder override), `test/render-smoke.test.tsx`,
  the route. Sub-agents **never** touch these.
- **Sub-agents own only their `components/demo/<name>/` + `components/examples/<name>/` files.** Because
  each component's folders are distinct, parallel **authoring** across components has zero conflict.
- **There is no shared registration file** (the whole point of the glob) — dropping a demo/override file is
  the entire wiring. Nothing to serialize there.
- **Never branch** (repo rule): commit straight to `main`, one commit per component.
- **Do not run parallel `bun run check` or parallel commits** — the full test run + git index race. Fan out
  authoring in parallel; integrate + verify + delete-legacy + commit **serially, per component**.

**One-time global setup (orchestrator, at the start of this pass — confirm/complete what the reference
pass left):**
- The route imports `demo-scene`, not `example-preview`; `example-preview.tsx` is deleted. (If not, the
  reference pass is unfinished — finish it first.)
- `biome.json`'s `useValidAnchor` (`href="#"`) override covers `src/components/demo/**` +
  `src/components/examples/**` (repoint it off `src/examples/**`).
- `test/render-smoke.test.tsx` asserts the glob scene, per-demo mount, and filter-resolves-to-demo for the
  migrated set — not the deleted maps.
- `separator` (`components/demo/separator/separator-demo.tsx`) is wired as the trivial template.

## Work-list (57 components; `item` ✅ and `separator` ✅ done via the reference pass — all others pending)

Legend: `*` = trivial (one minimal demo, non-cva) · `†` = no stock shadcn demo (author faithfully) ·
`(portal)` = needs `components/examples/<name>/` force-open overrides.

**Standard / non-portal (44).** cva components flagged; the rest are slot-only.
`accordion` · `alert` (cva variant) · `aspect-ratio`* · `avatar` · `badge` (cva variant) · `breadcrumb` ·
`button` (cva variant+size) · `button-group`† (cva orientation) · `calendar` · `card` · `carousel` ·
`chart`† · `checkbox` · `collapsible` · `empty`† (cva variant) · `field`† (cva orientation) · `form` ·
`input`* · `input-group`† (cva align) · `input-otp` · `item` ✅ (cva variant+size; two cvas incl. media;
incl. its `[a]` link context) · `kbd`† · `label`* · `native-select`† · `navigation-menu` · `pagination` · `progress` · `radio-group` ·
`resizable` · `scroll-area` · `separator`* ✅ · `sidebar`† · `skeleton`* · `slider` · `sonner`† ·
`spinner`*† · `switch` · `table` · `tabs` (cva orientation+variant) · `textarea`* · `toggle` (cva
variant+size) · `toggle-group`.

**Portal / overlay (13) — need `components/examples/<name>/` force-open overrides.**
`alert-dialog` · `combobox`† · `command`† · `context-menu` · `dialog` · `dropdown-menu` · `drawer` ·
`hover-card` · `menubar` · `popover` · `select` · `sheet` · `tooltip`.
Their editable slots live in hidden surfaces — the demo shows the trigger; an `examples/<name>/` override
force-opens the content. None have cva variants, so there is no variant filter for them; the work is
slot coverage + the force-open override (porting the old `openRenders` entry, then deleting it).
