# Workbench Verification

The acceptance contract for the workbench. It defines what **"done"** means — for the
editor itself (the "engine") and for each component's demos. Every stage of the rework is
gated by the relevant checks below; a component or engine change is not done until they pass.

This file is the source of truth. The rubric mirrors it visually in **§10 Verification**
(`plans/html/rubric.html`). When the two disagree, this file wins — update it first, then §10.

## How it's used

- **18 checks, three groups:** rules a person reviews, unit tests (Vitest), and UI tests
  (Playwright). Each check names the exact assertion its test must make.
- **The gate is `bun run check`** (Biome + tsc + Vitest). The UI checks run under Playwright
  (`playwright-core` + Chrome are available; reuse the `/tmp/wb-*.mjs` pattern). The suites are
  built per the **verification test plan** (`plans/verification-test-plan.md`) and then gate every
  component through both demo passes (rubric §13–§14).
- **Feedback is additive.** New checks agreed later get appended to the right group here and
  reflected in the rubric's §10 — the IDs (`LIVE`, `SLOT`, …) are stable.

Terms (`slot`, `cva`, `context`, `demo`, `requirement set`, `deviation`, `resolved component`) are
the rubric's vocabulary; this file assumes them.

---

## Group 1 — Rules you review

A person or the build checks these; there is no single automated assertion.

### GATE — The build passes
Every commit runs `bun run check` (format + types + tests). Red means stop — no exceptions.
It also mounts every demo and confirms no dropdown choice renders "Not present".

```ts
expect(() => render(<Demo/>)).not.toThrow();          // the demo loads
expect(screen.queryByText(/Not present/)).toBeNull(); // every choice shows
```
Enforced: the build, on every commit.

### LOG — Every demo change is logged and tiny
A demo starts as shadcn's real demo. If you must change one to show a variant/size/state that
no demo shows yet, make the **smallest** change (flip one variant, set one size), **one** change
per demo, and record it in that component's ledger. An un-logged change, or more than one per
demo, is a defect. (This is only about variations you turn on — moving pieces between demos to
consolidate is allowed and separate; see FEW.)

```
# ledger (per component)
item-header : flipped one card to variant="muted"   → shows the muted variant
item-link   : set size="sm" on the link             → shows the small size
```
Enforced: reviewed by a person; the ledger ships with the PR.

---

## Group 2 — Unit tests (Vitest)

