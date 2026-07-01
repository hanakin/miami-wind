# Workbench Example Previews — Component Rollout Playbook

## Context

The workbench's per-component editor should render **shadcn's real example previews**, ported to our
components/icons/theme — not self-authored approximations, which drift and mis-render. We proved the
pattern on **`item`** (branch `main`, commits `18f0a30`, `6bc1a98`, `1bf9df2`). This doc applies that
pattern to the remaining 56 components.

Per component the editor must show, in the right pane:
1. **Top:** shadcn's example set, ported faithfully, flex-wrapped and labeled (limits vertical space).
2. **On slot filter:** a **single** instance of the selected `data-slot` — the *default* use — extracted
   from those same examples, captioned `from <example>`.
3. **On variant/size filter:** the component's **primary** example re-rendered with that variant applied
   (works for stock, modified, and newly-added variants, since the option comes from the live cva model).

## Read first (the reference implementation)

Study these before touching anything — the rollout is "do what `item` does":
- `workbench/src/examples/item/item-demo.tsx` — `ItemDemo` **and** `ItemPrimary` (the canonical single
  instance; note it defaults to `variant="outline"` + `max-w-md`).
- `workbench/src/examples/item/{item-group,item-header}.tsx`.
- `workbench/src/examples/index.ts` — the `examples` and `primaryExamples` maps (static, hand-registered).
- `workbench/src/components/example-preview.tsx` — **generic; never edit per component.** Renders the top
  set, does single-instance slot extraction, and renders `primaryExamples[name]` with
  `selectionVariantProps(sel)` on a cva-option selection.
- `git show 18f0a30 6bc1a98 1bf9df2` — the three item commits.

## Architecture you can rely on (don't rebuild it)

- **Registration is static.** Add entries to `examples` (and `primaryExamples`) in
  `workbench/src/examples/index.ts`. `ExampleEntry = { name, label, Component }`. **No glob / generated
  index** — the user rejected that explicitly.
- **`ExamplePreview` is already generic** — it auto-renders any registered entry, extracts any slot,
  renders any primary. You do **not** edit it per component.
- **Variants are already filterable.** The `live-cva` Vite plugin (`workbench/vite.config.ts` →
  `plugin/live-cva.ts`, runtime `workbench/src/utils/live-cva.ts`) rewrites each component's inline
  `cva(...)` into `__liveCva(...)`, which seeds a model in the Zustand store keyed by export symbol. So a
  component's `variant`/`size` axes appear in the editor's "Editing" dropdown **automatically** once the
  component file loads (an example imports it). Your job is only to (a) cover them and (b) render them via
  the primary. Do **not** touch the cva route / server for this.
- **`custom-resolve`** (`plugin/custom-resolve.ts`): importing `~/components/ui/<name>` renders the
  registry override if one exists, else the vanilla primitive. Always import from `~/components/ui/<name>`.
- **Slots** are read from the component source by `readSlots` (AST) in
  `workbench/server/lib/tsx-slots.ts` (via `useComponentSlots` → `GET /api/components/:name`). To know a
  component's slots, just read `workbench/src/components/ui/<name>.tsx` and collect every `data-slot="…"`.
- **Nav needs nothing.** `ScopeSelect` in `workbench/src/app/__root.tsx` lists components independently.
- **biome:** `workbench/biome.json` already turns off `useValidAnchor` under `src/examples/**` (allows
  `href="#"`). Present — don't re-add.

## Source of truth for shadcn demos (verified)

