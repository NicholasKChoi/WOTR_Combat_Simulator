# SGS-140: Add a compact text-editor mode below 48rem of editor width

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.8
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (the change is CSS only; A1 to A3 are untouched and no `Paths:` entry guards the editor layout)
- **Unverified assumptions**: none (the acceptance spec runs in real Chromium, which is where container queries and `rem` units in them are resolved)
- **LOC estimate**: 40 (CSS in `workbench.module.css` and `step-annotation.module.css`, plus a test id in `build-text-editor.tsx` and at most a class in `step-annotation.tsx`; the spec and docs excluded)
- **Depends on**: SGS-128
- **On merge**: none
- **Source**: design/M9.md C14, "Editor compact mode (M9.8)" behavior rules, criteria map row M9.8; owner decision 2A

## Context

At 390 px the text column of the build editor is about 130 px of 366 px, and at 1280x800 (split, column about 562 px) it is about 290 px, so typical build lines (90th percentile 46 characters, library lines up to 59) are clipped. The gutter, the 17ch annotation column showing started and finished times, and the 1rem editor font take the width. Below 48rem of editor width the editor drops to a compact mode that gives the text back its room. The mode is set by a container query on the editor's own width, not the viewport, because the split layout narrows the editor without narrowing the viewport.

## Scope

- `components/apps/aoe4-build-order/workbench.module.css`: `.editor` becomes a size container (`container-type: inline-size`, name `build-editor`). The shared font rule for `.gutter`, `.annotations` and `.textarea` reads one custom property, `--editor-font-size`, which defaults to the current 1rem. A `@container build-editor` rule for an inline size below 48rem (`(width < 48rem)`; design C14 writes it as `max-width: 47.99rem`, same boundary) sets, per design C14:
  - `--editor-font-size` to 0.875rem on `.gutter`, `.annotations` and `.textarea` themselves (a container query cannot style the container, so the property is not set on `.editor`), so line height and row alignment stay shared;
  - the `.annotations` width to at most 8ch;
  - `display: none` on `step-finished` inside `build-order-annotations`.
- The textarea also carries Bootstrap `form-control`, whose `.form-control` rule sets `font-size: 1rem`; today `.textarea` wins on order at equal specificity. The compact rule must still win: the textarea's computed font size equals the gutter's in both modes (criteria 2 and 6 check it).
- The annotation's inner `span` font size (0.8rem today in `.annotations li > span`) becomes 0.8 times `--editor-font-size` in both modes, so it still computes to 0.8rem at 48rem and wider (M8 layout unchanged) and scales with the compact font below it.
- `components/apps/aoe4-build-order/step-annotation.module.css` and `step-annotation.tsx`: `StepTimes` is rendered by both the gutter annotation (`labelled={false}`) and the step table cell, and the hidden finish time applies to the gutter only. `step-finished` is a `data-testid`, not a class, so the hide rule needs a class added in `step-annotation.tsx`/`step-annotation.module.css` or an attribute selector scoped to the annotation column. Either way the step table and the table view keep started, finished and waited times in both modes.
- `components/apps/aoe4-build-order/build-text-editor.tsx`: the `.editor` wrapper has no `data-testid` today and criteria 1 to 3 measure its width, so add one. No prop or behavior change.
- The 1280x800 bound in criterion 2 is the controlling rule, not the C14 values: the margin with C14 values alone is a few pixels. If the bound is not met, the compact rule may also narrow the gutter's `min-width` and the annotation padding; it may not change anything outside compact mode. The implementer records the measured editor, textarea content and probe widths in the report.
- New `acceptance/aoe4-editor-width.spec.ts`, written against `acceptance/helpers.ts` (`openPage`, `waitForRun`, `SPLIT_VIEWPORT`, `TABS_VIEWPORT`) and the gate SGS-128 sets up.
- Docs: `docs/aoe4-build-order.md`, the paragraph on the text view's second gutter ("its started and finished times without labels") stops being true below 48rem of editor width. Fix it and any sentence there that states the editor's font or annotation width (none found at the base, but grep `docs/aoe4-build-order.md` and `ARCHITECTURE.md` again before editing). The table-view sentences stay true. SGS-141 does a later docs pass over M9 and lists this ticket.
- Other tickets editing `workbench.module.css` (SGS-132, SGS-133, SGS-134) are a merge-conflict risk only; none removes the editor rules this ticket changes.

