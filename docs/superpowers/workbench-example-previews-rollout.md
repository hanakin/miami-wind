# Workbench Demos & Overrides — Component Rollout Playbook (later pass)

## Context

The workbench's per-component editor renders **shadcn's real demos**, ported to our components / icons /
theme — not self-authored approximations, which drift and mis-render. The architecture was **rebuilt** (see
`docs/superpowers/workbench-demo-examples-architecture.md`, the architecture source of truth): the old
four-parallel-maps design (`examples`, `primaryExamples`, `variantExamples`, `contextExamples` in
`src/examples/index.ts`, plus synthetic `ItemPrimary` / `ItemLinkExample`) is **gone**. In its place, two
sibling folders under `workbench/src/components/`, loaded by a glob (no registration):

- **`demo/<component>/<demo>.tsx`** — one ported shadcn demo per file, one concern per file.
- **`examples/<component>/<filterKey>.tsx`** — sparse **override** files: a forced/exploded render for a
  filter that can't reuse a demo (e.g. a force-open dropdown so its hidden slots are reachable).
- **`demo-scene.tsx`** — the glob scene that renders the demos and derives every filter from them.

The reference pass proved this on **`item`** and **`separator`**. This doc is the **later pass**: port the
other ~55 components into `demo/` (+ sparse `examples/` overrides where a portal's slots are otherwise
unreachable), and **retire the legacy path** as each lands.

> **Division of authority:** the architecture spec above owns *the architecture* (two folders, glob scene,
> filter override-or-derive, no maps) — follow it. **This doc owns the demo-authoring rules and the
> rollout process.** Where the two ever disagree on how a demo is authored, this doc wins.

## Terminology (used precisely throughout)

| Term | Meaning |
| --- | --- |
| **demo** | A ported shadcn demo file in `components/demo/<component>/`. This doc never uses "example" to mean "demo." |
| **canonical demo** | The component's frontmost single instance, in `components/demo/<component>/<component>.tsx` (same name as the component, so it sorts first). Never altered — see RULE 0. |
| **override** | A forced-render file in `components/examples/<component>/`, named for the exact filter key it serves. Sparse; most components have none. |
| **filter** | One selectable entry in the editor's "Editing" dropdown: a slot, a cva option, or a context. |
| **filter key** | The string the scene resolves a filter by: a slot → its `data-slot`; a cva option → `<axis>-<option>` (e.g. `variant-outline`); a context → `context-<ctx>` (e.g. `context-a`). |
| **requirement set** | Everything a component's demos must cover: every `data-slot`, every option of **every** cva it defines, and every pass-through context (`[a]`, `[&_svg]`, `[&_img]`). |
| **cva axis / option** | A cva variant group (e.g. `variant`, `size`) is an **axis**; each value (e.g. `outline`, `sm`) is an **option**. |
| **worked example** | `item` / `separator` shown as an *illustration of applying the rules*, never a shape to copy. |

## Contents

1. **How to read this** — the one mistake to avoid + the shape of the work.
2. **Architecture** — what you rely on (act on it) and the engine internals (reference).
3. **Source of truth** — fetching real demos and the vendored primitive.
4. **The rules** — the derivation procedure + RULE 0 + rules 1–8.
5. **Worked example: `item`** — the rules applied to one component.
6. **`examples/` overrides** — the force-open pattern + the filename↔key contract.
7. **Before you start** — one-time global setup.
8. **Legacy path** — delete it per component as you go.
9. **The pipeline** — the per-component multi-agent workflow + sub-agent prompts.
10. **Verification** — Gate + checks A–F.
11. **Orchestration** + **Work-list**.

## How to read this — the one mistake to avoid

**`item` and `separator` are worked examples, not templates.** There is **no single coverage shape to
copy.** Every component's demo set is *derived* from two things: the real shadcn demos it ships, and its own
requirement set (its slots, the options of *its* cvas, *its* contexts). A component with no media slot has
no image demo; one with five variants and no slots looks nothing like item; `button` looks different again.

So: learn the rules and the derivation procedure (§4), study item as an illustration (§5), then derive your
component's own shape from its own demos + requirements. When this doc shows item's specific files, read it
as "a decision item made, and why" — never "do exactly this."

**The shape of the work (per component):** derive the requirement set → build the fewest real demos that
cover it (folding coverage in) → QC the demos → author sparse overrides only if a filter can't derive → fix
demos from override findings → QC overrides → orchestrator integrates, verifies, commits. The staged
pipeline in §9 is that shape; skim it now, execute it later.

## Architecture

### What you rely on (and act on)

