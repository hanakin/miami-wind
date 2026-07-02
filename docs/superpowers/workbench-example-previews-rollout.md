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

## How to read this playbook (READ THIS FIRST — it prevents the main mistake)

**`item` and `separator` are worked examples, not templates.** There is **no single coverage shape to copy**.
Every component's demo set is **derived**, per component, from two inputs:

1. **The real shadcn demos** that component actually ships (its own demos, its own copy, its own structure).
2. **That component's full requirement set** — everything the editor must let you filter/edit: every
   `data-slot`, every option of **every** cva it defines (a component can have more than one), and every
   pass-through context in its source (`[a]`, `[&_svg]`, `[&_img]`).

The **rules** below (the WORKFLOW section) are general and apply to every component. `item`'s file set
(`item.tsx`, `item-group.tsx`, `item-header.tsx`, `item-link.tsx`, `item-size.tsx`) is **what those rules
produced for one component with one particular requirement set** — not a mold to stamp onto the next
component. A component with no media slot has no image demo; a component with five variants and no slots
looks nothing like item; `button` (many tiny variants, no slots, no `[a]`) will look nothing like it either.

So: **learn the rules and the derivation procedure, study item as an illustration of applying them, then
derive your component's own shape from its own demos + its own requirements.** Where this doc shows item's
specific files, that is "here is a decision item made and why," never "do exactly this."

## Read first (the reference implementation + spec)

Study these before touching anything:

- `docs/superpowers/workbench-demo-examples-architecture.md` — **the source-of-truth spec.** Two folders,
  glob scene, demo-per-file, filter override-or-derive, no maps. Follow it exactly.
- `workbench/src/components/demo-scene.tsx` — **generic; never edit per component.** Globs both folders,
  renders the demo section, computes the filter key, and does override-first / derive-from-demos.
- `workbench/src/components/demo/item/*.tsx` — the reference cva component, as a **worked example** (below).
- `workbench/src/components/demo/separator/separator.tsx` — the trivial (non-cva, single-demo) template:
  one real demo, one file, one named export. This is the whole job for a slot-only component with one demo.
- `workbench/src/components/examples/dropdown-menu/*` (built by this pass) — the first real **override**
  example: a force-open menu. The template for every portal component's overrides.

### `item` — worked example (yours will differ)

`item`'s requirement set: many slots (`item`, `item-media`, `item-content`, `item-title`,
`item-description`, `item-actions`, `item-header`, `item-footer`, `item-separator`, `item-group`); **two**
cvas (`itemVariants` = variant `default`/`outline`/`muted` + size `default`/`sm`/`xs`; `itemMediaVariants`
= variant `icon`/`image`); and contexts `[a]` (item-as-link), `[&_svg]` (icon size), `[&_img]` (image size).
Applying the rules to *that* set produced five demos. The table shows **where each requirement landed and
the decision behind it** — read it as reasoning, not as a shape to reproduce:

| Requirement | Where item covers it | The decision |
| --- | --- | --- |
| the component itself (canonical) | `item.tsx` — one `variant="outline"` Basic Item, **untouched** | RULE 0: the frontmost single instance is `<component>.tsx`, never altered. Its natural state already carries `outline` + default size, for free. |
| `default` variant | `item-group.tsx` — default items in a list | `default` has no visible border; it only reads **in context**, so it's shown inside the group, not as a lone item. |
| `muted` variant | `item-header.tsx` — one of three cards flipped to `variant="muted"` | No real demo showed `muted`, so **one** existing real item was flipped (a *variant flip*, the smallest legal alteration — never a new `*-variant` file). |
| size `default` / `sm` / `xs` | `default`→`item.tsx`, `sm`→`item-link.tsx`, `xs`→`item-size.tsx` | Sizes are **spread across demos** like variants. `sm` rode along on the link demo (with a one-line description added so the compact size reads). `xs` was the one size no demo carried, so it got a minimal single-item demo. |
| media `icon` variant + `[&_svg]` | `item-link.tsx` — `ItemMedia variant="icon"` with an `Icon` | The icon is part of a demo's media slot, never its own file. |
| media `image` variant + `[&_img]` | `item-group.tsx` — a group item with `ItemMedia variant="image"` + real `<img>` | The image rides on a real group item, never its own `*-image` file. |
| `[a]` link context | `item-link.tsx` — `<Item asChild><a href="#">…` | The link is an item **inside** a demo (asChild `<a>`), never a `*-link` file. |
| `item-footer` slot | `item-header.tsx` — each card's `ItemFooter` | Every slot needs a live instance somewhere; footer/separator/group are easy to forget. |
| `item-separator` / `item-group` slots | `item-group.tsx` — `ItemSeparator` between rows, `ItemGroup` wrapper | Covered by the one real "group" demo. |

**What is deliberately absent:** no `item-icon`, `item-image`, `item-link-variant`, `item-variant` files;
the canonical `item.tsx` shows exactly **one** item (not a variant showcase). Each variant/context/size is
folded **into a real demo**, never given a dedicated file. **Your component's table will look different** —
you fill it in from *its* demos and *its* requirement set.

## Architecture you can rely on (don't rebuild it)

