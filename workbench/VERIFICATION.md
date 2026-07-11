# Workbench Verification

The list of **automated verifications** for the workbench — every entry is a test that **runs**: the
build gate, a Vitest unit test, or a Playwright UI test. There is **no human step** in this file. If
something needs a person's judgment or input, it is not a verification — it belongs in the rubric (as
instructions) and in the plans, not here.

Each verification exists to **catch a specific gotcha** — a concrete way a demo or the editor has gone
wrong. When the build turns up a new gotcha, it becomes a new test here. That is how this list is
created and maintained: gotcha found → test added → the gotcha can't come back.

**How the tests run:** authored per `plans/verification-test-plan.md`. The gate is `bun run check`
(Biome + tsc + Vitest). UI tests run under Playwright (`playwright-core` + Chrome; launch the dev app
on `:5175`, navigate per component). The coverage source is `GET /api/models`
(`server/lib/component-model.ts`) — build every target list from the model, never by eye.

Terms (`slot`, `cva`, `context`, `demo`, `requirement set`, `deviation`, `resolved component`) carry
their workbench meaning; this file assumes them.

---

## The gate — runs on every commit

### GATE — the build passes
`bun run check` (format + types + tests) is green, and every demo mounts with no Editing-dropdown
choice rendering "Not present".

```ts
expect(() => render(<Demo/>)).not.toThrow();          // the demo loads
expect(screen.queryByText(/Not present/)).toBeNull(); // every choice shows
```

*Catches:* a demo that throws on mount, or an editor target that resolves to nothing.

---

## Unit tests (Vitest)

### FEW — fewest demos, no authored demo code
Pack the component's own demo pieces (icon, avatar, action button) into as **few** demo files as
cover the requirement set. Pieces are **moved and merged**, never authored new. The plain
single-instance demo stays as-is. No `<name>-icon` / `-variant` / `-states` showcase files.

*Catches:* showcase-file sprawl and hand-written demo markup. (No-new-code is also confirmed by LOOK.)

### ONE — one demo per file, one export
Each demo file holds one demo and exports one thing (`export function XDemo(){…}`). No multi-export
files, no parameterized demo factories.

*Catches:* kitchen-sink files and demo factories that hide coverage.

### BASE — plain component first; user changes layered, not baked
Demos are built against the **plain installed component**: the vendored `components/ui/<name>.tsx`
matches the base component it was generated from (base-ui / nova), unmodified. The user's registry
overrides layer on top of the finished demos — intentional, never "corrected" back, never baked into
the base demo early.

```ts
expect(vendored("<name>")).toMatchBase(); // equals the base-ui/nova source; overrides sit on top
```

*Catches:* demos built against an already-customized component, or overrides baked in too early.

### CLS — every class on the part is shown
When you pick a part, the Raw-classes list shows **every** selector on it — `[&_svg]:…`, `hover:`,
`focus-visible:`, `disabled:`, `aria-*`, `data-*`, and arbitrary `[...]` values — not a curated subset.

```ts
expect(classesShown(slot)).toEqual(allClassesOn(element));
```

*Catches:* a partial class list that silently hides selectors from editing.

### STRUCT — the demo is structurally complete
A demo carries the containment its slots need to read, even when the component's own demo omits it.
`field` / `form` are the case: shown grouped visually but never wrapped in code, so a faithful port is
a flat, uncontained slew and the slots don't read. Add the missing structure (containers only — never
invented content).

```ts
expect(demoTree(field)).toContainStructure(expectedWrappers); // cards/groups present, nesting reads
```

*Catches:* uncontained ports whose slots have no context to read in.

---

## UI tests (Playwright, per component)

### COV — everything the editor can point at shows up
Build the list of every slot, every cva option, every context **from the component (the model)**, then
assert each appears in a demo. Walk the list — never eyeball it.

```ts
for (const target of whatTheEditorCanTarget(component))
  expect(demos).toShow(target); // slots + variant/size options + contexts
```

*Catches:* a target the editor exposes but no demo surfaces.

### LOOK — the demo matches the installed component
Screenshot-compare each demo to the **installed component rendered directly** — base-ui / nova under
the Miami Wind theme, **not** upstream shadcn.com. Content, borders, icon boxes, spacing. Two stages,
because pieces move when demos consolidate:
- **Stage 1:** each demo, straight from the component's own demo material, matches the installed component.
- **Stage 2:** the consolidated demos add **no new code** — every line traces to a stage-1 source.

```ts
expect(diff(grab, installedRender)).toBeLessThan(THRESHOLD); // matches the installed component
expect(everyLine(final)).toComeFrom(sources);                // no new code
```

*Catches:* a demo that distorts the component, or consolidation that quietly authored markup.

> **Baseline check (base-ui / nova):** the reference is the **installed** component, not upstream
> shadcn — the base and theme differ, so an upstream pixel compare would fail for the wrong reason.
> The threshold + baseline need confirming once real base-ui/nova renders exist (currently untested).