- **Glob, don't map.** `demo-scene.tsx` globs both folders (`import.meta.glob("./demo/*/*.tsx",
  { eager: true })` and `("./examples/*/*.tsx", …)`), keyed by `component/file`. **Adding a demo or override
  = dropping a file** — there is no index to edit and the four old maps do not exist. Demos sort by
  filename, so the canonical demo (`<component>.tsx`) renders first.
- **`DemoScene` is generic** — signature `{ name, sel }`, wired at `src/app/components.$name.tsx`. Never
  edit it per component.
- **Import primitives from `~/components/ui/<name>`.** `custom-resolve` (`plugin/custom-resolve.ts`)
  redirects that to the **registry override** `registry/components/ui/<name>.tsx` if one exists, else the
  vanilla vendored primitive `src/components/ui/<name>.tsx`.
- **Registry overrides are the user's customization layer — they TRUMP and ADD to what the editor displays.**
  A registry **component** override (`registry/components/ui/<name>.tsx`) replaces the vendored primitive for
  rendering; a registry **cva** override (`registry/components/ui/cva/<name>.ts`, loaded via `/api/cva` →
  `loadOverrides`) overwrites the inline cva seed. Either can **add** variants/sizes/slots/contexts the
  baseline doesn't have, or restyle existing ones. The editor displays the **resolved** component (registry
  where present, else vendored), so that is what your demos must cover — a registry override that adds a
  variant means a demo must show it. Never "fix" a registry override to match radix-nova: it is intentional
  user customization and wins by design.
- **A component may define more than one cva.** `item` has `itemVariants` **and** `itemMediaVariants`. The
  editor surfaces **each** cva's axes/options, grouped by cva. Your obligation: **every option of every
  cva** renders in some demo.
- **Pass-through contexts are editable too — grep the whole component file for them,** not just its
  `cva(...)` calls. Each present bracket selector is a filter you must give a live element to:
  - `[a]:` — the element becomes a link (`asChild <a>`); `[a]:` classes fire only on the `<a>`. Needs a real
    `<a data-slot>` in a demo. Editable **globally** (the `[a]` context is shared) **and** per component.
  - `[&_svg]:size-*` — sizes descendant icons (the **icon** context). Needs an icon in a demo. Per component.
  - `[&_img]:size-*` — sizes descendant images (the **image** context). Needs an image in a demo. Per
    component.
- **Order of operations — finalize demos first; filters are only a projection.** A filter can only surface
  what a finalized demo (or override) already renders — it never invents or fetches at filter time. Cover
  the whole requirement set in the demos *before* touching any filter. If a filter "doesn't resolve," the
  demo didn't cover it — **fix the demo, not the filter.**
- **To find a component's slots:** read `components/ui/<name>.tsx` and collect every `data-slot="…"` (the
  server's `readSlots` AST in `server/lib/tsx-slots.ts` does the same for the dropdown).

### Engine internals (reference — you don't edit these)

- **How a filter resolves.** Given the `Selection` (`src/utils/editor-selection.ts`:
  `{ type:"cva"; target } | { type:"slot"; slot }`), the scene computes the filter key, then:
  1. **Override-first** — if `examples/<component>/<filterKey>.tsx` exists, render it (see §6 for the exact
     match rule).
  2. **Else derive from the finalized demos**, and note the **asymmetry**:
     - **A slot OR a `size` option → a single extracted instance.** The scene clones one element from the
       demos' DOM — a slot's first `[data-slot=…]`, or the one item at
       `[data-slot="<component>"][data-size="<option>"]` — and labels it `from <demo>`. So `size-sm` shows
       **only the small item**, not a whole demo.
     - **A `variant` option OR a context → the whole demo that represents it.** The first demo whose output
       contains `[data-variant="<option>"]` (variant), `a[data-slot="<component>"]` (context `a`), or
       `[data-variant="<ctx>"]` (context `icon`/`image`). Whole demo, because a lone transparent `default`
       is meaningless and a link must be a real `<a>`.
- **Icon/image contexts derive via `[data-variant]`, so they need a media cva.** `context-icon` matches
  `[data-variant="icon"]`; `context-image` matches `[data-variant="image"]`. These exist only where a
  **media cva** puts that variant on a sub-part (item's `ItemMedia variant="icon|image"`). A component whose
  `[&_svg]`/`[&_img]` is a bare descendant selector with **no** media cva (e.g. `button`'s `[&_svg]:size-4`)
  has no `[data-variant]` to match — that context **won't derive to a demo**. If it surfaces in the
  dropdown anyway, note it as an **engine gap** in the handoff; don't fake it with an override.
- **cvas surface automatically.** The `live-cva` plugin (`plugin/live-cva.ts`, runtime
  `src/utils/live-cva.ts`) rewrites each inline `cva(...)` into `__liveCva("<symbol>", …)`, seeding a store
  model keyed by the cva's export symbol; a demo importing the component loads it. `slotForCva(symbol)` (in
  `src/utils/live-css.ts`) maps a cva's export to its slot (`itemMediaVariants` → `item-media`) so a
  secondary-cva option is labeled on the right slot. You cover the options; you don't touch the cva route.

## Source of truth (fetching real source — verified)

No local copy exists. Fetch from `shadcn-ui/ui` with `gh` (returns clean raw `.tsx`; `gh` is authed here).
**Primary source = the radix style** (Miami Wind is radix-nova lineage). Two things, two dirs:

**1. The demos** — `apps/v4/examples/radix`:
```bash
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<name>'   # list
gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>.tsx" -H "Accept: application/vnd.github.raw"
```
Fallback if a demo is missing from `radix/`: `apps/v4/registry/new-york-v4/examples/<name>-demo.tsx`.

**2. The vendored primitive's STYLE source** — `apps/v4/styles/radix-nova/ui/<name>.tsx`:
```bash
gh api "repos/shadcn-ui/ui/contents/apps/v4/styles/radix-nova/ui/<name>.tsx" -H "Accept: application/vnd.github.raw"
```
**The vendored primitive `components/ui/<name>.tsx` MUST match this radix-nova style source
byte-faithfully** — no invented classes, no dropped options. Two drift bugs to guard against: (1) the item
media `icon` variant must add **no** bg box or border (radix-nova's has none); (2) the cva **must include
every size** the style source defines — a dropped size is a size filter that can't resolve. When a demo
renders wrong, compare the primitive to this style source first. (Verification C re-checks this.)

**Mechanical swaps (apply when porting a demo):**
- `@/registry/new-york-v4/ui/<n>` **and** `@/components/ui/<n>` → `~/components/ui/<n>`.
- `lucide-react` icons → `@registry-ui/icon`: `<Icon icon="mdi:<any>" />` (choice doesn't matter; prefer
  `mdi:`). Never lucide, never bare `<svg>`. **Don't hard-code a `size-…` on the icon when the component
  sizes icons via `[&_svg]`** — leave it unsized so the icon context paints live.
- `next/image` → plain `<img>` (drop `fill`/`priority`; keep `width`/`height`/`className`).
- `export default function X()` → **named** `export function X()`. One export per file.
- Otherwise keep JSX structure, composition, and Tailwind classes as they are — **except** the swaps above
  and the RULE 4 incorporations. `href="#"` is fine.

The `gh` source gives you the demo *code*; the **live docs page**
(`https://ui.shadcn.com/docs/components/<name>`) is the *visual truth* you verify against (Verification A).