- **No registration. Glob, don't map.** `demo-scene.tsx` does
  `import.meta.glob("./demo/*/*.tsx", { eager: true })` and `("./examples/*/*.tsx", { eager: true })`,
  keyed by `component/file`. **Adding a demo = dropping a file** in `components/demo/<component>/`; adding
  an override = dropping a file in `components/examples/<component>/`. There is **no** `index.ts` to edit,
  and the four old maps (`examples`, `primaryExamples`, `variantExamples`, `contextExamples`) **do not
  exist**. Do not recreate them. Demos sort by filename, so the canonical `<component>.tsx` renders first.
- **`DemoScene` is already generic** — same signature as the old `ExamplePreview`
  (`{ name: string; sel: Selection }`), wired at `src/app/components.$name.tsx`. It auto-renders any
  component's demos and derives any filter. You do **not** edit it per component.

- **Order of operations — demos are authored and FINALIZED first; the filter layer is only a projection over
  them.** The filter view never invents, fetches, or synthesizes anything at filter time — it can only show
  what a finalized demo (or a sparse override) already renders. So the demos must **fully cover the
  requirement set before you look at a single filter**: every slot, every option of every cva, every
  context must already be on screen in some demo. Build and verify the demos first; only then does every
  filter resolve, because each one is just re-surfacing a piece of an already-complete demo. A filter that
  "doesn't resolve" is almost always a demo that didn't cover its requirement — fix the demo, not the filter.