### STYLE — no sloppy styling
None of the anti-patterns the real component never does: a bare icon in a background box; non-standard
button padding; something stretched that shouldn't be; an icon where a button belongs.

*Catches:* known bad patterns (icon boxes, odd padding, stretch, icon-as-button) per component.

### PICK — every dropdown choice shows the right thing
Walk **every** Editing-dropdown choice: each slot shows its piece, each cva option its view, each
context its element. Nothing shows empty, "Not present", wrong, or made-up.

```ts
for (const choice of dropdown.choices()) {
  await pick(choice);
  expect(preview).not.toShow("Not present");
  expect(preview).toBeVisible();
}
```

*Catches:* a dropdown choice that resolves to nothing or the wrong element; a cva out of sync.

### STATE — every state shows and can be edited
The editor **forces** each state — pseudo (hover / focus / active / disabled) and real
(`data-[state]=checked|pressed|active|open`, or the prop) — shows it, and edits that state's classes.
Focus is a background/border shift, never a ring. Special-render hovers count: `chart`'s bar hover is
an SVG element and must still be reachable and editable.

```ts
await pickState("data-[state=active]");
expect(preview).toHaveAttribute("data-state", "active");
await editClass("bg-accent");
expect(activeLook()).toBe("accent");
```

*Catches:* a state you can't reach at rest, so its classes were never editable.

### LIVE — edit → Save → reload all stick
An edit shows immediately, **Save all** persists it, and a full reload loads it back and shows it. The
whole loop, reload included.

```ts
await edit(slot, "bg-red-500"); expect(look()).toBe("red"); // now
await saveAll(); await reload();
expect(saved(slot)).toContain("bg-red-500");                // saved
expect(look()).toBe("red");                                 // AND on screen
```

*Catches:* the known break — Save writes but the edit never loads/applies on reload.

### SLOT — every real part is its own editable slot
Every sub-part is a slot you can point at, and it shows. Two cases: lumped parts (a `command` row's
icon + label are one element — split them) and JS-set parts (`calendar` builds day cells / month
arrows / weekday row in JS — give them `data-slot`). A slot that only appears under a **condition** —
forced state, broken image, overflow, off-canvas, loading — gets that condition triggered so it appears
(`avatar` fallback, `scroll-area` bar, `sidebar` off-canvas, `carousel` offscreen slides).

*Catches:* parts that are invisible/uneditable because they're lumped, JS-built, or conditional.

### SHOW — hidden-until-clicked things are shown by default
Menus, dialogs, drawers render **open** by default, **stay** open while you edit (a click can't hide
them), and never throw a page-freezing error. A transient surface with no resting state counts —
`sonner`: render a sample toast, always visible.

```ts
expect(content).toBeVisible();                         // at rest
await click(elsewhere); expect(content).toBeVisible(); // still open
expect(consoleErrors).toHaveLength(0);
```

*Catches:* revealed content you can't edit because it's hidden or closes on interaction.

### WIDE — each thing keeps its own width, never stretched
Each component shows at its **own** width: a width it sets, else only as wide as its content — never
stretched to fill the page, no flex forcing a width, and no demo self-imposing `w-full` on its root.

```ts
const box = await el.boundingBox();
expect(box.width).toBeLessThan(page.width);     // never full-bleed
expect(box.width).toBeCloseTo(el.contentWidth); // as wide as its content
```

*Catches:* a component stretched full-bleed so its real proportions can't be judged.

### SYNC — controls follow selection; the list doesn't jump
Picking a slot or state fills the controls with **that** target's real values (not stale/default). The
left component list re-sorts only on **Save**, never the moment you pick one.

```ts
await select(componentX);
expect(listOrder()).toEqual(before); // no reorder until Save
```

*Catches:* stale controls after a pick, and the list jumping out from under you.

### AFFORD — label ↔ control edits as one
For a control a label operates — `checkbox`, `radio-group`, `switch` — the editor exposes the label
and control as **one linked target** and lets you edit the label's affordance (e.g. `cursor:pointer`).
Editing applies, and clicking the label still operates the control.

```ts
await select("checkbox");
await editLabelClass("cursor-pointer");
expect(labelHasClass("cursor-pointer")).toBe(true); // affordance is editable
expect(clickingLabel()).toToggle(control);          // label + control are one unit
```

*Catches:* label and control editable only separately; a label affordance that doesn't hold.

---

## Check ↔ when it runs

| Check | Kind | When |
| --- | --- | --- |
| GATE | gate | every commit (`bun run check`) |
| FEW · ONE · BASE · CLS · STRUCT | unit (Vitest) | `bun run check`, per component |
| COV · LOOK · STYLE · PICK · STATE · LIVE · SLOT · SHOW · WIDE · SYNC · AFFORD | ui (Playwright) | per component |

The UI checks that force editor behavior — STATE (force-state), SHOW (force-open), SLOT (per-part),
LIVE (save→reload), AFFORD (label↔control) — exercise engine capabilities. Build each test as its
capability lands; until then it is **skipped with a reason**, never deleted. All tests are authored in
`plans/verification-test-plan.md`.