**Out of scope:** a "Times" toggle (rejected option B), any change to the step table, the table view or the issues list, the active-step highlight and stale tone, the editor's props, textarea wrapping behavior, and new viewport-based media queries. `TYPICAL_LINE_CHARS = 48` is a constant of the acceptance spec only.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 390x844, after the default page build has run and the Text view is shown, the build-text `textarea` client width is at least half the width of the editor, read in one `page.evaluate` (new `acceptance/aoe4-editor-width.spec.ts`). The test first asserts the editor is narrower than 48rem, so a layout change that leaves compact mode cannot pass silently.
- [ ] At 1280x800 (split layout), after the default page build has run, the `textarea` content width (`clientWidth` minus its horizontal padding) is at least the width of a probe span holding `TYPICAL_LINE_CHARS` (48) `0` characters measured in the textarea's computed font, read in one `page.evaluate`. The test first asserts the editor is narrower than 48rem. A test fails if the compact rule is removed or its font size is left at 1rem.
- [ ] (respec 1) At an editor width of 48rem or more (a viewport the tabs layout or a wide split gives; the test asserts the width condition first), the finished time in the gutter annotations is visible, the annotation column width and the gutter, annotation and textarea fonts keep their M8 computed values, and the annotation inner span computes to 0.8 times the editor font. A test fails if compact mode applies at or above 48rem or the span ratio rule changes the wide layout.
- [ ] (respec 1) Below 48rem, `step-finished` inside `build-order-annotations` is not rendered visibly (computed `display` is `none`) and `step-started` stays visible. The annotation inner span computes to 0.8 times the compact editor font, and no visible annotation text is clipped in the narrowed column (each annotation's `scrollWidth` is at most its `clientWidth`). A test asserts all three; it fails if the span stays at a fixed rem or the started time overflows the column.
- [ ] The finish time is hidden in the gutter only: in the same compact state, `step-finished` in every step-table row and the table view is still visible and carries the same text as before this change. A test fails if the hide rule reaches the table.
- [ ] In compact mode the gutter line numbers, the annotations and the textarea rows stay aligned: for a build with several step lines, each annotation row's vertical position equals its line number row's, read in one `page.evaluate`. A test fails if the annotation or gutter font is set differently from the textarea's.
- [ ] (respec 1) The active-step highlight (`data-gutter-active`) and the stale annotation tone still render in compact mode. An existing test of either keeps its expected value.
- [ ] (respec 1) No existing test is edited except to change its viewport or the setup it reads layout from; the implementer lists each edited test file and the reason. Every existing test that reads gutter annotation timing text reads it with `toHaveText` or `textContent` (which still see a `display: none` node, since hiding the finish time removes no DOM node) and keeps its expected value; a reader that switches to a visibility or `innerText` check of the gutter finish time fails this criterion.
- [ ] The docs named in Scope match the behavior: compact mode below 48rem of editor width, and no sentence states that the gutter always shows both times.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` (with the gates SGS-128 adds) and `next build` pass. Review screenshots at 360x760, 768 and 1280 px wide show the editor with no horizontal overflow of the Build panel.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: Scope said the annotation span font "must follow the compact font rule" without a rule, and criterion 8 ("pins nothing new in its setup") had no observable outcome.
- Changed: the span is 0.8 times `--editor-font-size` in both modes, with no-clipping and wide-layout checks in criteria 3 and 4; criteria 7 and 8 now limit test edits to viewport or layout setup and require gutter text readers to stay on `toHaveText`/`textContent`. Scope adds the gate's notes: the custom property is set on the children, Bootstrap `.form-control` must not win the font, a test id on the editor wrapper is required, the criterion 2 bound controls over the C14 values.
- No branch work exists yet.
