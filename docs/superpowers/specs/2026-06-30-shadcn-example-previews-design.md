# shadcn Example Previews in the Workbench Editor

- Date: 2026-06-30
- Status: Design (awaiting review)

## Problem

The per-component editor renders one hand-authored preview per component, keyed
by name in `workbench/src/components/previews.tsx`. These are invented
compositions ("self-rolled") that deviate from shadcn's real usage and don't
reflect how a component is actually used. Example: the `item` preview is a
single "Now playing" blob, but shadcn's Item ships **11** distinct examples and
shows **two** use cases in its demo alone — so the current preview matches
neither, and renders with weird deviations from what ships. The single whole-
component blob is also unhelpful when editing one slot, because it never focuses
on that slot.

## Goal

Replace the component editor's preview area with two stacked sections, both
sourced from shadcn's real radix examples:

1. **Top — Examples:** the component's full shadcn example set, rendered
   faithfully with *our* components and *our* icons.
2. **Bottom — Slot:** the currently-selected slot, extracted from those examples
   and shown isolated.

Nothing hand-invented: examples match shadcn's radix demos 1:1.

## Non-goals

- Migrating our vendored `ui/*` primitives off `lucide-react` internally. Only
  *example-authored* icons use our `<Icon>`.
- Re-routing or redesigning the scene gallery (theme canvas). It stays as-is.
- Authoring examples for the other 53 components in this effort (see Rollout).
- Click-to-source (`data-loc`) stamping of examples.

## Approach

### 1. Example files — hand-authored, static

- **Location:** `workbench/src/examples/<component>/<component>-<case>.tsx`,
  mirroring shadcn's radix example filenames (`item-demo.tsx`,
  `item-variant.tsx`, `item-icon.tsx`, …).
- **Source of truth:** each file is transcribed from shadcn's radix example
  (`apps/v4/examples/radix/<name>.tsx` in `shadcn-ui/ui`) to **match it 1:1**,
  with exactly two adaptations:
  - **Imports** → our aliases: `@/styles/radix-nova/ui/*` becomes
    `~/components/ui/*`. The existing `custom-resolve` Vite plugin then renders
    our promoted/modified registry version whenever one exists, so examples show
    what Miami Wind actually ships.
  - **Icons** → our icon component: replace `lucide-react` imports/usages with
    `<Icon icon="mdi:…" />` (iconify, prefer `mdi:`) or, where no good iconify
    equivalent exists, `<Icon type="custom" icon={Svg} />`. `Icon` comes from
    `@registry-ui/icon`. Choose the closest `mdi:` equivalent per lucide icon;
    keep sizing via `className` (e.g. `size-4`) as shadcn does.
- Each file exports a **named component** matching shadcn's export
  (`export function ItemDemo() { … }`).
- **Coverage:** the **full** shadcn example set per component, 1:1 with their
  docs (rolled out incrementally — see Rollout).

### 2. Static index

`workbench/src/examples/index.ts` — explicit `import`s of every example
component plus a hand-maintained map. No `import.meta.glob`, no codegen.

```ts
import { ItemDemo } from "./item/item-demo";
import { ItemVariant } from "./item/item-variant";
// …

export type ExampleEntry = {
  name: string;                 // "item-variant"
  label: string;                // "Variant"
  Component: React.ComponentType;
};

export const examples: Record<string, ExampleEntry[]> = {
  item: [
    { name: "item-demo", label: "Demo", Component: ItemDemo },
    { name: "item-variant", label: "Variant", Component: ItemVariant },
    // …all 11, in shadcn's docs order
  ],
  // …
};
```

### 3. Editor page — `ExamplePreview`

New component `workbench/src/components/example-preview.tsx`, rendered as the
component route's right pane (replacing `EditorPreview`). Its root carries
`data-preview` so the live-cva/slot CSS overlay (`live-css.ts`, scoped to
`[data-preview]`) reaches both sections.

- **Top — Examples:** for `examples[name]`, render each entry stacked under its
  `label`. These are real component renders; **cva edits reflect live** via the
  `live-cva` CSS overlay, and **slot edits reflect on Save** via HMR — same
  behavior as today's previews.
  - **Transitional fallback:** while the rollout is incomplete, a component with
    no authored examples renders its legacy `previews[name]` plainly (no states
    row, no variant spreading) under a subtle "legacy preview" label, so the
    editor stays fully functional for all components. Removed per component as
    real examples land.
