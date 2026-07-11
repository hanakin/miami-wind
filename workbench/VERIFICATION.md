# Workbench Verification

The list of **automated verifications** for the workbench — every entry is a test that **runs**. There is
**no human step** in this file. If something needs a person's judgment or input, it is not a verification —
it belongs in the rubric (as instructions) and in the plans, not here.

Each verification carries a **type-tagged id** so the id tells you what kind of test it is:

| Type | ID | Tool | Falls here when… |
| --- | --- | --- | --- |
| Unit | `UT-n` | Vitest | isolated logic / a function in isolation |
| Lint | `LT-n` | Biome | source-convention rules (naming, one export, imports swapped) |
| Integration | `IT-n` | Vitest / Playwright | it's in relation to another component |
| Functional | `FN-n` | Playwright | it's how you interact with it |
| UI / visual | `UI-n` | Playwright | it's anything visual — render, look, screenshot-diff |
| End-to-end | `EE-n` | Playwright | a full flow across the stack (edit → save → reload) |
| Regression | `RG-n` | Vitest / Playwright | re-verifies a known-good baseline to catch drift |

Each verification exists to **catch a specific gotcha**. When the build turns up a new gotcha, it becomes a
new test here — gotcha found → test added → the gotcha can't come back.

**How the tests run:** authored per `plans/verification-test-plan.md`. The gate is `bun run check`
(Biome + tsc + Vitest) — that's the runner, not a test. UI/functional/e2e tests run under Playwright
(`playwright-core` + Chrome; dev app on `:5175`, per component). Every target list is built from
`GET /api/models` (`server/lib/component-model.ts`), never by eye.

Terms (`slot`, `cva`, `context`, `demo`, `requirement set`, `deviation`, `resolved component`) carry their
workbench meaning; this file assumes them.

---

## Unit — Vitest

### UT-1 — every demo mounts
Every demo renders without throwing, and no Editing-dropdown choice shows "Not present". (Run by the gate,
`bun run check`.)

```ts
expect(() => render(<Demo/>)).not.toThrow();          // the demo loads
expect(screen.queryByText(/Not present/)).toBeNull(); // every choice shows
```

*Catches:* a demo that throws on mount, or an editor target that resolves to nothing.

### UT-2 — every class on the part is shown
When you pick a part, the Raw-classes list shows **every** selector on it — `[&_svg]:…`, `hover:`,
`focus-visible:`, `disabled:`, `aria-*`, `data-*`, and arbitrary `[...]` values — not a curated subset.

```ts
expect(classesShown(slot)).toEqual(allClassesOn(element));
```

*Catches:* a partial class list that silently hides selectors from editing.

### UT-3 — states fold into the five interaction words
The reader collapses every engaged code-state into the five hard-set words: `visited:` and engaged
`aria-*` / `data-[state=…]` (open / checked / on / selected / pressed) fold into **Active**; `disabled` /
`aria-disabled` / `data-disabled` into **disabled**. The Interaction menu never shows a raw selector — this
is what makes `toggle`'s `aria-pressed` read as Active.

```ts
expect(segmentInteraction("data-[state=checked]")).toBe("active");
expect(segmentInteraction("aria-pressed")).toBe("active");
expect(segmentInteraction("data-disabled")).toBe("disabled");
expect(menuWords(component)).toEqual(["default","hover","focus","active","disabled"]);
```

*Catches:* a raw state selector leaking into the Interaction menu, or an engaged state not folding to Active/disabled.

---

## Lint — Biome

### LT-1 — fewest demos, no authored demo code
Start from shadcn's own demos for the component. Pack their small pieces (icon, avatar, action button) into
as **few** demo files as cover the requirement set. Pieces are **moved and merged**, never authored new. The
plain single-instance demo stays as-is. No `<name>-icon` / `-variant` / `-states` showcase files.

*Catches:* showcase-file sprawl and hand-written demo markup. (No-new-code is also confirmed by UI-1.)

### LT-2 — one demo per file, one export
Each demo file holds one demo and exports one thing (`export function XDemo(){…}`). No multi-export files,
no parameterized demo factories.

*Catches:* kitchen-sink files and demo factories that hide coverage.

### LT-3 — the demo is structurally complete
A demo carries the containment its slots need to read — **never a lone atom** (G5). Render each piece with
the structure it needs: a transparent `item` wants a group with separators; `field` / `form` want their card
/ container wrappers. shadcn often groups pieces only visually and never wraps them in code, so a faithful
port is a flat, uncontained slew and the slots don't read. Add the missing structure (containers only —
never invented content).

