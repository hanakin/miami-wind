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
- `workbench/src/components/demo/item/*.tsx` — the canonical, **consolidated** demo set:
  `item-demo`, `item-group`, `item-header`, `item-link`, `item-size`. Each is one real radix demo, one
  file, one named export, our imports/icons. Together they cover every item `data-slot`, every
  `variant` (each renders **inside** the main/group demo), the `[a]` link context, and — via the single
  `item-size` demo — every `size`. This is the **exact** coverage shape to reproduce per component:
  - **`default` variant** → shown by the **GROUP demo** (`item-group`), where default items sit in context.
  - **`outline` variant** → shown by the **main item demo** (`item-demo`), which shows **exactly ONE**
    outline item. The main demo shows **one** item — not a variant showcase.
  - **`muted` variant** → shown by **ONE item in another demo flipped to muted** (e.g. one card in
    `item-header` set to `variant="muted"`). This is the single permitted `variant` flip (see rule 4).
  - **`image` media variant** → shown by an item **inside the GROUP demo** that uses
    `ItemMedia variant="image"` with a real `<img>`. The image is **not** its own demo.
  - **sizes** → the item spread across demos: `default` in the main demo, `sm` in the link demo, `xs` in a
    tiny `item-size` demo of **just the xs item** (see rule 5).

  **Note what is deliberately absent:** there is **no** `item-icon`, `item-image`, or `item-variant` file,
  and the main demo does **not** show multiple variants. The icon and image are part of the media slot
  **inside** a demo; each variant renders inside a demo that uses it. Those dedicated files were removed as
  redundant — do not recreate that shape (see the WORKFLOW rules below). This 5-file set, not a
  file-per-example sprawl, is what "do what `item` now does" means.
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
  vendored cva must carry `xs` too, so **every size is selectable in the dropdown** (see rule 5). Sync
  `xs` from the component's shadcn style source — do not omit it.

Whenever a demo renders wrong, compare the vendored primitive against this style source first — a class the
primitive invented (or a size it dropped) is the usual cause.

**Mechanical swaps (required, verbatim otherwise):**
- `@/registry/new-york-v4/ui/<n>` and `@/components/ui/<n>` → `~/components/ui/<n>`.
- `lucide-react` icons → `@registry-ui/icon`: `<Icon icon="mdi:<best-guess>" className="size-…" />`. Icon
  choice does not matter — just use an icon; prefer `mdi:`. Never lucide, never bare `<svg>`.
- `next/image` → plain `<img>` (drop `fill` / `priority`; keep `width` / `height` / `className`).
- `export default function X()` → **named** `export function X()`. **One export per file.**
- Keep JSX structure, composition, and Tailwind classes as-is. `href="#"` is fine.

The `gh` source gives you the demo *code*; the **live docs page**
(`https://ui.shadcn.com/docs/components/<name>`) is the *visual truth* you verify against (see
VERIFICATION). Fetch **only** as many demos as the WORKFLOW rules require (the fewest that cover every
slot, + a `size` demo if needed) — porting is verbatim; the sole permitted edit is a `variant` flip.

