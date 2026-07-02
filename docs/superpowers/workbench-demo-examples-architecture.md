# Workbench demo/examples architecture — design spec

## Problem

The workbench editor's per-component previews were built wrong. `workbench/src/examples/index.ts` holds
four parallel maps (`examples`, `primaryExamples`, `variantExamples`, `contextExamples`); demo files
cram multiple exports (`ItemPrimary` lives inside `item-demo.tsx`); and the **filter** section (the
focused slot/variant/context preview) renders **synthetic** components (`ItemPrimary`, `ItemLinkExample`)
instead of reusing the finalized demos. This spec redesigns the architecture, **fixes `item`**, and lays
the **groundwork for all other components** — a later pass ports the other components' demos.

## Architecture — two folders (both under `components/`)

Both live under `workbench/src/components/` — per AGENTS.md that's where composites go, and demos/examples
are composites of the `ui/` primitives.

- **`workbench/src/components/demo/<component>/<demo>.tsx` — the demo section.** One finalized, proper
  shadcn demo per file. **One concern per file** — no synthetic/parameterized components, no multi-export
  files. Ported from real shadcn source (`apps/v4/examples/radix`), with our imports/icons.
  - **The canonical demo `<component>.tsx` is sacred.** The frontmost singular version — the component's
    simplest single instance from shadcn's demo (for `item`: the one `variant="outline"` Basic Item) —
    lives in `<component>.tsx` (same name as the component, so it sorts first). It stays **untouched**;
    never alter it to cover a variant/size/context — those go in the other demos.
- **`workbench/src/components/examples/<component>/<filterKey>.tsx` — the filter section, override files
  ONLY.** A modified/forced render for a filter that *can't* just reuse a demo — e.g. an exploded,
  force-open dropdown menu so its hidden slots are reachable (the trigger filter still reuses the demo).
  **Sparse:** most components/filters have no file here. Absorbs the role of today's `open-renders.tsx`.

## The scene component (no registration files)

`workbench/src/components/demo-scene.tsx` replaces `example-preview.tsx`'s registration. It sits in
`components/`, so it **globs both sibling folders** — `import.meta.glob("./demo/*/*.tsx", { eager: true })`
and `("./examples/*/*.tsx", …)` — keyed by `component/file`. Adding a demo = dropping a file in
`components/demo/<component>/`; zero registration.

- **Demo section:** render every `demo/<selected>/*`, flex-wrapped, labelled by file.
- **Fallback (transition):** if a component has no `components/demo/<component>/` folder yet, fall back to
  the existing `previews` + `open-renders` for it — so the other 55 components keep working until the
  later pass. Only `item` and `separator` are migrated in this pass; the legacy path is deleted per
  component as each is migrated.
- **Filter section**, for the active selection:
  1. Compute a **filter key**: a slot → the `data-slot` name; a variant/size option → `<axis>-<option>`
     (e.g. `variant-outline`, `size-sm`); a context → `context-<name>` (e.g. `context-a`).
  2. If `components/examples/<selected>/<filterKey>.tsx` exists (from the glob) → render that **override**.
  3. Else **derive from the demos**:
     - **Slot** → extract the single default instance of that `data-slot` (existing DOM extraction, one
       instance — the default use).
     - **Variant / context** → render the **whole demo that represents it**: the first `demo/<selected>/*`
       whose rendered output contains a matching `[data-variant="<opt>"]` / `[data-size="<opt>"]` / an
       `<a data-slot=…>` (for `context-a`). Whole demo, not one instance, so it reads (a lone transparent
       `default` item is meaningless; a link must be a real `<a>`).

Delete `src/examples/index.ts`'s maps, `primaryExamples`/`variantExamples`/`contextExamples`,
`ItemPrimary`, and `ItemLinkExample`. Keep the generic live-cva/context editing already shipped
(`e20fdaf`, `2d8180a`) — the inspector, `resolveState`, and target model are unchanged.

## Scope of THIS pass