**Components with no stock shadcn demo** (build a faithful minimal demo from the component's own API +
requirement set — the *only* case where a demo isn't a real port): the `†` set in the Work-list
(`button-group`, `input-group`, `native-select`, `combobox`, `spinner`, `chart`, `sonner`, `sidebar`,
`kbd`, `empty`, `field`). List the dir first; author-from-scratch only if truly absent, and trust the live
listing over the `†` marks if they ever disagree.

## The rules

### The derivation procedure (do this per component)

1. **Derive the requirement set from the EFFECTIVE (resolved) component** — the one the editor displays.
   Read the **registry override** `registry/components/ui/<name>.tsx` **and** cva override
   `registry/components/ui/cva/<name>.ts` first if they exist (they trump and can ADD to the baseline), else
   the vendored `src/components/ui/<name>.tsx`. List every `data-slot`, every axis+option of every cva, and
   every `[a]`/`[&_svg]`/`[&_img]` context (grep the whole file). Cover whatever the resolved component
   defines — a registry override's added variant/size/context is a requirement like any other. *Sync the
   vendored baseline to its radix-nova style source first* (Before-you-start / stage 0) so the baseline set
   is right; the registry override, by contrast, is authoritative as-is — don't reconcile it to radix-nova.
2. **Fetch and read the component's real shadcn demos.** Listing + fetching to *inspect* is cheap and
   encouraged; note which requirement each demo satisfies (which `data-variant`/`data-size`/slot/context it
   renders). You only *author* the minimal covering subset.
3. **Set the canonical demo** = the component's frontmost single instance = `<component>.tsx`, untouched
   (RULE 0).
4. **Pick the fewest demos that cover the set, and fold any still-uncovered requirement into one of them**
   via RULE 4 (at most **one** deviation per demo — rule 4). Precedence when a requirement has no home:
   **(1) fold it onto an existing non-canonical demo via a single RULE 4 alteration → (2) if no eligible demo
   can take it (none exists, or the only candidate already has its one deviation), port one more real shadcn
   demo that naturally carries it → (3) last resort — a new minimal single-instance demo dedicated to that
   one requirement, exactly how `item-size` covers `xs`.** A forced-render `examples/` override is a
   *different* tool — for portal/hidden-surface slots that can't render in a normal demo at all (§6) — not a
   step in this precedence.
5. **Confirm the demos fully cover the set, then verify every filter resolves** (§10).

### RULE 0 — the canonical demo is sacred; never touch it

The canonical demo — the component's frontmost single instance, in `<component>.tsx` (for `item`, the one
`variant="outline"` Basic Item) — stays **untouched**: never flip its variant, resize it, add to it, or
restructure it for a filter. All coverage of other variants, sizes, contexts, and slots goes in the **other**
demos.

### Rules 1–8