```ts
expect(demoTree(component)).toContainStructure(neededContainers(component)); // slots read in context, no lone atoms
```

*Catches:* any lone-atom demo whose slots have no surrounding structure to read in (not just `field`/`form`).

### LT-4 — the default demo is the top-left one
The base file `demo/<name>/<name>.tsx` sorts first (localeCompare) and is the component's default view —
the plain, one-instance demo, usually shadcn's first (G3).

```ts
const files = demoFiles(name).sort();          // localeCompare
expect(files[0]).toBe(`${name}.tsx`);          // base sorts first
expect(defaultView(name)).toBe(`${name}.tsx`); // = the top-left view
```

*Catches:* a variant or facet demo landing as the default view instead of the plain base.

### LT-5 — the porting swaps are applied
Every demo ported from shadcn applies the standing swaps: UI imports point at `~/components/ui/<name>` (G8);
every icon renders through our `Icon` component — never lucide, never a built-in icon primitive, and **never
with a size set** (G9); images use a plain `<img>`, never `next/image` (G10).

```ts
const src = readDemo(file);
expect(src).not.toMatch(/from ["']lucide-react["']/);     // Icon component only
expect(src).not.toMatch(/from ["']next\/image["']/);      // plain <img>
expect(uiImports(src)).toMatchPath(/~\/components\/ui\//); // swapped paths
expect(iconSizeProps(src)).toEqual([]);                   // no size on Icon
```

*Catches:* a lucide/built-in icon, a sized icon, a `next/image`, or an unswapped import path in a demo.

---

## Integration — Vitest / Playwright

### IT-1 — everything the editor can point at shows up
Build the list of every slot, every cva option, every context **from the component (the model)**, then
assert each appears in a demo. Walk the list — never eyeball it.

```ts
for (const target of whatTheEditorCanTarget(component))
  expect(demos).toShow(target); // slots + variant/size options + contexts
```

*Catches:* a target the editor exposes but no demo surfaces.

---

## Functional — Playwright

### FN-1 — every dropdown choice shows the right thing
Walk **every** Editing-dropdown choice: each slot shows its piece, each cva option its view, each context
its element. Nothing shows empty, "Not present", wrong, or made-up. The choice list is **built from the
model** (same source as IT-1), so a variant with no `data-variant` to spotlight — e.g. `alert` — still
appears and stays editable.

```ts
expect(dropdown.choices()).toEqual(whatTheEditorCanTarget(component)); // built from the model — incl no-data-variant variants
for (const choice of dropdown.choices()) {
  await pick(choice);
  expect(preview).not.toShow("Not present");
  expect(preview).toBeVisible();
}
```

*Catches:* a dropdown choice that resolves to nothing or the wrong element; a cva out of sync; a no-`data-variant` variant (e.g. `alert`) dropped from the list.

### FN-2 — every state shows and can be edited
The editor **forces** each state — pseudo (hover / focus / active / disabled) and real
(`data-[state]=checked|pressed|active|open`, or the prop) — shows it, and edits that state's classes. Focus
is a background/border shift, never a ring. Special-render hovers count: `chart`'s bar hover is an SVG
element and must still be reachable and editable.

```ts
await pickState("data-[state=active]");
expect(preview).toHaveAttribute("data-state", "active");
await editClass("bg-accent");
expect(activeLook()).toBe("accent");
```

*Catches:* a state you can't reach at rest, so its classes were never editable.

### FN-3 — every real part is its own editable slot
Every sub-part is a slot you can point at, and it shows. Two cases: lumped parts (a `command` row's icon +
label are one element — split them) and JS-set parts (`calendar` builds day cells / month arrows / weekday
row in JS — give them `data-slot`). A slot that only appears under a **condition** — forced state, broken
image, overflow, off-canvas, loading — gets that condition triggered so it appears (`avatar` fallback,
`scroll-area` bar, `sidebar` off-canvas, `carousel` offscreen slides).

*Catches:* parts that are invisible/uneditable because they're lumped, JS-built, or conditional.