### FEW — Fewest demos, reuse shadcn's pieces, write no new code
Start from shadcn's own demos for the component. Pack their small pieces (icon, avatar, action
button) into as **few** demo files as cover the requirement set. You **move and merge** pieces —
you never author new demo code. The plain single-instance demo stays as-is. No
`<name>-icon` / `-variant` / `-states` files.
Enforced: unit — demo count is the fewest for the set; no forbidden showcase files. ("Write no
new code" is confirmed by LOOK, stage 2.)

### ONE — One demo per file, one export
Each demo file holds one demo and exports one thing (`export function XDemo(){…}`). No
multi-export files, no parameterized demo factories.
Enforced: unit — one exported demo per file.

### BASE — Plain component first; user changes last
Build the demos against the **plain** shadcn component; the vendored
`components/ui/<name>.tsx` must match shadcn's source. The user's registry overrides (added or
edited variants/slots) layer on top of the finished demos — they are intentional and are never
"corrected" back to plain shadcn, and never baked into the base demo early.
Enforced: unit — vendored component matches source; overrides layered, not baked in.

### CLS — Every class on the part is shown
When you pick a part, the Raw-classes list shows **every** selector on it —
`[&_svg]:pointer-events-none`, `hover:`, `focus-visible:`, `disabled:`, `aria-*`, `data-*`, and
arbitrary `[...]` values — not a curated subset. Nothing is hidden from editing.

```ts
expect(classesShown(slot)).toEqual(allClassesOn(element));
```
Enforced: unit — the shown list equals the real class list.

### STRUCT — The demo is structurally complete
A demo must carry the containment the component's slots need to read — even when shadcn's own
demo omits it. `field` / `form` are the case: shadcn shows the fields grouped visually but never
wraps them in cards/containers in code, so a faithful port is a flat, uncontained slew and the
slots don't read in context. Add the missing structure. A structurally incomplete demo is a
defect. This is a **sanctioned exception to FEW / LOOK's "no new code"**: you may add structural
containers shadcn omits — you may **not** invent content.

```ts
expect(demoTree(field)).toContainStructure(expectedWrappers); // cards/groups present, nesting reads
```
Enforced: unit + review — expected containers present; the composition reads in the editor.

---

## Group 3 — UI tests (Playwright, per component)

### COV — Everything the editor can point at shows up
Build the list of every slot, every option of every cva, and every context **from the
component**, then assert each one appears in a demo. Walk the list — do not eyeball it.

```ts
for (const target of whatTheEditorCanTarget(component))
  expect(demos).toShow(target); // slots + variant/size options + contexts
```
Enforced: unit + UI — list built from the component, each item checked present.

### LOOK — Matches the real component (two stages)
Screenshot-compare each demo to the real shadcn component — content, borders, icon boxes,
spacing. Two stages, because pieces move when demos are consolidated:
- **Stage 1 (first grab):** each demo, straight from shadcn, matches the real component.
- **Stage 2 (after consolidation):** the packed-down demos add **no new code** — every line
  traces back to a stage-1 grab.

```ts
expect(diff(grab, real)).toBeLessThan(THRESHOLD); // looks right
expect(everyLine(final)).toComeFrom(grabs);       // no new code
```
Enforced: UI — visual match, then a provenance check.

### STYLE — No sloppy styling
No anti-patterns the real component never does: a bare icon given a background box; a button
given odd, non-standard padding; something stretched that shouldn't be; an icon used where a
button belongs. If the real component doesn't do it, the demo doesn't either.
Enforced: UI — check the known bad patterns per component (icon boxes, button padding, stretch).

### PICK — Every dropdown choice shows the right thing
Walk **every** choice in the Editing dropdown: each slot shows its piece, each option its view,
each context its element. The dropdown lists every option of every cva (a missing one means the
cva is out of sync). Nothing shows empty, "Not present", wrong, or made-up.

```ts
for (const choice of dropdown.choices()) {
  await pick(choice);
  expect(preview).not.toShow("Not present");
  expect(preview).toBeVisible();
}
```
Enforced: UI — the main per-component sweep.

### STATE — Every state shows and can be edited
The editor **forces** the component into each state — pseudo (hover / focus / active / disabled)
and real (`data-[state]=checked|pressed|active|open`, or the prop) — shows it, and edits that
state's classes. Focus shows a background/border shift, never a ring (per DESIGN.md). Hover on a
special render counts: `chart`'s bar hover is an SVG element, and its hover effect must still be
reachable and editable.

```ts
await pickState("data-[state=active]");
expect(preview).toHaveAttribute("data-state", "active"); // turned on
await editClass("bg-accent");
expect(activeLook()).toBe("accent");                     // edits that state
```
Enforced: UI — force each state, confirm it shows and edits live.

### LIVE — Edit → Save → reload all stick
An edit shows immediately, **Save all** persists it, and a full page reload loads it back and
shows it. The whole loop, reload included — this is the app's whole point.

```ts
await edit(slot, "bg-red-500"); expect(look()).toBe("red"); // now
await saveAll(); await reload();
expect(saved(slot)).toContain("bg-red-500");                // saved
expect(look()).toBe("red");                                 // AND on screen
```
Enforced: UI — edit → save → reload → assert it stuck and shows.

### SLOT — Every real part is its own editable slot
Every sub-part is a slot you can point at and it shows up — never empty. Two cases to watch:
lumped parts (a `command` row's icon + label are one element — split them) and JS-set parts
(`calendar` builds day cells / month arrows / weekday row in JS — give them `data-slot`). A
slot that only appears under some **condition** — a forced state, a broken image, overflow,
off-canvas, or loading — gets that condition triggered so it appears (`avatar` fallback,
`scroll-area` bar, `sidebar` off-canvas slots, `carousel` offscreen slides).
Enforced: unit + UI — every slot (even code-made ones) shows; nothing lumped.

### SHOW — Hidden-until-clicked things are shown by default
Menus, dialogs, drawers render **open** by default, **stay** open while you edit (a click can't
hide them again), and never throw an error that freezes the page. Each part is its own slot. A
transient surface with no resting state counts too — `sonner`: render a sample toast
always-visible to edit.

```ts
expect(content).toBeVisible();                            // at rest
await click(elsewhere); expect(content).toBeVisible();    // still open
expect(consoleErrors).toHaveLength(0);
```
Enforced: UI — content present at rest and after a click; no console errors.

### WIDE — Each thing keeps its own width, never stretched
The preview shows each component at its **own** width: keep a width it sets; otherwise it is only
as wide as its content — never stretched to fill the page, and no flex layout forcing a width on
it. Also confirm a demo doesn't self-impose `w-full` on its root.

```ts
const box = await el.boundingBox();
expect(box.width).toBeLessThan(page.width);     // never full-bleed
expect(box.width).toBeCloseTo(el.contentWidth); // as wide as its content
```
Enforced: UI — measure the box; nothing wider than its content or the page.

### SYNC — Controls follow selection; the list doesn't jump
Picking a slot or state fills the controls with **that** target's real values (not stale or
default). The left component list re-sorts only on **Save**, never the moment you pick one.

```ts
await select(componentX);
expect(listOrder()).toEqual(before); // no reorder until Save
```
Enforced: UI — after picking, controls match the target; list order holds until Save.

### AFFORD — Label ↔ control edits as one (tests engine E8)
For a control a label operates — `checkbox`, `radio-group`, `switch` — the editor exposes the
label and control as **one linked target** and lets you edit the label's affordance (e.g. set
`cursor:pointer` on the label). Editing it applies, and clicking the label still operates the
control. This is the test for engine requirement **E8**; the editor capability is built in
Phase A, the test lands in Stage 4.

```ts
await select("checkbox");
await editLabelClass("cursor-pointer");
expect(labelHasClass("cursor-pointer")).toBe(true); // the affordance is editable
expect(clickingLabel()).toToggle(control);          // label + control are one unit
```
Enforced: UI — edit the label's affordance via the editor; confirm it applies and the pairing holds.

---

## Check ↔ when it runs

| Check | Kind | When |
| --- | --- | --- |
| GATE | review | every commit (`bun run check`) |
| LOG | review | per component, in its §13 ledger |
| FEW · ONE · BASE · CLS · STRUCT | unit (Vitest) | verification test plan; gates each component in both demo passes (rubric §14) |
| COV · LOOK · STYLE · PICK · STATE · LIVE · SLOT · SHOW · WIDE · SYNC · AFFORD | ui (Playwright) | verification test plan; gates each component in both demo passes |

The editor capabilities the UI checks exercise ship with the engine (rubric §14 stages): force-state
(STATE), force-open (SHOW), per-part slots (SLOT / CLS), the edit→save→reload loop (LIVE), and
label↔control-as-one-unit (AFFORD). The tests themselves are authored in the verification test plan.