1. **Consolidate to the FEWEST demos that cover the requirement set** — the prime directive, **subject to
   one deviation per demo (rule 4).** Port only as many real demos as coverage needs; if two cover the same
   requirements, keep one. Don't create one file per shadcn example. But don't over-consolidate either: if
   covering two requirements on one demo would need two deviations, split them across demos — clarity beats
   raw minimum (that's why `xs` got its own `item-size` instead of piling onto another demo). A typical
   non-portal component is **1–3 demo files** (item's five is high, because its requirement set is unusually
   large — ten slots, two cvas, three contexts).
2. **Port real shadcn demos — never invent, author from scratch, or "simplify."** A demo is a faithful port
   (minus the swaps, plus only the RULE 4 incorporations). If the docs show it, port it; if not, it doesn't
   exist for this pass. (Exception: the `†` stock-demo-less components — build a faithful minimal demo from
   the component's own API.)
3. **No dedicated per-feature files — fold coverage INTO the demos.** An icon lives in a demo's media slot;
   the media `image` variant is a real `<img>` on a real item in a demo; a link is an `asChild <a>` item in
   a demo; a variant renders on an item in a demo. `<name>-icon.tsx` / `<name>-image.tsx` / `<name>-link.tsx`
   / `<name>-variant.tsx` are **forbidden** — the scene derives those from the demos.
   - **This is not "assume it's already there."** Real demos won't always exercise every variant, context,
     or slot you need (item's `muted` appeared in none; `button` may not show every variant). When a
     requirement is missing, **fold it into an existing demo** via RULE 4 — you don't skip it, and you don't
     spawn a showcase file for it.
   - **The sanctioned exception.** The files above are forbidden because they *duplicate* what a demo already
     shows. A **minimal single-instance demo for a requirement with genuinely no home** — the last resort in
     the derivation precedence, exactly how `item-size` covers `xs` — is allowed: it's the *only* place that
     requirement renders, one instance, not a showcase. Reach it only after fold and port-another-real-demo
     fail (derivation step 4).
4. **The only permitted alterations to a ported demo are the minimal incorporations that make a required
   filter both PRESENT and LEGIBLE — and each must be ledgered.** Only these, only when no real demo
   naturally satisfies the requirement, and only in a **non-canonical** demo (RULE 0):
   - **a variant flip** — change one existing item's `variant` to the needed value (item's `muted` on one
     header card);
   - **an applied size** — set `size` on an existing item (item's `sm` on the link);
   - **a minimal legibility tweak** — the smallest addition that makes the folded coverage readable
     (item-link's one added description line so the `sm` size reads).

   Each is the smallest change that works and is recorded in the alterations ledger (Verification E).
   Anything else — invented items, changed copy, restructuring, fabricated contexts — is forbidden. This is
   the bounded "not fully verbatim" carve-out.

   **At most ONE deviation per demo.** A *deviation* is a coverage alteration — a variant flip **or** an
   applied size. Do **not** stack both on one demo (no variant flip *and* a size change together); aim for a
   single deviation per demo, for simplicity. The minimal legibility tweak is **not** a second deviation — it
   rides along with the one alteration it supports (item-link's added description is part of its single `sm`
   deviation). If a second requirement would need a second deviation on the same demo, move it to another
   demo — or, if it has no home, its own minimal demo (rule 3's sanctioned exception).
5. **`size` is covered like variants — spread across the demos; a minimal extra demo only for a size that
   can't be folded.** Prefer rendering each size on an item a demo already has (item: `default` on the
   canonical, `sm` on the link). A size with no home gets **one** minimal single-item demo (item's `xs`) —
   the size instance of the general last resort (derivation step 4 / rule 3's exception); applying a size is
   that demo's single deviation (rule 4). Never a size *showcase*. The **resolved** cva must carry every size
   (the vendored baseline synced from the style source, **plus** any the registry override adds) so each is
   selectable and its `[data-size=…]` derives.
6. **One concern per demo file, ONE named export.** No synthetic/parameterized components, no multi-export
   files. A renderable requirement with no home after RULE 4 folding gets its **own minimal demo** (rule 3's
   exception, derivation step 4.3) — not an extra export or a showcase. An `examples/` override (§6) is only
   for a portal's hidden surface that can't render in a normal demo at all.
7. **EVERY requirement gets a live example — walk the list, don't eyeball it.** Every slot (easy to forget:
   `footer`, `media`, `separator`, `group`), every option of every cva, every context must appear in a demo.
   A requirement with no live example is a defect — fold it in (RULE 4).
8. **Every dropdown entry MUST resolve to a real demo or a sanctioned override.** Walk the dropdown: each
   slot, each cva option (incl. every size), each context pulls the correct demo/override — never "Not
   present," empty, wrong, or synthetic. (The one honest exception: a `[&_svg]`/`[&_img]` context with no
   media cva can't derive — flag it as an engine gap, don't fake it.)

**Corollaries** (consequences of the above, not new rules): a slot resolves to its **first** occurrence
across the demos — make that occurrence the slot's default use. A `variant` that reads as "nothing" alone
(transparent `default`) is fine as long as a demo renders it in context (in a group). Icons render through
our `Icon`. Don't port RTL or size-*showcase* demos.

## Worked example: `item` (the rules applied — do NOT copy the shape)

Item's requirement set: ten-ish slots (`item`, `item-media`, `item-content`, `item-title`,
`item-description`, `item-actions`, `item-header`, `item-footer`, `item-separator`, `item-group`); **two**
cvas (`itemVariants` = variant `default`/`outline`/`muted` + size `default`/`sm`/`xs`; `itemMediaVariants` =
variant `icon`/`image`); contexts `[a]`, `[&_svg]`, `[&_img]`. Applying the rules produced five demos:

| Requirement | Covered by | Decision (why) |
| --- | --- | --- |
| the component (canonical) | `item.tsx` — one `variant="outline"` Basic Item, untouched | RULE 0. Its natural state already carries `outline` + default size. |
| `default` variant | `item-group.tsx` — default items in a list | `default` has no border; it only reads in context (a group). |
| `muted` variant | `item-header.tsx` — one of three cards flipped to `muted` | RULE 4 variant flip; no real demo showed `muted`. |
| sizes `default` / `sm` / `xs` | canonical / `item-link.tsx` / `item-size.tsx` | Spread across demos (rule 5). `sm` rode the link (with one added description line for legibility); `xs` had no home, so a minimal demo. |
| media `icon` + `[&_svg]` | `item-link.tsx` — `ItemMedia variant="icon"` | Icon lives in a demo's media slot, not its own file. |
| media `image` + `[&_img]` | `item-group.tsx` — a group item with `ItemMedia variant="image"` + `<img>` | Image rides a real group item, not its own file. |
| `[a]` context | `item-link.tsx` — `<Item asChild><a href="#">…` | The link is an item inside a demo. |
| `item-footer` slot | `item-header.tsx` — each card's `ItemFooter` | Easy-to-forget slot; walked the full list (rule 7). |
| `item-separator` / `item-group` slots | `item-group.tsx` — `ItemSeparator` between rows, `ItemGroup` | Covered by the one group demo. |

**Absent by design:** no `item-icon`/`item-image`/`item-variant`/`item-link` files; the canonical `item.tsx`
shows exactly one item; and **each demo carries at most one deviation** — `item-header` the `muted` flip,
`item-link` the `sm` size (its description rides along), `item-size` the `xs` (its whole reason to exist),
`item-group` none (default/image/separator are native to that demo). Your component's table will look
different — fill it from *its* demos and set.

## `examples/` overrides — when a demo can't serve a filter

`components/examples/<component>/<filterKey>.tsx` is a forced-render override, checked **before** derivation.
It is **sparse** — author one only when a filter genuinely can't derive even after RULE 4 folding. Mainly:
portal/overlay components, whose editable slots live in hidden surfaces (menu content, dialog body) the
closed demo doesn't render.

**The filename↔key contract (from the scene — get this right):** the scene renders an override when a file's
basename equals the filter key (`<filterKey>.tsx`) **or** `<component>-<filterKey>.tsx`, and it renders the
**whole override component** — it does **not** slot-extract from an override. Consequences:
- The filename **is** the filter key: a slot → the literal `data-slot` (`dropdown-menu-content.tsx`); an
  option → `<axis>-<option>.tsx`; a context → `context-<ctx>.tsx`.
- A portal's hidden inner slots don't auto-resolve from one open-render. **Each inner slot you want reachable
  needs its own override file** (a thin file rendering the same force-open surface). The trigger slot still
  reuses the demo — no override.

**The force-open mechanism already exists — port it, don't reinvent it.** `open-renders.tsx` holds a working
forced-open render for each of the 13 portals. The pattern: keep the real Radix Root `open`; render a local
host `<div ref={setHost} />`; mount the content into it via the component's `Portal container={host}` with
`forceMount`; neutralize auto-close with `onCloseAutoFocus` / `onEscapeKeyDown` / `onPointerDownOutside` →
`preventDefault`; and copy the content's `className` from the vendored primitive. **Read the component's
`openRenders` entry and port that structure into the override file(s).** The first portal you build,
`dropdown-menu`, establishes and validates this pattern for the rest — it does not exist yet; you are
building it.

**Non-portal overrides are essentially never needed.** A renderable requirement (a variant, size, or
context) with no home becomes its **own minimal demo** (derivation step 4.3 / rule 3's exception), not an
override — an override is a *forced-render* tool for hidden/portal surfaces, and a normal variant/size/
context renders fine as a static single-instance demo. So for non-portal components there are typically
**no** overrides. (`item` has none — an item in a menu is just item in a container; the menu is the
dropdown-menu component's concern.)

## Before you start — one-time global setup (orchestrator)

Confirm/complete what the reference pass left (most is done — verify, don't assume):
- The route imports `demo-scene`, not `example-preview`; `example-preview.tsx` is deleted, `src/examples/`
  and its maps are gone. If not, finish the reference pass first.
- `biome.json`'s `useValidAnchor` (`href="#"`) override covers `src/components/demo/**` +
  `src/components/examples/**` (already set by the reference pass — verify).
- `test/render-smoke.test.tsx` currently iterates the **legacy** `previews`/`openRenders` (correct — keep
  them until each component migrates) and has hand-written `DemoScene` cases for `item`. As this pass adds
  components, **add** per-demo-mount-over-glob assertions and per-filter-resolves assertions (§10 Gate);
  delete a migrated component's legacy smoke case as you delete its legacy entry.
- `separator` (`components/demo/separator/separator.tsx`) is wired as the trivial reference.
- **Sync the vendored primitive for the component you're about to do to its radix-nova style source before
  deriving its requirement set** (so the cva option/size set is authoritative). This is stage 0 below.

## Legacy path — delete it per component as you go

A transitional fallback keeps unported components rendering:
- `previews.tsx` (`previews` + `PreviewRender`) — the old drift-prone previews.
- `open-renders.tsx` (`openRenders` / `OpenRender`) — the 13 portal forced-open renders.

**The orchestrator (never a sub-agent) deletes these as each component migrates:**
1. Delete the component's entry from `previews` (and, if a portal, from `openRenders`) — the glob now serves
   it, so the entry is dead code.
2. When `previews` is empty, delete `previews.tsx` and the scene's `previews` fallback branch; same for
   `openRenders` / `open-renders.tsx`.
3. When both are gone, confirm `demo-scene.tsx` imports neither and delete any lingering
   `example-preview.tsx`.

**Done state of the rollout:** `demo/` (+ sparse `examples/`) is the only preview source; `previews.tsx`,
`open-renders.tsx`, `example-preview.tsx`, `src/examples/` are gone; `demo-scene.tsx` has no fallback code.

## The pipeline — per-component multi-agent workflow

The **orchestrator** owns every shared edit (the vendored primitive, legacy deletions, wiring, biome, tests,
the route), all verification, and all commits. **Sub-agents own only their `demo/<component>/` and
`examples/<component>/` files** and return contents. Stages are sequential per component; run several
*independent* components in parallel (distinct folders → no conflict), but **serialize integration + `bun
run check` + commits** — the full test run and the git index race.

```
per component:
  0  derive (orchestrator)   sync the vendored primitive to its radix-nova style source, then derive the
     │                        requirement set + pick the fewest real demos that cover it (see §4 procedure)
     ▼
  1a/1b demo-build agent(s)   port the chosen real demos; fold coverage in per RULE 4; return files + a
     │                        coverage note + the alterations they made (for the ledger)
     ▼
  2  demo-QC agent            verify demos vs the requirement set AND vs live shadcn (rules 0–8)
     │  (demos must pass before stage 3)
     ▼
  3  override-build agent     (trailing) author sparse examples/ overrides only if a filter can't derive;
     │                        return overrides + a findings list of demo problems hit
     ▼
  4  demo-fix agent           apply stage-3 findings to the demos
     ▼
  5  override-QC agent        verify overrides: force-open surfaces expose content + inner slots; each
     │                        override key resolves override-first; demos still cover everything
     ▼
  6  final QC (orchestrator)  integrate, delete legacy entry, run Verification A–F, commit to main
```

**Stage-specific responsibilities** (each stage *applies* the rules of §4 — it does not redefine them):
- **0 — derive (orchestrator):** sync primitive, produce the requirement set + minimal demo list. This
  list, not item's shape, is what the sub-agents cover.
- **1a / 1b — demo-build:** most components need only **1a**; use 1b only when the minimal real-demo set is
  genuinely large enough to split, and split by existing file — never invent a demo to give 1b work.
- **2 — demo-QC:** confirm rules 0–8 against *this component's* requirement set; return pass/fail + fixes +
  the alterations ledger. Blocks stage 3.
- **3 — override-build (trailing):** overrides only; returns files + demo findings.
- **4 — demo-fix:** apply findings to demos; add any new ledger entries.
- **5 — override-QC:** verify overrides + that demos still cover everything.
- **6 — final QC (orchestrator):** Verification A–F + commit; loop a stage rather than ship if fixes are
  outstanding.

A non-portal component with no overrides still runs the pipeline, but stages 3–5 are near-empty (3 = "no
overrides needed", 4 = no-op, 5 = confirm every filter derives). A **trivial** component (`*` — non-cva,
non-portal, single demo like `separator`) runs **0 + 1a + 2 + 6** and skips 3–5.

### Sub-agent prompts (templates)

These are the one place rules are restated in full — a dispatched agent must be self-contained. Fill `<…>`
from **stage 0's requirement set for the specific component**, never from item.

**Demo-build (1a / 1b):**
> Author workbench **demo** files for **`<NAME>`** by porting shadcn's **real** radix demos — faithful,
> inventing nothing. Working dir: `<repo>/workbench`. Write to `src/components/demo/<NAME>/` **only**. Do
> NOT wire, delete legacy, or commit. Return each file's path + full contents + a per-demo coverage note +
> a list of every alteration you made (for the ledger).
>
> **Your demos (this agent):** `<SUBSET OF THE CHOSEN DEMO FILES>`.
> **Requirement set the full set must cover (every one needs a live example):** slots
> `<SLOT LIST, incl. footer/media/separator/group if present>`; cva options
> `<EVERY axis:option of EVERY cva, or "none">`; contexts `<[a] / [&_svg] / [&_img], or "none">`.
> **Canonical demo:** `<NAME>.tsx` = the single frontmost instance, **untouched** (RULE 0).
>
> **HARD RULES:**
> - **Fewest files.** Only as many demos as the set needs. No file-per-example.
> - **Faithful shadcn only.** Verbatim minus the swaps below and the alterations named next. Never invent
>   copy, author from scratch, or simplify. (Exception: a truly stock-demo-less `<NAME>`.)
> - **No `<NAME>-icon` / `<NAME>-image` / `<NAME>-link` / `<NAME>-variant` files.** Fold icons, images,
>   links, and variants **into** the demos.
> - **The only permitted alterations, in a NON-canonical demo, each of which you must list:** a **variant
>   flip**, an **applied size**, or a **minimal legibility tweak** — to cover a filter no real demo shows.
>   Nothing else changes. **At most ONE deviation (variant flip OR applied size) per demo** — don't stack
>   both; the legibility tweak rides along with the one it supports. A requirement with no home gets its own
>   minimal single-instance demo (like `item-size` for `xs`), not a second deviation piled on an existing one.
> - **`size`:** spread across existing demos; add one minimal single-item demo only for a size with no home.
>   If `<cva options>` lists a size, some demo must emit its `[data-size]`.
> - **One concern per file, ONE named export.**
>
> **Source:** `gh api "…/apps/v4/examples/radix" --jq '.[].name' | grep '^<NAME>'`, then
> `gh api "…/apps/v4/examples/radix/<file>" -H "Accept: application/vnd.github.raw"`. Fallback:
> `apps/v4/registry/new-york-v4/examples/<NAME>-demo.tsx`.
> **Swaps:** `@/registry/new-york-v4/ui/<n>` **and** `@/components/ui/<n>` → `~/components/ui/<n>`;
> `lucide-react` → `@registry-ui/icon` `<Icon icon="mdi:…" />` (don't hard-code icon `size-…` if the
> component sizes icons via `[&_svg]`); `next/image` → `<img>`; `export default` → **named** export. Keep
> other structure/classes as-is. `href="#"` allowed. Don't port rtl/size-showcase demos.

**Override-build (3):**
> Author the **sparse** `src/components/examples/<NAME>/` **override** files for **`<NAME>`** — ONLY filters
> the finalized demos can't serve. Working dir: `<repo>/workbench`. Do NOT touch `demo/`, wire, or commit
> (the orchestrator deletes the legacy `openRenders` entry, not you). Return override files + a **findings
> list** of demo problems you hit.
>
> **Demos** (built, in `demo/<NAME>/`): `<DEMO FILES>`. **Filter keys:** slot → `data-slot`; option →
> `<axis>-<option>`; context → `context-<ctx>`. **An override's filename IS its filter key; the scene
> renders the whole override and does NOT slot-extract from it — so a portal needs one file per hidden slot
> you want reachable.**
>
> **Portal/overlay `<NAME>`:** port the component's `open-renders.tsx` entry into a force-open render — keep
> the Root `open`, host `<div ref={setHost}/>`, `Portal container={host}` + `forceMount`,
> `preventDefault` the close handlers, copy the content `className`. Key files by the content slot
> (`<content-slot>.tsx`) and each inner slot you want filterable. Trigger reuses the demo.
> **Non-portal:** you almost certainly return **"no overrides needed"**. A renderable option/context with no
> home is a **minimal demo** (a demo-build/demo-fix concern, e.g. `item-size` for `xs`), not an override —
> overrides force-render hidden surfaces, which non-portal components don't have.
>
> **Findings:** for each demo issue (a missing `data-slot`, an option not emitting `[data-variant]`/
> `[data-size]`, a wrong/absent `<a>` for `context-a`), report the file + exact fix.

## Verification (per component — the orchestrator runs this at stage 6)

A checklist, not two spot-checks. Gate first, then A–F; not done until all pass. A and F are visual
(screenshots) — this user catches what code-only reasoning misses; don't sign off on "close enough."

- **Gate — `cd workbench && bun run check`** (biome + tsc + vitest). Keep the smoke test current: the glob
  scene mounts a component's demos; **every demo file mounts** (iterate `import.meta.glob`); for a migrated
  component **every filter resolves to a demo or override** (assert slot extraction + variant/context
  derive, no "not present"); for a migrated portal, its content-slot override exposes the content slot + ≥1
  inner slot in `[data-preview]`. Delete a migrated component's legacy smoke case with its legacy entry.
- **(A) Live shadcn compare — screenshot the live docs, compare EVERY demo.** `goto
  https://ui.shadcn.com/docs/components/<name>` (playwright-core + Chrome present; reuse `/tmp/wb-*.mjs`),
  screenshot every demo block, put each beside the workbench port, compare on **content / borders / icon
  boxes / spacing**. **Carve-out:** content is *expected* to differ only where the ledger (E) says so — a
  variant flip, an applied size, the one legibility line. Any other content difference, or any
  border/box/spacing mismatch, is a defect (re-port, or fix the primitive against its style source). This is
  the check that exposes invented content and stray per-feature files (no counterpart on the live page).
- **(B) Workbench filter sweep — walk EVERY dropdown entry.** Start `bun run dev:web` (API on `:3000`; web
  auto-picks a port — **confirm it's this worktree's**; foreign apps may hold `517x`). `goto
  /components/<name>`, screenshot the demo section (matches A), then the resolved preview for **every**
  entry: every slot (incl. footer/media/separator/group) → a one-instance `from <demo>` view; every cva
  option (incl. every size) → its representing view (variant = whole demo, size = single instance); every
  context → a real `<a>` / an icon / an image. The dropdown must **list every option of every cva** (a
  missing one = a bad cva sync — rule 5). None "Not present"/empty/wrong/synthetic — except an honestly
  flagged no-media-cva `[&_svg]`/`[&_img]` engine gap.
- **(C) Baseline primitive vs style source.** The **vendored baseline** `src/components/ui/<name>.tsx`
  matches `apps/v4/styles/radix-nova/ui/<name>.tsx` byte-faithfully: no invented classes, cva carries every
  size. Orchestrator-only fix. This checks the **baseline** — a **registry override**
  (`registry/components/ui/<name>.tsx` or `cva/<name>.ts`) is intentional user customization that trumps and
  is *not* reconciled to radix-nova; instead verify the demos cover whatever the resolved (override)
  component adds.
- **(D) Structural coverage audit (non-visual).** Cross-check the finalized demos against stage 0's set:
  every slot appears, every cva option emits its `[data-variant]`/`[data-size]`, every context has its
  element; fewest files; no forbidden per-feature files; canonical demo untouched and single-instance.
  (Confirms rules 0/1/3/7 hold.)
- **(E) Alterations ledger.** Enumerate every deviation of the demos from verbatim shadcn; confirm each is
  exactly one RULE 4 incorporation (variant flip / applied size / legibility tweak) tied to a specific
  filter, and nothing more. An un-ledgered or non-sanctioned deviation is a defect. This ledger is what lets
  A tell an expected difference from a mis-port.
- **(F) Interaction states (per `DESIGN.md`).** On interactive demos, confirm hover / active / focus-visible
  (background/border shift, **no ring**) / disabled render, and that editing a variant or an `[a]`/`[&_svg]`
  context still paints live.

**Done (per component):** Gate green · A clean (content/borders/icon-boxes/spacing match, minus ledgered
alterations) · B every entry resolves and the dropdown lists every cva option · C primitive matches its
style source · D set fully covered by the fewest files · E every deviation ledgered · F states render ·
legacy entry deleted · committed to `main` (`feat: workbench demos for <name>`, one commit per component).

## Orchestration & conflict model

- **Orchestrator owns every shared/global file** — `demo-scene.tsx` (only if the generic scene needs a fix),
  `components/ui/<name>.tsx` (the vendored primitive), `previews.tsx` / `open-renders.tsx` (legacy
  deletions), `biome.json`, `test/render-smoke.test.tsx`, the route — plus all verification and all commits.
  Sub-agents never touch these.
- **Sub-agents own only their `demo/<name>/` + `examples/<name>/` files.** Distinct per component, so
  parallel *authoring* has zero conflict.
- **No shared registration file** (the point of the glob) — dropping a file is the whole wiring.
- **Never branch** (repo rule): commit straight to `main`, one commit per component.
- **Never run parallel `bun run check` or parallel commits.** Fan out authoring; integrate + verify +
  delete-legacy + commit **serially, per component**.

## Work-list (57 components; `item` ✅ and `separator` ✅ done — all others pending)

Legend: `*` = trivial (one demo, non-cva → pipeline 0+1a+2+6) · `†` = no stock shadcn demo (author
faithfully; see Source of truth) · portals need `examples/<name>/` force-open overrides (see §6).

**Standard / non-portal (44).** cva components flagged; the rest are slot-only.
`accordion` · `alert` (cva variant) · `aspect-ratio`* · `avatar` · `badge` (cva variant) · `breadcrumb` ·
`button` (cva variant+size; has a `[&_svg]` icon context — needs an icon in a demo) · `button-group`† (cva
orientation) · `calendar` · `card` · `carousel` · `chart`† · `checkbox` · `collapsible` · `empty`† (cva
variant) · `field`† (cva orientation) · `form` · `input`* · `input-group`† (cva align) · `input-otp` ·
`item` ✅ (two cvas incl. media; `[a]` context) · `kbd`† · `label`* · `native-select`† · `navigation-menu` ·
`pagination` · `progress` · `radio-group` · `resizable` · `scroll-area` · `separator`* ✅ · `sidebar`† ·
`skeleton`* · `slider` · `sonner`† · `spinner`*† · `switch` · `table` · `tabs` (cva orientation+variant) ·
`textarea`* · `toggle` (cva variant+size) · `toggle-group`.

**Portal / overlay (13) — need `examples/<name>/` force-open overrides.**
`alert-dialog` · `combobox`† · `command`† · `context-menu` · `dialog` · `dropdown-menu` · `drawer` ·
`hover-card` · `menubar` · `popover` · `select` · `sheet` · `tooltip`.
Editable slots live in hidden surfaces — the demo shows the trigger; an override force-opens the content
(port the `openRenders` entry, one file per hidden slot). These are **primarily** slot-only; still run stage
0's cva enumeration and cover any cva a portal does define — don't assume none has one.