### FN-4 — hidden-until-clicked things are shown by default
Menus, dialogs, drawers render **open** by default, **stay** open while you edit (a click can't hide them),
and never throw a page-freezing error. A transient surface with no resting state counts — `sonner`: render a
sample toast, always visible.

```ts
expect(content).toBeVisible();                         // at rest
await click(elsewhere); expect(content).toBeVisible(); // still open
expect(consoleErrors).toHaveLength(0);
```

*Catches:* revealed content you can't edit because it's hidden or closes on interaction.

### FN-5 — controls follow selection; the list doesn't jump
Picking a slot or state fills the controls with **that** target's real values (not stale/default). The left
component list re-sorts only on **Save**, never the moment you pick one.

```ts
await select(componentX);
expect(listOrder()).toEqual(before); // no reorder until Save
```

*Catches:* stale controls after a pick, and the list jumping out from under you.

### FN-6 — label ↔ control edits as one
For a control a label operates — `checkbox`, `radio-group`, `switch` — the editor exposes the label and
control as **one linked target** and lets you edit the label's affordance (e.g. `cursor:pointer`). Editing
applies, and clicking the label still operates the control.

```ts
await select("checkbox");
await editLabelClass("cursor-pointer");
expect(labelHasClass("cursor-pointer")).toBe(true); // affordance is editable
expect(clickingLabel()).toToggle(control);          // label + control are one unit
```

*Catches:* label and control editable only separately; a label affordance that doesn't hold.

---

## UI / visual — Playwright

### UI-1 — the demo matches the installed component
We **grab from shadcn's demos** as the source (the shadcn page carries both the radix and base-ui versions —
use base-ui), but render with **nova style** — a slight visual difference from shadcn's own. So the visual
reference is the **installed component rendered directly**, not shadcn.com. Compare content, borders, icon
boxes, spacing. Two stages, because pieces move when demos consolidate:
- **Stage 1:** each demo, grabbed straight from shadcn, matches the installed component.
- **Stage 2:** the consolidated demos add **no new code** — every line traces to a stage-1 grab.

```ts
expect(diff(grab, installedRender)).toBeLessThan(THRESHOLD); // grab from shadcn == installed (nova-styled) component
expect(everyLine(final)).toComeFrom(grabs);                  // no new code
```

*Catches:* a demo that distorts the component, or consolidation that quietly authored markup.

> **Nova-style note:** demos come from shadcn (the source); nova restyles slightly, so compare to the
> installed nova-styled component, not shadcn.com — the threshold + baseline need confirming once real
> base-ui/nova renders exist (currently untested).

### UI-2 — no sloppy styling
None of the anti-patterns the real component never does: a bare icon in a background box; non-standard button
padding; something stretched that shouldn't be; an icon where a button belongs.

*Catches:* known bad patterns (icon boxes, odd padding, stretch, icon-as-button) per component.

### UI-3 — each thing keeps its own width, never stretched
Each component shows at its **own** width: a width it sets, else only as wide as its content — never
stretched to fill the page, no flex forcing a width, and no demo self-imposing `w-full` on its root.

```ts
const box = await el.boundingBox();
expect(box.width).toBeLessThan(page.width);     // never full-bleed
expect(box.width).toBeCloseTo(el.contentWidth); // as wide as its content
```

*Catches:* a component stretched full-bleed so its real proportions can't be judged.

---

## End-to-end — Playwright

### EE-1 — edit → Save → reload all stick
An edit shows immediately, **Save all** persists it, and a full reload loads it back and shows it. The whole
loop, reload included.

```ts
await edit(slot, "bg-red-500"); expect(look()).toBe("red"); // now
await saveAll(); await reload();
expect(saved(slot)).toContain("bg-red-500");                // saved
expect(look()).toBe("red");                                 // AND on screen
```

*Catches:* the known break — Save writes but the edit never loads/applies on reload.

---

## Regression — Vitest

### RG-1 — the vendored component matches shadcn source
The vendored `components/ui/<name>.tsx` matches the plain shadcn source it was generated from (the base-ui
variant), unmodified — nova's style lives in the separate cva / theme layer, not the component file. The
user's registry overrides layer on top of the finished demos; they are never baked into the base component.

```ts
expect(vendored("<name>")).toMatchShadcn(); // equals shadcn's base-ui source; overrides + nova style layered on
```

*Catches:* a vendored component that has drifted from upstream shadcn, or overrides baked in early.

---

## Engine-gated checks

Five functional/e2e checks force editor capabilities that ship with the engine — build each test as its
capability lands; until then it is **skipped with a reason**, never deleted: **FN-2** (force-state),
**FN-4** (force-open), **FN-3** (per-part slots), **EE-1** (save→reload), **FN-6** (label↔control). All
tests are authored in `plans/verification-test-plan.md`.