- **Bottom — Slot `<sel.slot>`:** shown only when `sel.type === "slot"`. After
  the examples render, query the examples container for every
  `[data-slot="<sel.slot>"]`, dedupe by normalized `outerHTML`, and render each
  **isolated** via `dangerouslySetInnerHTML`, labeled by the example it came
  from. Snapshots preserve their `data-slot` / `data-variant` / `data-size`
  attributes, so the `[data-preview]`-scoped overlay styles them too (cva edits
  show without re-extraction). Re-extract via an effect keyed on
  `name`, `sel.slot`, and the slot/model store versions (a slot Save re-mounts
  the examples through HMR, which re-runs extraction).
  - Ceiling (ponytail): the isolated view is a **static** clone — no
    interactivity. Upgrade path if ever needed: source-level JSX extraction.

### 4. Wiring changes

- **`EditorLayout` (shared by theme + component routes):** make the right pane a
  prop instead of hardcoding `PreviewCanvas`.
  - Theme route (`app/index.tsx`): `preview={<PreviewCanvas />}` — **scenes stay**
    as the theme canvas (unchanged behavior).
  - Component route (`app/components.$name.tsx`):
    `preview={<ExamplePreview name={name} sel={sel} />}` — scenes dropped here.
- **Component list:** `ScopeSelect` (`app/__root.tsx:143`) lists the **union** of
  `Object.keys(examples)` and the installed `ui/*` set (or the server primitives
  list), so every component stays navigable during the rollout — not just the
  authored ones.
- **Remove** the prop-driven **"states" row** and `selectionVariantProps`
  spreading from the component preview. Variants/sizes are shown by shadcn's own
  `-variant` / `-size` examples; the forced-states row is dropped (can return
  later as CSS forced-state classes applied to the isolated slot, if wanted).
- **`previews.tsx`** is kept as the transitional fallback (above) and **deleted
  once every component has authored examples**. `SourcePanel` (read-only source
  for custom primitives) is retained below the examples on the component route.
  `OpenRender` is dropped from the route (it was part of the self-rolled preview
  approach). — *flag for review.*

### 5. Fallback set (the two components with no shadcn radix example)

Of our 56 editor components, **54 have radix examples**; **2 do not**:

- **`form`** — shadcn documents Form via react-hook-form, no `form-*` example
  set. Migrate the current `FormPreview` into
  `src/examples/form/form-demo.tsx`. — *you review.*
- **`icon`** — this is *our* component (`@registry-ui/icon`), not shadcn's.
  Author `src/examples/icon/icon-demo.tsx` from the current icon preview. —
  *you review.*

Both become normal example files early in the rollout. `previews.tsx` survives
only as the transitional fallback for not-yet-authored components and is deleted
when coverage is complete, leaving a single mechanism.

## Rollout

1. **Machinery:** examples dir convention, `index.ts` shape, `ExamplePreview`
   (top + bottom + extraction), and the wiring changes in §4.
2. **Reference implementation — Item:** author all 11 examples
   (`item-demo, -variant, -size, -icon, -avatar, -image, -group, -header, -link,
   -dropdown, -rtl`). Verify the top matches shadcn's docs page and selecting
   `item-title` / `item-media` / etc. extracts the sub-slot.
3. **Fallbacks:** migrate `form` + `icon` to example files.
4. **Follow-on (separate effort):** author the remaining 53 components' full
   example sets — real volume (`input-group` 24, `input` 15, `button` 14,
   `sidebar` 14, `dropdown-menu` 13, `field` 13, … ≈ 400 files total), done
   per-component by priority.

## Testing

Workbench uses vitest. Add:

- **Index integrity:** every `ExampleEntry` has a defined `Component` and a
  non-empty `label`; every key in `examples` is a known component.
- **`ExamplePreview` smoke (Item):** renders all example labels; with a slot
  selection, extraction yields ≥1 snapshot containing `data-slot="<slot>"`.

Manual: run the workbench, open Item — confirm the top mirrors shadcn's docs,
select a few slots and confirm extraction, edit a slot class + Save and confirm
both sections update; confirm the theme route's scene canvas is unchanged.

## Ceilings (ponytail)

- Bottom extraction is a static DOM snapshot; re-syncs on HMR/store change.
  Upgrade to source-level JSX extraction only if the isolated slot ever needs to
  be interactive.
- lucide→`mdi:` icon mapping is a manual per-icon judgment during authoring;
  introduce a lookup table only if the same mappings recur enough to hurt.