**Components with no stock shadcn demo** (author a faithful minimal demo from the component's own API +
slot list instead — this is the *only* case where you build a demo that isn't a real shadcn port):
`button-group`, `input-group`, `native-select`, `combobox`, `spinner`, `chart`, `sonner`, `sidebar`,
`kbd`, `empty`, `field`. List the dir first; only author-from-scratch if truly absent.

## WORKFLOW — the demo-authoring RULES (these are hard rules, not guidance)

A prior attempt over-built this **and** hallucinated content repeatedly: one file per shadcn example,
dedicated `*-icon` / `*-image` / `*-link` / `*-variant` files, multiple variants crammed into the main
demo, invented "from scratch" content, a dropped `xs` size, and a vendored primitive with invented classes
(an item-media `icon` bg box that radix-nova doesn't have). **Those are the failure modes this section
exists to prevent.** Every rule below is mandatory and unambiguous. When in doubt, author **fewer** files
with **100% real** shadcn content, not more.

1. **CONSOLIDATE to the FEWEST demos that cover every data-slot. This is the prime directive.** Pick the
   smallest set of real shadcn demos that, together, put every `data-slot` on screen at least once (rule 7
   — including `footer`/`media`/`separator`). **Do NOT create one file per shadcn example** — the shadcn
   docs page lists many demos; you port only as many as it takes to cover the slots (plus the single tiny
   `xs` size demo of rule 5, the only sanctioned extra). If two shadcn demos cover the same slots, keep one.
   Bias hard toward the minimum. A typical non-portal component is **1–3 demo files**, not seven.

2. **Use ONLY 100% real shadcn demo items. Never invent, never "author from scratch."** Every demo must be
   a verbatim port (minus the mechanical swaps below) of an actual demo from the component's shadcn docs.
   Do not compose your own example, do not fabricate copy, do not "simplify." If the shadcn docs show it,
   port it; if they don't, it does not exist for this pass. (Exception — a genuinely stock-demo-less
   component: see the explicit list in "Source of truth"; there and only there you build a faithful minimal
   demo from the component's own API.)

3. **Icons, images, links, and variants are ALREADY inside the demos — do NOT give them their own files.**
   An icon is part of the media slot **inside** a demo. An image (media `image` variant) is part of the
   media slot **inside the GROUP demo** — a group item using `ItemMedia variant="image"` with a real
   `<img>`. A link is a row/item **inside** the main demo. A variant renders **inside** the demo that uses
   it. Creating `<name>-icon.tsx` / `<name>-image.tsx` / `<name>-link.tsx` / `<name>-variant.tsx` is
   redundant — those files duplicate what the demos already render, and the scene already derives the icon
   slot, image slot, `context-a`, and each `variant-*` **from the demos**. **These dedicated files are
   forbidden.** The scene's slot extraction finds the icon/image slot in a demo; its variant/context derive
   finds the variant/link in a demo. No separate file is needed or wanted.

   **Exact variant-coverage guideline (follow this shape):**
   - **`default`** → shown by the **GROUP demo** (default items in context).
   - **`outline`** → shown by the **main item demo**, which shows **exactly ONE** outline item.
   - **`muted`** → **ONE item in another demo flipped to muted** (e.g. one item-header card).
   - The **main demo shows only ONE item.** Do **NOT** show multiple variants in the main demo. Do **NOT**
     create a dedicated `<name>-variant` demo.

4. **The ONLY permitted alteration to a real shadcn demo item is its `variant` — and only to cover a
   variant filter no demo naturally shows.** Nothing else may be changed or invented. Per the guideline in
   rule 3, this is the `muted` flip: if the component has a `muted` variant that none of the real demos
   exercise, flip **one existing real item** to `variant="muted"` (e.g. one item-header card) so
   `variant-muted` derives to a real demo. That single attribute swap is the entire allowance. Do not add
   items, do not change copy, do not restructure, do not invent contexts. Everything else stays verbatim
   from shadcn.

5. **`size` is the exception: sizes are shown as sized versions of the item spread across demos.** Sizes are
   usually **not** shown as a showcase in the main demo, so — unlike variants — a `size` filter often can't
   derive from the main demo alone. Cover sizes by rendering the item **at each size across the demos**:
   `default` in the main demo, `sm` in the link demo, `xs` in a **tiny size demo of just the xs item**. The
   **vendored component cva MUST include every size** — sync `xs` from the component's shadcn **style
   source** (`apps/v4/styles/radix-nova/ui/<name>.tsx`) so **every size is selectable in the dropdown** and
   the `xs` demo's `[data-size="xs"]` derives. A dropped size = a size filter that can't resolve = a defect.
   The tiny size demo is the **only** sanctioned "extra" demo beyond slot coverage.

6. **One concern per demo file, ONE named export.** No synthetic / parameterized components (no
   `ItemPrimary`), no multi-export files. If a filter needs a shape no real demo shows, that is an
   `examples/` **override file** — not an extra export and not an invented demo.

7. **EVERY slot needs a live example — footer, media, separator included. A slot with no example is a
   defect.** Don't stop at the "interesting" slots. Walk the component's full `data-slot` list and confirm
   **each one** — explicitly including `footer`, `media`, and `separator` — appears in at least one demo so
   its slot filter derives. If a slot has no live example anywhere in the demos, that is a defect to fix
   (add the slot to an existing demo, verbatim from shadcn) before the component is done.

8. **Every filter in the "Editing" dropdown MUST resolve to a real demo — verify each one.** After
   authoring, walk the dropdown: **each slot (incl. footer/media/separator), each variant, each size (incl.
   `xs`), and each context (e.g. `[a]`)** must pull the correct real demo (or a sanctioned `examples/`
   override). For every entry, confirm the scene actually resolves it to the intended demo — not to
   "nothing," not to "Not present," not to the wrong demo, not to a synthetic fallback. A filter that
   resolves to the wrong or empty demo is a defect to fix before the component is done.

**Corollaries (still rules):**
- **Slot view = exactly one instance** — the canonical default use. The scene extracts the first
  occurrence of the `data-slot` across your demos; ensure that first occurrence is the slot's canonical
  use. This applies to **every** slot, including `footer`, `media`, and `separator` (rule 7) — each must
  have a live instance in some demo.
- **Every cva variant must emit its `[data-variant=…]` inside some demo** so the scene's derive step finds
  it, per the exact shape in rule 3 (`default` in the group demo, `outline` in the main demo, `muted` as a
  single flipped item). A variant that renders as "nothing" on a lone instance (e.g. a transparent
  `default`) is still fine as long as a real demo renders it in context (e.g. inside a group). Only the
  `muted`-style flip of rule 4 is a permitted alteration; never a dedicated `*-variant` file, never
  multiple variants in the main demo.
- **The media `image` variant ⇒ a real `<img>` inside the GROUP demo** — a group item using
  `ItemMedia variant="image"`. Not a `*-image.tsx` file, not the main demo.
- **`[a]:` link context ⇒ a real `<a>` inside a demo.** If any class carries `[a]:` (the whole element
  becomes a link — **scan the component file, not just the cva**), the main demo already renders a link
  row/item as an `asChild <a>` with `data-slot`, so `context-a` derives to it. **Do not** add a separate
  `*-link.tsx` for this — the link lives in the main demo.
- **Icons render through our `Icon`** (iconify `mdi:` or `type="custom"` SVG). Never lucide, never bare
  `<svg>`. The icon is part of a demo's media slot — never its own file.
- **Drop RTL and size-only-showcase demos** except the single sanctioned tiny `xs` size demo of rule 5. No
  `*-rtl`.

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
  export name) so a media-cva option resolves to whichever demo puts that variant on the sub-part — which,
  per the rules, is the **main/group demo that already renders the media slot** (icon or image), not a
  dedicated `*-icon` / `*-image` file. If a component's secondary-cva variants don't yet appear in the
  dropdown, note it — don't fight it; it's engine-track work.

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
  ┌─ 1a demo-build agent  ─┐        (FEWEST real shadcn demos covering every slot;
  │  (1b only if the       │         usually 1–3 files → often 1a alone. NO file-per-example,
  └─ 1b demo-build agent  ─┘         NO invented content, NO *-icon/*-image/*-link/*-variant.)
            │  return demo files
            ▼
     2  demo-QC agent      (verifies demos vs LIVE shadcn: fewest-files, 100% real content,
                            no redundant icon/image/link/variant files, only-variant-flip,
                            slot/variant/size/context coverage, swaps, one-export, renders)
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
        (sync vendored primitive to radix-nova style source — no invented classes, cva has every
         size incl xs; integrate: write files, delete this component's legacy previews/open-renders
         entry, biome override if first; bun run check; playwright (A) live-shadcn compare +
         (B) filter sweep per Verification; commit to main)
```

**Stage responsibilities:**

- **1a / 1b — demo-build (up to two agents).** **First decide the demo list per the WORKFLOW rules: the
  fewest real shadcn demos that cover every `data-slot` (explicitly incl. `footer`/`media`/`separator`),
  laid out in the rule-3 variant-coverage shape (`default` → group demo, `outline` → the one-item main
  demo, `muted` → one flipped item, `image` → an `<img>` in the group demo), plus the tiny `xs` size demo
  if needed.** Because that set is usually **1–3 files**, most components need **only agent 1a**; use 1b
  only when the (still minimal) real-demo set is genuinely large enough to split, and split by file.
  **Splitting is never a reason to add files** — never invent a demo just to give 1b something to do. Each
  agent ports its `components/demo/<component>/<demo>.tsx` from `gh api …/apps/v4/examples/radix/…` with the
  swaps, one named export per file, verbatim content (only the `muted`-style `variant` flip is permitted,
  per rule 4). Returns file paths + full contents + which slots/variants/sizes/contexts each demo covers.
  Does **not** wire or commit.
- **2 — demo-QC (one agent).** Confirms **all WORKFLOW rules**: the set is the **fewest** demos covering
  every `data-slot` (flag and cut redundant files); **no dedicated `*-icon` / `*-image` / `*-link` /
  `*-variant` files** (icon lives in a demo's media slot, the media `image` variant lives in the GROUP
  demo's `<img>`, links and variants live inside a demo); the **main demo shows ONE item, not a variant
  showcase**; the variant-coverage shape matches rule 3 (`default` → group demo, `outline` → main demo,
  `muted` → one flipped item); every demo is a **100% real shadcn port** with **no invented/from-scratch
  content** and **no alteration except the permitted `muted`-style `variant` flip**; **every slot has a
  live example — explicitly `footer`, `media`, `separator`** (rule 7); every cva `variant` has a demo
  emitting its `[data-variant=…]`; **every `size` is covered incl. `xs`** (sized item across demos + the
  tiny `xs` size demo; the vendored cva carries `xs`, synced from the radix-nova style source); `[a]:` (if
  present in the component file) is shown by a real `<a data-slot>` **inside a demo** (not a `*-link` file);
  swaps applied (no lucide / `next/image` / `@/registry`); one named export per file. Also confirms **every
  dropdown filter (each slot incl. footer/media/separator, each variant, each size incl. `xs`, each context)
  resolves to a real demo** — none "Not present," no synthetic, no wrong demo — and the **dropdown lists
  every variant/size the cva defines**. Returns pass/fail + required fixes. **Demos must pass before stage 3
  runs** (the overrides trail the demos).
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
- **6 — final QC (orchestrator).** The integration + verification + commit gate below. **Before verifying,
  the orchestrator confirms the vendored primitive `components/ui/<component>.tsx` matches its radix-nova
  style source** (`gh api …/apps/v4/styles/radix-nova/ui/<component>.tsx`) byte-faithfully — no invented
  classes (e.g. no item-media `icon` bg box), and the cva carries **every** size incl. `xs` so it's
  selectable. A drifted primitive is fixed here (it's a shared `components/ui/` file — orchestrator-owned,
  never a sub-agent). Then runs (A) and (B). The orchestrator makes the final ship/no-ship call; if any
  stage's fixes weren't applied, it loops the relevant stage rather than committing.

Non-portal components with no overrides still run the pipeline, but stages 3–5 are near-empty: stage 3
returns "no overrides needed", stage 4 is a no-op unless demo-QC deferred a fix, stage 5 confirms every
filter derives from a demo (no override, no synthetic). Trivial components (`separator`) can run 1a alone
+ 2 + 6.

## Sub-agent prompts (templates)

**Demo-build (stages 1a / 1b):**

> Author workbench **demo** files for **`<NAME>`** by porting shadcn's **real** radix demos — verbatim,
> inventing nothing. Working dir: `<repo>/workbench`. Write to `src/components/demo/<NAME>/` **only**. Do
> NOT wire, delete legacy, or commit. Return each file's path + full contents + a slot/variant/context
> coverage note.
>
> **Your demos (this agent):** `<SUBSET OF DEMO FILES>`.
> **Slots the full set must cover (EVERY one needs a live example, incl. `footer` / `media` / `separator`):**
> `<SLOT LIST>`. **cva axes/options:** `<AXES/OPTIONS or "none">`.
> **`[a]:` in the component file?** `<yes → a real asChild <a> must appear INSIDE a demo / no>`.
>
> **HARD RULES (do not violate):**
> - **Fewest files.** Author only as many demos as it takes to cover every `data-slot` above. **Do NOT
>   create one file per shadcn example.** If two demos cover the same slots, keep one.
> - **100% real shadcn only.** Every demo is a verbatim port (minus the swaps below). **Never invent copy,
>   never author from scratch, never "simplify."** (Exception: a truly stock-demo-less `<NAME>` — see the
>   playbook's explicit list — where you build a faithful minimal demo from the component's own API.)
> - **EVERY slot gets a live example** — walk the slot list above and confirm each appears in a demo,
>   **explicitly `footer`, `media`, `separator`.** A slot with no example is a defect.
> - **NO dedicated `<NAME>-icon` / `<NAME>-image` / `<NAME>-link` / `<NAME>-variant` files.** The icon is
>   part of a demo's media slot; the media `image` variant is a real `<img>` **in the GROUP demo**; links
>   and variants render **inside** a demo. Those files are redundant and forbidden.
> - **Variant-coverage shape (exact):** `default` → the GROUP demo; `outline` → the main item demo, which
>   shows **exactly ONE** item; `muted` → **ONE** item in another demo flipped to `variant="muted"`. The
>   main demo shows one item — **never** a multi-variant showcase, **never** a `<NAME>-variant` file.
> - **Only permitted alteration = the `muted`-style `variant` flip** above, and only to cover a `variant-*`
>   filter no real demo shows. Change nothing else.
> - **`size` = sized versions of the item spread across demos** (`default` in the main demo, `sm` in the
>   link demo, `xs` in a **tiny size demo of just the xs item**). If a `size-*` can't derive from an
>   existing `[data-size=…]`, add that **one** tiny size demo. The vendored cva must carry **every** size
>   incl. `xs` (orchestrator syncs it from the radix-nova style source) so every size is selectable — if
>   `<AXES/OPTIONS>` lists `xs`, your demos must emit `[data-size="xs"]`. This is the only extra demo beyond
>   slot coverage.
> - **One concern per file, ONE named export.** No synthetic/parameterized components, no multi-export files.
>
> **Source:** `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix" --jq '.[].name' | grep '^<NAME>'`,
> then `gh api "repos/shadcn-ui/ui/contents/apps/v4/examples/radix/<file>" -H "Accept: application/vnd.github.raw"`.
> Fallback: `apps/v4/registry/new-york-v4/examples/<NAME>-demo.tsx`.
>
> **Swaps:** `@/registry/new-york-v4/ui/<n>`→`~/components/ui/<n>`; `lucide-react`→`@registry-ui/icon`
> `<Icon icon="mdi:…" />` (any icon); `next/image`→`<img>`; `export default function`→**named**
> `export function`. Keep structure/classes verbatim. `href="#"` allowed. Drop rtl demos.

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

## VERIFICATION (end-to-end, per component — the orchestrator runs this at stage 6)

Verification has two mandatory visual halves: **(A) LIVE shadcn compare** — screenshot the live docs and
compare EVERY demo (content, borders, icon boxes, spacing); and **(B) workbench filter sweep** — walk EVERY
"Editing" dropdown entry and confirm each resolves to the right demo (none "Not present"). Both are
required — not optional, not "if time." The gate below runs first; a component is not done until A and B
both pass.

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

- **(A) MANDATORY — LIVE shadcn compare. Screenshot the live docs and compare EVERY demo.** For every
  component, open its live docs page and screenshot it with playwright (`playwright-core` + Chrome are
  present; reuse the `/tmp/wb-*.mjs` pattern):
  - `goto https://ui.shadcn.com/docs/components/<name>` and screenshot **every** demo block on the page.
  - Put each screenshot **side by side** with the workbench's rendered port and **visually compare EVERY
    demo** on all four axes:
    - **content** — same copy/items (proof you ported the real demo and invented nothing);
    - **borders** — every border/fill/radius matches the live output (a `variant`'s border is where drift
      and mis-porting show);
    - **icon boxes** — icons/media render exactly as live (e.g. the item-media `icon` variant has **no**
      bg box or border on radix-nova — an added box is the drift bug to catch here);
    - **spacing** — gaps, padding, and alignment match.
  - **Any mismatch on any of the four — content, borders, icon boxes, or spacing — is a defect.** So is a
    missing/extra item, a variant with the wrong border/fill, or an icon/image in the wrong slot. Fix it
    (re-port the demo from shadcn source, or fix the vendored primitive against its radix-nova **style
    source** if the drift is in the primitive) and re-compare before proceeding. Do **not** sign off on
    "close enough."
  - This check is what catches the prior failures directly: it exposes invented/from-scratch content
    (content won't match the live docs), redundant `*-icon`/`*-image`/`*-link`/`*-variant` files (no
    counterpart on the live docs page — delete them), and primitive drift like the item-media `icon` bg box
    (the border won't match live).

- **(B) MANDATORY — workbench filter sweep. Walk EVERY "Editing" dropdown entry.** Start `bun run dev:web`
  (API on `:3000`; web auto-picks a free port — **confirm it's this worktree's**; foreign apps may hold
  `517x`). With playwright, `goto /components/<name>`, screenshot the **demo section** (all demos render and
  match the live-docs screenshots from A), then **open the "Editing" dropdown and screenshot the resolved
  preview for EVERY entry in it** — do not spot-check:
  - **every slot** — walk the full `data-slot` list, **explicitly including `footer`, `media`, and
    `separator`.** Each resolves to a one-instance preview (`from <label>`). A slot that shows "Not present"
    or an empty preview is a defect (rule 7).
  - **every variant** — each resolves to its representing demo, on a shape where the border/fill actually
    reads (`default` → group demo, `outline` → main demo, `muted` → the flipped item).
  - **every size, including `xs`** — each resolves via the sized item across the demos / the tiny `xs` size
    demo. `xs` **must** be present (rule 5); a missing `xs` is a defect.
  - **every context** — `context-a`/link → a real `<a>`; `[&_svg]` / `[&_img]` where present.
  - **confirm what appears under `item-media`** (or the equivalent media slot) — the icon/image variant
    resolves to the right demo (image → the group demo's `<img>`), not "Not present."
  - for a **portal**, the force-open content slot + inner slots resolve via the `examples/` override.
  - **The dropdown itself must list every variant and size the cva defines.** Cross-check the dropdown's
    axis entries against the vendored cva — if the cva defines `xs` (or any variant/size) and the dropdown
    doesn't list it, the cva sync or the live-cva wiring is wrong; fix it (rule 5) so **every** cva
    variant/size is selectable.
  - Editing a **variant** and an `[a]` / `[&_svg]` context still **paints live**.
  - **Every entry MUST resolve to a correct demo — none "Not present," none empty, none the wrong demo,
    none a synthetic fallback.** Any such entry is a defect — fix the demo/override (or its slot/variant/size
    emission, or the cva sync) and re-screenshot.

- **Done (per component):** demos are 100% real shadcn ports, **screenshot-verified against the live docs**
  (content + borders + icon boxes + spacing all match, per A) · the vendored primitive **matches its
  radix-nova style source** byte-faithfully (no invented classes — e.g. no item-media `icon` bg box; cva
  carries every size incl. `xs`) · the demo set is the **fewest files** that cover every slot (no redundant
  `*-icon`/`*-image`/`*-link`/`*-variant` files; the main demo shows one item, not a variant showcase; only
  the sanctioned tiny `xs` size demo beyond slot coverage) · **every** slot has a live example (incl.
  `footer`, `media`, `separator`) · **every** dropdown entry (each slot / each variant / each size incl.
  `xs` / each context) resolves to a real demo or override — none "Not present," zero synthetic — and the
  dropdown lists **every** variant/size the cva defines, confirmed by workbench screenshot (per B) · portals
  expose content+inner slots via an `examples/` override · this component's legacy `previews` / `openRenders`
  entry **deleted** · gate green · both (A) and (B) screenshots verified · committed to `main` (`feat:
  workbench demos for <name>` — one commit per component).

## Orchestration & conflict model

- **Orchestrator owns every shared edit + all verification + all commits.** Shared/global files:
  `demo-scene.tsx` (only if the generic scene needs a fix — normally untouched), `components/ui/<name>.tsx`
  (the vendored primitive — synced to its radix-nova style source at stage 6; never a sub-agent),
  `previews.tsx` / `open-renders.tsx` (legacy deletions), `biome.json` (folder override),
  `test/render-smoke.test.tsx`, the route. Sub-agents **never** touch these.
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