No local copy exists. Fetch the real demo source from `shadcn-ui/ui` with `gh` (returns clean raw `.tsx`;
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
  choice does not matter — just use an icon; prefer `mdi:`.
- `next/image` → plain `<img>` (drop `fill`/`priority`; keep `width`/`height`/`className`).
- `export default function X()` → **named** `export function X()`.
- Keep JSX structure, composition, and Tailwind classes as-is. `href="#"` is fine.

**Components with no stock shadcn demo** (author a faithful minimal example from the component's own API +
slot list instead): `button-group`, `input-group`, `native-select`, `combobox`, `spinner`, `chart`,
`sonner`, `sidebar`, `kbd`, `empty`, `field`. List the dir first; only author-from-scratch if truly absent.

## Rules distilled from the `item` work (the user cared about each)

1. **Consolidate to the FEWEST examples that still cover every `data-slot`** (item went 11 demos → 3).
2. **Drop RTL and size-only-showcase demos** (e.g. `*-rtl`, `*-size`). Size is covered by the variant
   render, not a static demo.
3. **Slot view = exactly one instance** — the default use. `ExamplePreview` already picks the first
   occurrence; just make sure each slot's first occurrence is its canonical use.
4. **Every cva variant must be reachable.** No static example per option is required — the **primary
   render** covers them — but the demos should show at least the default, and the primary must exist.
5. **Size/variant legibility:** the primary must default to a **visible variant + a sensible `max-w-*`**
   (item uses `variant="outline"` + `max-w-md`). A size selection sets no `variant`, so without a visible
   default the padding box is invisible and the preview is full-bleed. This was an explicit fix.
6. **Icons:** our `Icon` (iconify `mdi:` or `type="custom"` SVG). Never lucide, never bare `<svg>`.
7. **Match shadcn** — do not "simplify" content into invented copy. Port the real demo.

## Recipe A — standard components (non-portal)

Per component:
1. **Read** `workbench/src/components/ui/<name>.tsx`: collect every `data-slot`, and read each inline
   `cva(...)` for its axes/options (or confirm none).
2. **Fetch** the component's demos from the radix dir; **choose the fewest** that together cover every
   `data-slot`. Drop rtl/size showcases.
3. **Create** `workbench/src/examples/<name>/<demo>.tsx` per chosen demo — named export, our imports/icons,
   faithful content.
4. **Author `<Name>Primary`** (in the demo file or `<name>-primary.tsx`) **only if the component has cva
   variants**: the canonical single instance, spreading `{...props}` onto the root element, defaulting to a
   **visible variant + `max-w-*`**. Cast props at that one boundary
   (`{...(props as ComponentProps<typeof X>)}`), mirroring `ItemPrimary`.
5. **Return** (do NOT edit `index.ts`, do NOT commit): the list of files + their full contents, plus the
   proposed `index.ts` entries (`examples["<name>"] = […]` and, if applicable,
   `primaryExamples["<name>"] = <Name>Primary`), and the full `data-slot` list with which example covers each.

**Coverage rule:** every `data-slot` appears in ≥1 example; cva axes are covered by the primary.

## Recipe B — portal / overlay components (LATER PHASE)

The 13 in `open-renders.tsx` (`alert-dialog, combobox, command, context-menu, dialog, dropdown-menu,
drawer, hover-card, menubar, popover, select, sheet, tooltip`). Their slots live in hidden surfaces and are
**already** redirected into `[data-preview]` by `workbench/src/components/open-renders.tsx`. None have cva
variants, so there is **no variant render** for them.

Recipe: port shadcn's demo (trigger + content), but ensure the editor shows the surface **open/exploded** so
slots are reachable — reuse/extend the component's `openRenders` entry rather than a closed trigger-only
demo. Verify with the existing `exploded surfaces render in-scope` test pattern in
`workbench/test/render-smoke.test.tsx` (add a case per portal component). Do this phase **after** Recipe A
is fully green — study `open-renders.tsx` before starting it.

## Orchestration & conflict model

- **Orchestrator (the fresh agent) owns every shared edit + all verification + all commits.**
  **Sub-agents own only their isolated `workbench/src/examples/<name>/` files.**
- **The only cross-component shared file is `workbench/src/examples/index.ts`.** Sub-agents must **never**
  touch it (or any global file). Because each sub-agent writes to a distinct dir, parallel *authoring* has
  zero conflict; *integration* is serialized by the orchestrator.
- **Never branch** (repo rule): commit straight to `main`, one commit per component.
- **Do not run parallel `bun run check` or parallel commits** — the full test run + git index race. Fan out
  authoring in parallel; integrate + verify + commit **serially**.

**One-time global setup (orchestrator, before the loop):**
- Relax the invariant in `workbench/test/render-smoke.test.tsx` ("every component with examples has a
  primary") to require a primary **only for cva components** — non-cva components legitimately have none.
  `ExamplePreview` already degrades gracefully when a primary is absent.
- Confirm the biome `src/examples/**` override is present (it is).

**Per-component loop (orchestrator):**
1. Spawn the sub-agent (template below) with the component's name, slot list, cva axes/options, and demo
   file list. (May fan out several at once.)
2. Write the returned files under `workbench/src/examples/<name>/`.
3. Register in `index.ts`: add the `examples[<name>]` entries (+ `primaryExamples[<name>]` if cva).
4. `cd workbench && bun run check` — fix anything (orchestrator owns global fixes).
5. **Verify visually** (see below). Fix drift vs shadcn.
6. Commit to `main`: `feat: shadcn example previews for <name>`.

## Per-component sub-agent prompt (template)

> Author the workbench example previews for the **`<NAME>`** component, matching shadcn's real demos.
> Working dir: `<repo>/workbench`.
>
> **Slots to cover (every one must appear in ≥1 example):** `<SLOT LIST>`.
> **cva variants (if any):** `<AXES/OPTIONS or "none">`.
>
> **Source:** fetch shadcn's demos with
> `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<NAME>'`, then
> `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>" -H "Accept: application/vnd.github.raw"`.
> Fallback: `apps/v4/registry/new-york-v4/examples/<NAME>-demo.tsx`. If no stock demo exists, author a
> faithful minimal example from the component's own API that still covers every slot.
>
> **Swaps:** `@/registry/new-york-v4/ui/<n>`→`~/components/ui/<n>`; `lucide-react`→`@registry-ui/icon`
> `<Icon icon="mdi:…" />` (any icon is fine); `next/image`→`<img>`; `export default function`→named
> `export function`. Keep structure/classes verbatim. `href="#"` allowed.
>
> **Consolidate to the fewest examples that cover every slot.** Drop rtl/size-showcase demos.
>
> **If the component has cva variants,** also export `<NAME>Primary(props: Record<string,string>)`: the
> canonical single instance, spreading `{...(props as ComponentProps<typeof <Root>>)}` onto the root,
> defaulting to a **visible variant + `max-w-*`** so a size filter renders a discernible box (see
> `ItemPrimary`).
>
> **Return, do NOT edit `index.ts` or commit:** each file's path + full contents; the proposed
> `examples["<NAME>"]` array and `primaryExamples["<NAME>"]` line; and a slot→example coverage map.

## Verification (end-to-end, per component)

- **Gate:** `cd workbench && bun run check` (biome + `tsc` + vitest) must pass. The `examples index` and
  `every preview mounts` tests auto-cover new entries.
- **Visual** (the user catches what code-only reasoning misses — screenshot, don't assume): reuse the
  playwright pattern from the item work. `playwright-core` + Chrome are available. Start `bun run dev:web`
  (API on `:3000`; web auto-picks a free port — the `517x` ports may be a foreign app, confirm the port is
  this worktree's). Script: goto `/components/<name>`, screenshot (a) default, (b) a `variant`/`size`
  filter, (c) a slot filter. Confirm: top matches shadcn; slot view shows **one** instance + `from <label>`;
  variant view shows the primary with the variant applied on a **bordered/filled** box.
- **Done when:** every `data-slot` covered · gate green · screenshots verified · committed to `main`.

## Work-list (57 components; `item` ✅ done)

**Recipe A — standard (44).** cva components flagged; the rest are slot-only.
`accordion` · `alert` (cva variant) · `aspect-ratio`* · `avatar` · `badge` (cva variant) · `breadcrumb` ·
`button` (cva variant+size) · `button-group`† (cva orientation) · `calendar` · `card` · `carousel` ·
`chart`† · `checkbox` · `collapsible` · `empty` (cva variant) · `field`† (cva orientation) · `form` ·
`input`* · `input-group`† (cva align) · `input-otp` · `kbd`† · `label`* · `native-select`† ·
`navigation-menu` · `pagination` · `progress` · `radio-group` · `resizable` · `scroll-area` · `separator`* ·
`sidebar`† · `skeleton`* · `slider` · `sonner`† · `spinner`*† · `switch` · `table` · `tabs` (cva
orientation+variant) · `textarea`* · `toggle` (cva variant+size) · `toggle-group`.
`*` = trivial (one minimal example) · `†` = no stock shadcn demo (author faithfully).

**Recipe B — portal/overlay (13, later phase).**
`alert-dialog` · `combobox`† · `command`† · `context-menu` · `dialog` · `dropdown-menu` · `drawer` ·
`hover-card` · `menubar` · `popover` · `select` · `sheet` · `tooltip`.
