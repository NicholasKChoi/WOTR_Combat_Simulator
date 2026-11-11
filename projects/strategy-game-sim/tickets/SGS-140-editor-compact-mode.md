# SGS-140: Add a compact text-editor mode below 48rem of editor width

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.8
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (the change is CSS only; A1 to A3 are untouched and no `Paths:` entry guards the editor layout)
- **Unverified assumptions**: none (the acceptance spec runs in real Chromium, which is where container queries and `rem` units in them are resolved)
- **LOC estimate**: 40 (CSS in `workbench.module.css` and `step-annotation.module.css`, plus at most a container hook in `build-text-editor.tsx`; the spec and docs excluded)
- **Depends on**: SGS-128
- **On merge**: none
- **Source**: design/M9.md C14, "Editor compact mode (M9.8)" behavior rules, criteria map row M9.8; owner decision 2A

## Context

At 390 px the text column of the build editor is about 130 px of 366 px, and at 1280x800 (split, column about 562 px) it is about 290 px, so typical build lines (90th percentile 46 characters, library lines up to 59) are clipped. The gutter, the 17ch annotation column showing started and finished times, and the 1rem editor font take the width. Below 48rem of editor width the editor drops to a compact mode that gives the text back its room. The mode is set by a container query on the editor's own width, not the viewport, because the split layout narrows the editor without narrowing the viewport.

## Scope

- `components/apps/aoe4-build-order/workbench.module.css`: `.editor` becomes a size container (`container-type: inline-size`, name `build-editor`). The shared font rule for `.gutter`, `.annotations` and `.textarea` reads one custom property, `--editor-font-size`, which defaults to the current 1rem. A `@container build-editor` rule for an inline size below 48rem sets, per design C14:
  - `--editor-font-size` to 0.875rem for the gutter, annotations and textarea together, so line height and row alignment stay shared;
  - the `.annotations` width to at most 8ch;
  - `display: none` on `step-finished` inside `build-order-annotations`.
- `components/apps/aoe4-build-order/step-annotation.module.css` (and `step-annotation.tsx` if a class is needed): `StepTimes` is rendered by both the gutter annotation (`labelled={false}`) and the step table cell, and the hidden finish time applies to the gutter only. Use a selector scoped to the annotation column so the step table and the table view keep started, finished and waited times in both modes. The annotation's inner `span` font size (set to 0.8rem today in `.annotations li > span`) must follow the compact font rule rather than leave the annotation unaligned.
- `components/apps/aoe4-build-order/build-text-editor.tsx`: only if the container needs a hook the spec can measure (for example a `data-testid` on the editor wrapper). No prop or behavior change.
- If the 1280x800 bound below is not met with the C14 values alone, the compact rule may also narrow the gutter's `min-width` and the annotation padding; it may not change anything outside compact mode. The implementer records the measured widths in the report.
- New `acceptance/aoe4-editor-width.spec.ts`, written against `acceptance/helpers.ts` (`openPage`, `waitForRun`, `SPLIT_VIEWPORT`, `TABS_VIEWPORT`) and the gate SGS-128 sets up.
- Docs: `docs/aoe4-build-order.md`, the paragraph on the text view's second gutter ("its started and finished times without labels") stops being true below 48rem of editor width. Fix it and any sentence there that states the editor's font or annotation width. Grep `docs/aoe4-build-order.md` and `ARCHITECTURE.md` for the annotation and editor-layout statements before editing.

**Out of scope:** a "Times" toggle (rejected option B), any change to the step table, the table view or the issues list, the active-step highlight and stale tone, the editor's props, textarea wrapping behavior, and new viewport-based media queries. `TYPICAL_LINE_CHARS = 48` is a constant of the acceptance spec only.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 390x844, after the default page build has run and the Text view is shown, the build-text `textarea` client width is at least half the width of the editor, read in one `page.evaluate` (new `acceptance/aoe4-editor-width.spec.ts`). The test first asserts the editor is narrower than 48rem, so a layout change that leaves compact mode cannot pass silently.
- [ ] At 1280x800 (split layout), after the default page build has run, the `textarea` content width (`clientWidth` minus its horizontal padding) is at least the width of a probe span holding `TYPICAL_LINE_CHARS` (48) `0` characters measured in the textarea's computed font, read in one `page.evaluate`. The test first asserts the editor is narrower than 48rem. A test fails if the compact rule is removed or its font size is left at 1rem.
- [ ] At an editor width of 48rem or more (a viewport the tabs layout or a wide split gives; the test asserts the width condition first), the finished time in the gutter annotations is visible, the annotation column and the font keep their M8 values, and the font is not the compact one. A test fails if compact mode applies at or above 48rem.
- [ ] Below 48rem, `step-finished` inside `build-order-annotations` is not rendered visibly (computed `display` is `none`) and `step-started` stays visible. A test asserts both.
- [ ] The finish time is hidden in the gutter only: in the same compact state, `step-finished` in every step-table row and the table view is still visible and carries the same text as before this change. A test fails if the hide rule reaches the table.
- [ ] In compact mode the gutter line numbers, the annotations and the textarea rows stay aligned: for a build with several step lines, each annotation row's vertical position equals its line number row's, read in one `page.evaluate`. A test fails if the annotation or gutter font is set differently from the textarea's.
- [ ] The active-step highlight (`data-gutter-active`) and the stale annotation tone still render in compact mode. An existing test of either keeps its expected value, and none of them is edited except to read the layout at a viewport where it still holds, which the implementer lists.
- [ ] Every existing test that reads annotation timing text keeps its expected value (hiding the finish time removes no DOM node); any other test pins nothing new in its setup. The implementer lists every test file it edits.
- [ ] The docs named in Scope match the behavior: compact mode below 48rem of editor width, and no sentence states that the gutter always shows both times.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` (with the gates SGS-128 adds) and `next build` pass. Review screenshots at 360x760, 768 and 1280 px wide show the editor with no horizontal overflow of the Build panel.
- [ ] No INVARIANTS.md regressions

## Open questions

none