### Item reference (fix it)
- Build `components/demo/item/`: `item` (the canonical, untouched `variant="outline"` Basic Item),
  `item-group`, `item-header`, `item-link`, `item-size` — each a proper shadcn radix demo, one file, our
  imports/icons. Together they cover every item `data-slot`, every `variant`/`size` option, and the `[a]`
  link context, so every filter resolves to a real demo. (There is **no** `item-icon`/`item-image`/
  `item-variant` file — icons, images, and each variant are folded **into** the demos above; see the
  rollout playbook's WORKFLOW rules.)
- **Item needs no `components/examples/` overrides.** Item-in-a-menu is *not* an item-specific context
  like `[a]`. `[a]:` styles live in item's own cva and only fire when it's an `<a>`, so they need the link
  demo. But an item inside a dropdown is just item (asChild-wrapped) placed in a menu **container** — its
  editable surface (cva + slots) is identical in or out of the menu, and `item.tsx` has no menu-specific
  pass-through styles. The menu (and its forced-open render) is the **dropdown-menu** component's concern;
  that override lives in `components/examples/dropdown-menu/`, built in the later pass. So the override
  *mechanism* is groundwork here, exercised by portal components later — item itself has none.
- Delete the old `src/examples/item/*` (crammed) files, the four `index.ts` maps, `ItemPrimary`,
  `ItemLinkExample`. Move the `separator` demo to `components/demo/separator/separator.tsx` (canonical name).

### Groundwork for others (set up, don't fill)
- The scene + two-folder + glob + filter-derivation are **generic** — any component's demos dropped into
  `components/demo/<component>/` just work.
- Portal forced-renders **stay in `open-renders.tsx` as the fallback** for now; migrating each portal's
  forced render into a `components/examples/<component>/` override file is per-component work in the later
  pass. This pass only proves the override *mechanism* (the scene checks the `examples/` folder first).
- **Overhaul the rollout playbook** `docs/superpowers/workbench-example-previews-rollout.md` to this
  architecture (two folders, glob scene, demo-per-file, filter override-or-derive, no maps), and reconcile
  `workbench-cva-context-editing.md`.

### Out of scope (later pass)
- Porting demos for the other 55 components. Filling `components/examples/` overrides for every portal
  component.

## Verification strategy

- **Gate:** `cd workbench && bun run check` green after each step (biome + tsc + vitest). Update
  `test/render-smoke.test.tsx` for the new structure — the glob scene mounts, per-component demos render,
  every item filter resolves to a demo (assert no synthetic fallback / "not present").
- **Visual (required — the user catches what code-only reasoning misses):** playwright (`playwright-core`
  + Chrome present; reuse the `/tmp/wb-*.mjs` pattern). Start `bun run dev:web` (API on `:3000`; web
  auto-picks a port — confirm it's *this* worktree; foreign apps may hold `517x`). For `item`, screenshot:
  (a) the demo section renders all demos and matches shadcn; (b) each filter — every slot (one instance),
  each variant (its representing demo), `size·sm`, `link (a)` — renders the right real demo; (c) editing a
  variant and the `[a]` hover still paints live.
- **Done when:** item demos match shadcn, every item filter resolves to a real demo (zero synthetic), gate
  green, screenshots verified, committed to `main` (one commit per coherent step).

## Execution — this pass (item + groundwork), orchestrated

1. **Demo authoring — parallel subagents (one per demo).** Each ports one `components/demo/item/<demo>.tsx`
   from `gh api "…/apps/v4/examples/radix/item-<x>.tsx"` with the swaps (lucide→`Icon` mdi,
   `next/image`→`<img>`, `@/registry/...`→`~/components/ui/...`, named export). Returns file contents; does
   not wire or commit.
2. **Scene + teardown — orchestrator.** Build `demo-scene.tsx` (glob, demo section, filter key + derive,
   legacy fallback), delete the four `index.ts` maps + `ItemPrimary`/`ItemLinkExample`, wire the route,
   integrate the demos.
3. **Rollout-playbook overhaul — one subagent (separate track).** Writes the later-pass plan (below).
4. **Integrate + verify + commit — orchestrator.** Gate + playwright per the verification strategy.

The QC-staged multi-agent pipeline is **later-pass only** — see below; it does not apply to this pass.

## Later pass (the rollout playbook — separate deliverable)

A subagent rewrites `docs/superpowers/workbench-example-previews-rollout.md` as the **later-pass** plan for
the other 55 components (and reconciles `workbench-cva-context-editing.md`). It must:
- describe the new architecture (two folders under `components/`, glob scene, demos-per-file, filter
  override-or-derive, no maps);
- **task the later pass with cleaning up the old way on its way out** — as each component migrates to
  `components/demo/`, delete its legacy `previews` / `open-renders` entry, until the legacy fallback and
  `example-preview.tsx` are gone;
- **codify a per-component multi-agent pipeline:** two demo-build agents → one demo-QC agent → (trailing,
  once demos pass) one example/override-build agent → one agent that fixes the demos from the example
  findings → one example-QC agent → **final QC decision by the orchestrator.**