- **How the filter resolves (for reference — you don't edit this).** Given the active `Selection`
  (`src/utils/editor-selection.ts`: `{ type:"cva"; target } | { type:"slot"; slot }`), the scene computes a
  **filter key** and resolves it:
  1. **Filter key** — a **slot** → the `data-slot` name (`item-title`); a **variant/size option**
     (`target.kind === "option"`) → `<axis>-<option>` (`variant-outline`, `size-sm`); a **context**
     (`target.kind === "context"`) → `context-<context>` (`context-a`, `context-icon`).
  2. **Override-first** — if `components/examples/<component>/<filterKey>.tsx` exists (from the glob), render
     that override.
  3. **Else derive from the finalized demos** — a **slot** extracts the **single default instance** of that
     `data-slot` (first occurrence across the demos, one instance); a **variant/context** renders the
     **whole demo that represents it** (the first demo whose output contains a matching
     `[data-variant="<opt>"]` / `[data-size="<opt>"]`, or for `context-a` an `<a data-slot=…>`) — a whole
     demo, because a lone transparent `default` item is meaningless and a link must be a real `<a>`.

- **cvas surface automatically — including multiple cvas per component.** The `live-cva` Vite plugin
  (`workbench/vite.config.ts` → `plugin/live-cva.ts`, runtime `workbench/src/utils/live-cva.ts`) rewrites
  each inline `cva(...)` into `__liveCva(...)`, seeding a store model **keyed by the cva's export symbol**.
  A component may define **more than one cva** (item: `itemVariants` **and** `itemMediaVariants`); the
  editor's "Editing" dropdown surfaces **each** cva's axes/options, grouped by cva, automatically once the
  component file loads (a demo imports it). Coverage obligation: **every option of every cva** must render
  in some demo. A secondary cva's option (e.g. media `image`) derives to whichever demo puts that option on
  its sub-part (item's group `<img>`); `slotForCva(symbol)` maps a cva's export to its slot
  (`itemMediaVariants` → `item-media`) so the option is placed/labeled on the right slot. You cover them;
  you do **not** touch the cva route / server.

- **Pass-through contexts are editable too — scan the whole component file for them.** Some styles apply
  through a wrapping element or a descendant rather than via a cva option; the editor exposes these as
  **contexts**, and each one present in the source is a coverage requirement with a demo obligation:
  - `[a]:` — the element becomes a link (`asChild <a>`); classes like `[a]:hover:bg-accent/50` fire only on
    the `<a>`. Requires a real `<a data-slot>` **inside a demo**. Editable **globally** (the `[a]` context
    is shared across components) **and** per component.
  - `[&_svg]:size-*` — sizes descendant icons; exposed as the **icon-size** context (value `icon`). Requires
    an icon in a demo. Per component.
  - `[&_img]:size-*` — sizes descendant images; exposed as the **image-size** context (value `image`).
    Requires an image in a demo. Per component.

  These bracket selectors live in the component's class strings, **not necessarily in a cva** — grep the
  whole `components/ui/<name>.tsx`, not just its `cva(...)` calls. Each present selector = a filter you must
  give a live element to. (This folds in the editor-engine behavior; there is no separate companion doc to
  chase.)

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

## Source of truth for shadcn demos AND the vendored primitive (verified)

No local copy exists. Fetch real source from `shadcn-ui/ui` with `gh` (returns clean raw `.tsx`;
`gh` is authed in this env). **Primary source = the radix style** (Miami Wind is radix-nova lineage). Two
things are fetched, from two dirs:

**1. The demos** — `apps/v4/examples/radix`:

```bash
# List every demo file for a component (radix style):
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<name>'
# Fetch one demo's raw source:
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>.tsx" -H "Accept: application/vnd.github.raw"
```

Fallback dir if a demo is missing from `radix/`: `apps/v4/registry/new-york-v4/examples/<name>-demo.tsx`.

**2. The vendored primitive's STYLE source** — `apps/v4/styles/radix-nova/ui` (Miami Wind = radix-nova):

```bash
# Fetch the primitive's radix-nova style source (the authoritative markup + classes + cva):
gh api "repos/shadcn-ui/ui/contents/apps/v4/styles/radix-nova/ui/<name>.tsx" -H "Accept: application/vnd.github.raw"
```

**The vendored primitive `workbench/src/components/ui/<name>.tsx` MUST match this radix-nova style source
byte-faithfully.** No invented classes, no drift. Two concrete drift bugs to guard against:
- The item media `icon` variant must **NOT** add a background box or border — radix-nova's `icon` media has
  no bg/border; adding one is a drift bug.
- The cva **must include every size** the style source defines. If the style source has an `xs` size, the
  vendored cva must carry `xs` too, so **every size is selectable in the dropdown**. Sync every size from
  the component's shadcn style source — do not omit one.

Whenever a demo renders wrong, compare the vendored primitive against this style source first — a class the
primitive invented (or a size it dropped) is the usual cause.

**Mechanical swaps (required when porting a demo — otherwise the port is faithful):**
- `@/registry/new-york-v4/ui/<n>` and `@/components/ui/<n>` → `~/components/ui/<n>`.
- `lucide-react` icons → `@registry-ui/icon`: `<Icon icon="mdi:<best-guess>" className="size-…" />`. Icon
  choice does not matter — just use an icon; prefer `mdi:`. Never lucide, never bare `<svg>`.
- `next/image` → plain `<img>` (drop `fill` / `priority`; keep `width` / `height` / `className`).
- `export default function X()` → **named** `export function X()`. **One export per file.**
- Keep JSX structure, composition, and Tailwind classes as-is. `href="#"` is fine.

The `gh` source gives you the demo *code*; the **live docs page**
(`https://ui.shadcn.com/docs/components/<name>`) is the *visual truth* you verify against (see
VERIFICATION). Fetch **only** as many demos as the WORKFLOW rules require (the fewest that cover the
requirement set) — a port is faithful except for the bounded, ledgered incorporations rule 4 permits.

**Components with no stock shadcn demo** (author a faithful minimal demo from the component's own API +
requirement set instead — this is the *only* case where you build a demo that isn't a real shadcn port):
`button-group`, `input-group`, `native-select`, `combobox`, `spinner`, `chart`, `sonner`, `sidebar`,
`kbd`, `empty`, `field`. List the dir first; only author-from-scratch if truly absent.

## WORKFLOW — the demo-authoring RULES (hard rules, not guidance)

A prior attempt over-built this **and** hallucinated content: one file per shadcn example, dedicated
`*-icon` / `*-image` / `*-link` / `*-variant` files, multiple variants crammed into the canonical demo,
invented "from scratch" content, a dropped `xs` size, and a vendored primitive with invented classes (an
item-media `icon` bg box radix-nova doesn't have). **Those are the failure modes this section prevents.**

### The derivation procedure (do this per component)

1. **Enumerate the requirement set** from the component itself — not from item. Read
   `components/ui/<name>.tsx` and list: (a) **every `data-slot`**; (b) **every axis+option of every cva** it
   defines (there may be more than one cva); (c) **every pass-through context** in its class strings (`[a]`,
   `[&_svg]`, `[&_img]` — grep the whole file). This list is the coverage target. Everything below serves it.
2. **Fetch the component's real shadcn demos** and pick the **FEWEST** that together already cover the most
   of that set (rule 1).
3. **Set the canonical demo** = the component's frontmost single instance = `<component>.tsx`, untouched
   (RULE 0).
4. **Fold every still-uncovered requirement into a chosen real demo** — never a dedicated file (rule 3),
   using only the bounded alterations of rule 4.
5. **Confirm the demos fully cover the set** *before* touching filters (order of operations, above), then
   verify every filter resolves (VERIFICATION).

### The rules

**RULE 0 — the canonical demo is sacred; never touch it.** The component's **frontmost singular version** —
its simplest single instance straight from shadcn's demo (for `item`: the one `variant="outline"` Basic
Item) — lives in `components/demo/<component>/<component>.tsx` (**same name as the component**, so it sorts
first and reads as *the* component). It MUST remain **untouched**: never flip its variant, resize it, add to
it, or restructure it to satisfy a filter. ALL coverage of other variants, sizes, contexts, and the
remaining slots goes in the OTHER demos.

1. **CONSOLIDATE to the FEWEST demos that cover the requirement set. This is the prime directive.** Pick the
   smallest set of real shadcn demos that, together, put every `data-slot`, every cva option, and every
   context on screen at least once. **Do NOT create one file per shadcn example** — the docs page lists many;
   you port only as many as coverage needs (plus, at most, one minimal demo for a single requirement that
   truly can't be folded — see rule 5). If two demos cover the same requirements, keep one. Bias hard toward
   the minimum: a typical non-portal component is **1–3 demo files**, not seven.

2. **Port real shadcn demos — never invent, never "author from scratch," never "simplify."** Every demo is a
   faithful port of an actual demo from the component's shadcn docs (minus the mechanical swaps, plus only
   the bounded incorporations of rule 4). Do not compose your own example, fabricate copy, or trim content.
   If the docs show it, port it; if they don't, it doesn't exist for this pass. (Exception — a
   genuinely stock-demo-less component from the explicit list in "Source of truth": there, and only there,
   build a faithful minimal demo from the component's own API + requirement set.)

3. **No dedicated per-feature files — fold coverage INTO the demos.** Icons, images, links, and each variant
   are covered **inside** a demo, not in their own file. An icon is part of a demo's media slot; the media
   `image` variant is a real `<img>` on a real item in a demo; a link is an `asChild <a>` item inside a demo;
   a variant renders on an item inside a demo. Creating `<name>-icon.tsx` / `<name>-image.tsx` /
   `<name>-link.tsx` / `<name>-variant.tsx` is **forbidden** — those duplicate what a demo already renders,
   and the scene derives the icon/image slot, `context-a`, and each `variant-*` **from the demos**.
   - **This does NOT mean "assume it's already there."** Real demos won't always exercise every variant,
     context, or slot you need — `button`, for instance, may not naturally show every variant, and item's
     `muted` appeared in no demo. When a requirement isn't naturally present, you **incorporate it into an
     existing demo** via rule 4 (e.g. flipping one item to `muted`) — you do **not** skip it, and you do
     **not** spawn a dedicated file for it. Fold in, never file-per-feature.
   - **The canonical demo shows exactly ONE instance** (RULE 0) — never a multi-variant showcase.

4. **The only permitted alterations to a ported demo are the minimal incorporations needed to make a
   required filter both PRESENT and LEGIBLE — and each must be ledgered.** Concretely, only these, and only
   when a real demo doesn't naturally satisfy the requirement:
   - **a variant flip** — change one existing real item's `variant` to the value a filter needs (item's
     `muted` on one header card);
   - **an applied size** — set `size` on an existing item so a `size-*` filter derives (item's `sm` on the
     link item);
   - **a minimal legibility incorporation** — the smallest tweak that makes the folded coverage readable
     (item-link's one added description line so the compact `sm` size reads clearly).

   All three go into a **non-canonical** demo (RULE 0 keeps `<component>.tsx` untouched), are the **smallest
   change that works**, and are **recorded in the sanctioned-alterations ledger** (VERIFICATION E). Anything
   beyond them — adding invented items, changing copy, restructuring, fabricating a context — is forbidden.
   This is the "not 100% verbatim" carve-out: a demo is faithful to shadcn *except* for these ledgered,
   minimal incorporations.

5. **`size` is covered like variants — spread across the demos, minimal extra demo only for a size that
   can't be folded.** Prefer to render each size on an item that already exists in a demo (item: `default`
   rides the canonical, `sm` rides the link). Only when a size genuinely can't be folded into any existing
   demo do you add **one** minimal single-item demo for it (item's `xs`). Do **not** default to a per-size
   demo, and do **not** build a size *showcase*. The **vendored component cva MUST include every size** —
   sync each from the radix-nova **style source** (`apps/v4/styles/radix-nova/ui/<name>.tsx`) so **every
   size is selectable in the dropdown** and its `[data-size=…]` derives. A dropped size = a size filter that
   can't resolve = a defect.

6. **One concern per demo file, ONE named export.** No synthetic / parameterized components (no
   `ItemPrimary`), no multi-export files. If a filter needs a shape no real demo can show even after rule-4
   folding, that is an `examples/` **override file** — not an extra export and not an invented demo.

7. **EVERY requirement gets a live example — walk the list, don't eyeball it.** Every `data-slot` (easy to
   forget: `footer`, `media`, `separator`, `group`), every option of every cva, and every context must
   appear in at least one demo. A requirement with no live example anywhere is a **defect** — fold it into a
   demo (rule 4) before the component is done.

8. **Every entry in the "Editing" dropdown MUST resolve to a real demo (or a sanctioned override) — verify
   each.** After authoring, walk the dropdown: **each slot, each option of each cva (incl. every size, incl.
   `xs`), each context** must pull the correct real demo/override — never "Not present," never empty, never
   the wrong demo, never a synthetic fallback. Any such entry is a defect to fix before the component is done.

**Corollaries (still rules):**
- **Slot view = exactly one instance** — the canonical default use. The scene extracts the first occurrence
  of the `data-slot`; ensure that first occurrence is the slot's canonical use. Applies to **every** slot.
- **Every cva option must emit its `[data-variant=…]` / `[data-size=…]` in some demo** so derivation finds
  it. An option that reads as "nothing" on a lone instance (a transparent `default`) is fine **only if** a
  real demo renders it in context (inside a group). Cover it with a rule-4 fold, never a dedicated file,
  never a multi-variant canonical demo.
- **A pass-through context ⇒ a real element in a demo:** `[a]` → a real `asChild <a data-slot>`; `[&_svg]` →
  an icon; `[&_img]` → a real `<img>`. Inside a demo — never a `*-link` / `*-icon` / `*-image` file.
- **Icons render through our `Icon`** (iconify `mdi:` or `type="custom"` SVG). Never lucide, never bare
  `<svg>`.
- **Don't port RTL or size-*showcase* demos.** Direction and size-galleries aren't coverage requirements;
  sizes are covered per rule 5. (This is about not adding showcase files, not a checklist of things to hunt.)

## `examples/` overrides — when a demo isn't enough (per component)

`components/examples/<component>/<filterKey>.tsx` is a **forced-render OVERRIDE** for a filter the demos
can't serve even after rule-4 folding. It is **sparse** — author one only when derivation genuinely fails.
The scene checks this folder **first** (override-first), keyed by the exact filter key.

- **Portal / overlay components (the main use).** Their editable slots live in hidden surfaces (menu
  content, dialog body). The demo shows the closed trigger; the **content slots** need a **force-open /
  exploded** render so `dropdown-menu-content`, `dropdown-menu-item`, … are in the DOM and reachable. Author
  `components/examples/<component>/<contentSlot>.tsx` (and any inner-slot keys) as an open surface redirected
  into `[data-preview]` — this **absorbs the role of the old `open-renders.tsx`**. The **trigger** slot
  still reuses the demo (no override). Model these on the old `openRenders` entry for the component, then
  delete that `openRenders` entry.
- **An option/context a demo can't naturally show even after folding.** Rare for non-portal components. If a
  cva option or context has no representing demo and can't get one cleanly via rule 4, add
  `components/examples/<component>/<axis>-<option>.tsx` or `context-<name>.tsx`.
- **Item needs NO overrides.** Item-in-a-menu is not an item context: `[a]:` fires only when item is an
  `<a>` (the link demo covers it); an item inside a dropdown is just item (asChild-wrapped) in a menu
  **container**, whose editable surface (cva + slots) is identical in or out of the menu. The menu and its
  forced-open render are the **dropdown-menu** component's concern.
- **Secondary-cva / context edge case.** If a component's second cva's options or a pass-through context
  don't yet surface in the dropdown at all (an engine gap, not a coverage gap), **note it** in the handoff —
  don't fake it with an override. Coverage overrides are for *renderable* filters the demos can't show, not
  for filters the editor doesn't yet expose.

## Per-component MULTI-AGENT pipeline (the required workflow)

Each component runs the following staged pipeline. The **orchestrator** owns every shared edit (deleting
legacy entries, wiring, biome, the vendored primitive), all verification, and all commits; **sub-agents own
only their isolated `components/demo/<component>/` and `components/examples/<component>/` files** and return
contents (they do not wire, delete legacy, or commit). Stages within a component are **sequential** (each
gates the next); you may run this whole pipeline for several *independent* components in parallel (distinct
folders → no conflict), but **serialize integration + `bun run check` + commits** — the full test run and
the git index race.

```
per component:
  0  derive the requirement set  (orchestrator: read components/ui/<name>.tsx — every data-slot,
     │                            every option of every cva, every [a]/[&_svg]/[&_img] context;
     │                            fetch + pick the FEWEST real shadcn demos that cover it)
     ▼
  ┌─ 1a demo-build agent  ─┐        (ports the chosen real demos; folds coverage IN per rule 4;
  │  (1b only if the       │         NO file-per-example, NO invented content,
  └─ 1b demo-build agent  ─┘         NO *-icon/*-image/*-link/*-variant files.)
            │  return demo files
            ▼
     2  demo-QC agent      (verifies demos vs the requirement set AND vs LIVE shadcn: fewest-files,
                            faithful content, no dedicated per-feature files, only ledgered rule-4
                            alterations, full slot/cva-option/size/context coverage, swaps, one-export)
            │  demos pass
            ▼   (trailing — only once demos are approved)
     3  example/override-build agent
            │  (authors the sparse components/examples/<component>/ overrides — force-open portals,
            │   any un-derivable option/context; returns override files + findings on the demos)
            ▼
     4  demo-fix agent     (applies fixes to the demos surfaced by stage 3's findings)
            ▼
     5  example-QC agent   (verifies the overrides: force-open surfaces expose content+inner slots
            │               in [data-preview]; each override filter key resolves override-first)
            ▼
     6  FINAL QC — orchestrator decision
        (sync vendored primitive to radix-nova style source; integrate: write files, delete this
         component's legacy previews/open-renders entry, biome override if first; bun run check;
         run the full VERIFICATION checklist; commit to main)
```

**Stage responsibilities:**

- **0 — derive (orchestrator).** Produce the requirement set (slots, every cva option, every context) and
  the chosen minimal real-demo list per the derivation procedure. This list, not item's shape, is what the
  sub-agents are told to cover.
- **1a / 1b — demo-build (up to two agents).** Port the chosen real demos into
  `components/demo/<component>/<demo>.tsx` with the swaps, one named export per file, faithful content plus
  only the rule-4 ledgered incorporations needed to cover the set. Because the set is usually **1–3 files**,
  most components need **only 1a**; use 1b only when the (still minimal) real-demo set is genuinely large
  enough to split, and split **by existing file** — never invent a demo to give 1b work. Each agent returns
  file paths + full contents + which requirements each demo covers + any alterations it made (for the
  ledger). Does **not** wire or commit.
- **2 — demo-QC (one agent).** Confirms **all WORKFLOW rules against this component's requirement set**: the
  set is the **fewest** demos covering it (flag/cut redundant files); **no dedicated `*-icon` / `*-image` /
  `*-link` / `*-variant` files**; the **canonical `<component>.tsx` is untouched and shows one instance**;
  every demo is a **faithful shadcn port** with **only ledgered rule-4 alterations** (each alteration is
  minimal and justified by a specific filter); **every requirement has a live example** — every slot (incl.
  `footer`/`media`/`separator`/`group`), every option of **every** cva, every context; **every size incl.
  `xs`** is covered and the vendored cva carries it; swaps applied (no lucide / `next/image` / `@/registry`);
  one named export per file. Also confirms **every dropdown filter resolves to a real demo** — none "Not
  present," no synthetic, no wrong demo — and the **dropdown lists every option of every cva**. Returns
  pass/fail + required fixes + the alterations ledger. **Demos must pass before stage 3 runs.**
- **3 — example/override-build (one agent, trailing).** Only after demos pass. Authors the **sparse**
  overrides (force-open portal content keyed by content + inner slots; any un-derivable option/context).
  Returns override files **plus a findings list** of demo problems it hit.
- **4 — demo-fix (one agent).** Applies stage-3 findings back onto the demo files (surgical edits). Returns
  updated demo contents + any new ledger entries.
- **5 — example-QC (one agent).** Verifies overrides: each force-open surface exposes its content slot + ≥1
  inner slot inside `[data-preview]`; each override filter key resolves override-first; the demos still
  cover everything after stage-4 edits. Returns pass/fail + fixes.
- **6 — final QC (orchestrator).** The integration + VERIFICATION + commit gate below. First sync the
  vendored primitive to its radix-nova style source (no invented classes; cva carries every size). Then run
  the full checklist. The orchestrator makes the ship/no-ship call; if any stage's fixes weren't applied, it
  loops the relevant stage rather than committing.

Non-portal components with no overrides still run the pipeline, but stages 3–5 are near-empty: stage 3
returns "no overrides needed", stage 4 is a no-op unless demo-QC deferred a fix, stage 5 confirms every
filter derives from a demo. Trivial components (`separator`) can run 0 + 1a + 2 + 6.

## Sub-agent prompts (templates)

Fill the `<…>` placeholders from **stage 0's requirement set for the specific component** — never from
item. Item's mapping is a worked example, not a value to paste in.

**Demo-build (stages 1a / 1b):**

> Author workbench **demo** files for **`<NAME>`** by porting shadcn's **real** radix demos — faithful,
> inventing nothing. Working dir: `<repo>/workbench`. Write to `src/components/demo/<NAME>/` **only**. Do
> NOT wire, delete legacy, or commit. Return each file's path + full contents + a per-demo coverage note +
> a list of any alterations you made (for the ledger).
>
> **Your demos (this agent):** `<SUBSET OF THE CHOSEN DEMO FILES>`.
> **Requirement set the full demo set must cover (every one needs a live example):**
> slots `<SLOT LIST — incl. footer/media/separator/group if present>`; cva options `<EVERY axis:option of
> EVERY cva, or "none">`; contexts `<[a] / [&_svg] / [&_img] as present, or "none">`.
> **Canonical demo:** `<NAME>.tsx` = the component's single frontmost instance, **untouched** (RULE 0).
>
> **HARD RULES:**
> - **Fewest files.** Author only as many demos as the requirement set needs. **No file-per-example.** If
>   two demos cover the same requirements, keep one.
> - **Faithful shadcn only.** Every demo is a port (minus the swaps). **Never invent copy, author from
>   scratch, or simplify.** (Exception: a truly stock-demo-less `<NAME>` from the playbook's list.)
> - **No dedicated `<NAME>-icon` / `<NAME>-image` / `<NAME>-link` / `<NAME>-variant` files.** Fold icons,
>   images, links, and variants **into** the demos.
> - **Fold uncovered requirements into a real demo via the ONLY permitted alterations:** a **variant flip**,
>   an **applied size**, or a **minimal legibility tweak** — smallest change that works, into a
>   **non-canonical** demo, and **list each one** you make. Nothing else may change.
> - **`size`:** spread each size across existing demos; add **one** minimal single-item demo only for a size
>   that can't be folded. If `<cva options>` lists a size (e.g. `xs`), some demo must emit its `[data-size]`.
> - **One concern per file, ONE named export.**
>
> **Source:** `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<NAME>'`,
> then `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>" -H "Accept: application/vnd.github.raw"`.
> Fallback: `apps/v4/registry/new-york-v4/examples/<NAME>-demo.tsx`.
>
> **Swaps:** `@/registry/new-york-v4/ui/<n>`→`~/components/ui/<n>`; `lucide-react`→`@registry-ui/icon`
> `<Icon icon="mdi:…" />` (any icon); `next/image`→`<img>`; `export default function`→**named**
> `export function`. Keep structure/classes verbatim. `href="#"` allowed. Don't port rtl/size-showcase demos.

**Example/override-build (stage 3):**

> Author the **sparse** `src/components/examples/<NAME>/` **override** files for **`<NAME>`** — ONLY filters
> the finalized demos can't serve. Working dir: `<repo>/workbench`. Do NOT touch `demo/`, wire, or commit.
> Return override files + a **findings list** of demo problems you hit.
>
> **The demos** (already built, in `src/components/demo/<NAME>/`): `<DEMO FILES>`.
> **Filter keys:** slot → `data-slot`; option → `<axis>-<option>`; context → `context-<ctx>`.
>
> **Portal/overlay `<NAME>`:** author a **force-open / exploded** render keyed by the content slot
> (`<content-slot>.tsx`) and any inner slots, redirected into `[data-preview]` so the hidden surface's slots
> are reachable (port the old `open-renders.tsx` entry for `<NAME>`). The trigger slot reuses the demo.
> **Non-portal:** add `<axis>-<option>.tsx` / `context-<ctx>.tsx` ONLY for an option/context no demo can
> represent even after a rule-4 fold. If every filter derives from a demo, return "no overrides needed".
>
> **Findings:** for each demo issue you relied on or hit (a missing `data-slot`, an option that doesn't emit
> `[data-variant]`/`[data-size]`, a wrong/absent `<a>` for `context-a`), report the file + exact fix.

## VERIFICATION (end-to-end, per component — the orchestrator runs this at stage 6)

Verification is a **checklist, not two spot-checks**. Gate first, then all of A–F; a component is not done
until every one passes. Two of them are visual (screenshots) because this user catches what code-only
reasoning misses — do not sign off on "close enough."

- **Gate — `cd workbench && bun run check`** (biome + `tsc` + vitest) must pass. Update
  `test/render-smoke.test.tsx` for the glob architecture:
  - the glob scene mounts and renders a component's demos (drop the old `examples`/`primaryExamples` index
    assertions — those maps are gone);
  - **every demo file mounts** without throwing (iterate the `import.meta.glob` result);
  - for a migrated component, **every filter resolves to a real demo or an override — never synthetic / "not
    present"** (assert slot extraction finds the slot; variant/context derive finds a demo);
  - for a migrated **portal**, its `examples/<component>/<contentSlot>.tsx` override exposes the content slot
    + ≥1 inner slot inside `[data-preview]`.
  - As legacy entries are deleted, delete their smoke cases too; when `previews`/`openRenders` are gone,
    delete those blocks.

- **(A) LIVE shadcn visual compare — screenshot the live docs, compare EVERY demo.** `goto
  https://ui.shadcn.com/docs/components/<name>` (playwright-core + Chrome are present; reuse the `/tmp/wb-*.mjs`
  pattern), screenshot **every** demo block, and put each side by side with the workbench port. Compare on
  four axes: **content** (same copy/items), **borders** (every border/fill/radius), **icon boxes** (media
  renders exactly as live — e.g. the item-media `icon` variant has **no** bg box on radix-nova), **spacing**
  (gaps/padding/alignment). **Carve-out for the ledgered alterations (E):** content is expected to differ
  *only* where the ledger says so (a variant flip, an applied size, the one added legibility line) — those
  are sanctioned, not defects. **Any other content difference, or any border/box/spacing mismatch, is a
  defect** — re-port the demo, or fix the vendored primitive against its style source, and re-compare. This
  is the check that exposes invented content (won't match live), redundant `*-icon/*-image/*-link/*-variant`
  files (no counterpart on the live page — delete them), and primitive drift (borders won't match).

- **(B) Workbench filter sweep — walk EVERY "Editing" dropdown entry, don't spot-check.** Start `bun run
  dev:web` (API on `:3000`; web auto-picks a free port — **confirm it's this worktree's**; foreign apps may
  hold `517x`). `goto /components/<name>`, screenshot the demo section (matches A), then open the dropdown
  and screenshot the resolved preview for **every** entry:
  - **every slot** (walk the full `data-slot` list, incl. `footer`/`media`/`separator`/`group`) → a
    one-instance preview (`from <label>`), never "Not present"/empty;
  - **every option of every cva** → its representing demo, on a shape where the border/fill actually reads;
  - **every size incl. `xs`** → via the sized item across demos / the one minimal size demo;
  - **every context** → `[a]` → a real `<a>`; `[&_svg]`/`[&_img]` where present → an icon/image;
  - for a **portal**, the force-open content + inner slots resolve via the `examples/` override.
  - **The dropdown itself must list every option of every cva.** Cross-check its axis entries against the
    vendored cva(s) — a missing size/variant means the cva sync or live-cva wiring is wrong; fix it (rule 5).
  - **Every entry MUST resolve to a correct demo/override — none "Not present," none empty, none wrong, none
    synthetic.** Any such entry is a defect — fix the demo/override (or its emission, or the cva sync) and
    re-screenshot.

- **(C) Vendored primitive vs radix-nova style source.** `components/ui/<name>.tsx` matches `gh api
  …/apps/v4/styles/radix-nova/ui/<name>.tsx` byte-faithfully: **no invented classes** (no item-media `icon`
  bg box), **cva carries every size** the style source defines (so every size is selectable, per B). A
  drifted primitive is an orchestrator fix (shared `components/ui/` file — never a sub-agent).

- **(D) Structural coverage audit (non-visual).** Cross-check the finalized demos against **stage 0's
  requirement set**: every `data-slot` from `readSlots` appears in a demo; every option of **every** cva
  emits its `[data-variant]`/`[data-size]`; every `[a]`/`[&_svg]`/`[&_img]` context has its live element;
  the set is the **fewest files** (no redundant demos, no dedicated `*-icon/*-image/*-link/*-variant`, the
  canonical demo untouched and single-instance). A gap here is a demo defect (fold it in), not a filter bug.

- **(E) Sanctioned-alterations ledger.** Enumerate **every** deviation of the demos from verbatim shadcn and
  confirm each is exactly one of the rule-4 incorporations — a variant flip, an applied size, or a minimal
  legibility tweak — made to cover a specific filter, and nothing more (no invented items, no restructure,
  no fabricated copy). An un-ledgered or non-sanctioned deviation is a defect. This ledger is what lets (A)
  distinguish an expected difference from a mis-port.

- **(F) Interaction states render (per `DESIGN.md`).** On the interactive demos, confirm hover / active /
  focus-visible (background/border shift, **no ring**) / disabled actually render, and that editing a
  variant or an `[a]`/`[&_svg]` context still **paints live** in the preview.

- **Done (per component):** Gate green · (A) live-docs compare clean (content/borders/icon-boxes/spacing
  match, minus the ledgered alterations) · (B) every dropdown entry resolves, dropdown lists every cva
  option · (C) primitive matches its style source · (D) requirement set fully covered by the fewest files ·
  (E) every deviation ledgered and sanctioned · (F) interaction states render · this component's legacy
  `previews`/`openRenders` entry **deleted** · committed to `main` (`feat: workbench demos for <name>` — one
  commit per component).

## Orchestration & conflict model

- **Orchestrator owns every shared edit + all verification + all commits.** Shared/global files:
  `demo-scene.tsx` (only if the generic scene needs a fix — normally untouched), `components/ui/<name>.tsx`
  (the vendored primitive — synced to its radix-nova style source at stage 6; never a sub-agent),
  `previews.tsx` / `open-renders.tsx` (legacy deletions), `biome.json` (folder override),
  `test/render-smoke.test.tsx`, the route. Sub-agents **never** touch these.
- **Sub-agents own only their `components/demo/<name>/` + `components/examples/<name>/` files.** Because each
  component's folders are distinct, parallel **authoring** across components has zero conflict.
- **There is no shared registration file** (the whole point of the glob) — dropping a demo/override file is
  the entire wiring. Nothing to serialize there.
- **Never branch** (repo rule): commit straight to `main`, one commit per component.
- **Do not run parallel `bun run check` or parallel commits** — the full test run + git index race. Fan out
  authoring in parallel; integrate + verify + delete-legacy + commit **serially, per component**.

**One-time global setup (orchestrator, at the start of this pass — confirm/complete what the reference pass
left):**
- The route imports `demo-scene`, not `example-preview`; `example-preview.tsx` is deleted. (If not, the
  reference pass is unfinished — finish it first.)
- `biome.json`'s `useValidAnchor` (`href="#"`) override covers `src/components/demo/**` +
  `src/components/examples/**` (repoint it off `src/examples/**`).
- `test/render-smoke.test.tsx` asserts the glob scene, per-demo mount, and filter-resolves-to-demo for the
  migrated set — not the deleted maps.
- `separator` (`components/demo/separator/separator.tsx`) is wired as the trivial template.

## Work-list (57 components; `item` ✅ and `separator` ✅ done via the reference pass — all others pending)

Legend: `*` = trivial (one minimal demo, non-cva) · `†` = no stock shadcn demo (author faithfully) ·
`(portal)` = needs `components/examples/<name>/` force-open overrides.

**Standard / non-portal (44).** cva components flagged; the rest are slot-only.
`accordion` · `alert` (cva variant) · `aspect-ratio`* · `avatar` · `badge` (cva variant) · `breadcrumb` ·
`button` (cva variant+size) · `button-group`† (cva orientation) · `calendar` · `card` · `carousel` ·
`chart`† · `checkbox` · `collapsible` · `empty`† (cva variant) · `field`† (cva orientation) · `form` ·
`input`* · `input-group`† (cva align) · `input-otp` · `item` ✅ (cva variant+size; two cvas incl. media;
incl. its `[a]` link context) · `kbd`† · `label`* · `native-select`† · `navigation-menu` · `pagination` ·
`progress` · `radio-group` · `resizable` · `scroll-area` · `separator`* ✅ · `sidebar`† · `skeleton`* ·
`slider` · `sonner`† · `spinner`*† · `switch` · `table` · `tabs` (cva orientation+variant) · `textarea`* ·
`toggle` (cva variant+size) · `toggle-group`.

**Portal / overlay (13) — need `components/examples/<name>/` force-open overrides.**
`alert-dialog` · `combobox`† · `command`† · `context-menu` · `dialog` · `dropdown-menu` · `drawer` ·
`hover-card` · `menubar` · `popover` · `select` · `sheet` · `tooltip`.
Their editable slots live in hidden surfaces — the demo shows the trigger; an `examples/<name>/` override
force-opens the content. None have cva variants, so there is no variant filter for them; the work is slot
coverage + the force-open override (porting the old `openRenders` entry, then deleting it).
