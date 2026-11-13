# SGS-144: Fix rem sizing that assumed a 16px root in the AoE4 editor and save row

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: A1, A2, A3 (their `Paths:` cover `components/apps/aoe4-build-order/**`, where the two CSS files live; the change is CSS, tests and docs only and touches none of what they guard: data-file numbers, non-negative resources, deterministic timings)
- **Unverified assumptions**: none (the acceptance specs run in real Chromium, which resolves `rem` inside container queries against the page's root font size)
- **LOC estimate**: 15 (the threshold value in two CSS files, plus any save-row value the check below shows is wrong; specs and docs excluded)
- **Depends on**: none
- **On merge**: update design/M9.md to the 768px threshold and the 18px root basis: the statement near the top ("below 48rem of editor width"), C14 (`max-width: 47.99rem`), the two compact-mode rows ("below 48rem" and "48rem and wider"), the M9.8 option text ("below 48rem"), and, only if the implementer changes `.linkInput` sizes (`flex: 1 1 12rem`, `min-width: 8rem`), the save-row figures wherever the design states them (the C-section link-input line and the 1200px save-row row), set to the values shipped
- **Source**: owner backlog triage Q64 (2026-11-12): design/M9.md C14 (written in rem) and the SGS-140 ticket assumed 1rem = 16px; reported by the SGS-140 review and implementer

## Context

`styles/global.css` sets `html, body { font-size: 18px }`, so 1rem is 18px site-wide. Design M9 and the SGS-140 ticket sized the editor compact mode and the save row as if 1rem were 16px. SGS-140 shipped with the container query `(width < 48rem)`, which is 864px, not the 768px the design's numbers imply; the SGS-140 spec reads the root size, so it passes at either basis and no gate compared the threshold with the design's pixel intent. The owner chose 768px (Q65, option A), which matches the design's 768px pixel intent (the design text writes it as 47.99rem / 48rem, which is the same 16px-root mistake). Measured editor widths on origin/main are 666px below ~1000px viewports, 906px at 1000-1199px, and 534-624px in the >=1200px split layout, so no current viewport puts the editor between 768px and 864px; the change is only observable at an editor width set directly.

### Cause

- `components/apps/aoe4-build-order/workbench.module.css` and `components/apps/aoe4-build-order/step-annotation.module.css`: two `@container build-editor (width < 48rem)` rules carry the number, and `docs/aoe4-build-order.md` (the text-view paragraph on the second gutter) names it.
- Viewport media queries in these files are in px (`min-width: 768px`, `max-width: 767.98px`, `min-width: 1200px`), so they are unaffected by the root size. Only container queries and rem-valued sizes inside them see 18px.

### Audit of other rem values (read at the base)

Rem values in M9 CSS that sit next to a px threshold: `.linkInput` and `.copyNameField` (`flex: 1 1 12rem`) and `.linkInput` `min-width: 8rem` inside the `min-width: 1200px` save-row rule in `workbench.module.css`, which at 18px are 216px and 144px. The existing `acceptance/aoe4-save-status.spec.ts` checks the one-line save row at 1280x800 only, not at the 1200px boundary the design names. The other rem values found (paddings, gaps, `.scrolledTable` `min-width: 30rem`, `.runCell` `min-width: 4rem`) are spacing, not thresholds, and no design rule ties them to a pixel width.

## Scope

- Change both container queries (`workbench.module.css`, `step-annotation.module.css`) from `(width < 48rem)` to `(width < 768px)`, an absolute px width that does not depend on the root font size, so the gutter finish time and the compact font switch at the same editor width. (respec 1)
- Save row: add the check described in the criteria at a 1200px-wide viewport. The row is `flex-wrap: nowrap` there (the `min-width: 1200px` rule in `workbench.module.css`), so it can overflow rather than wrap. If the check fails, reduce `.linkInput` `min-width` (and, if still needed, its `flex-basis`) until the row has no horizontal overflow, keeping the buttons, status and Copy link unshrunk; the implementer picks the values and records them in the report. If it passes, no CSS change there. (respec 2)
- Extend `acceptance/aoe4-editor-width.spec.ts` (it holds `COMPACT_BELOW_REM` and reads the root font size) so the compact boundary is pinned as an absolute editor width of 768px rather than a multiple of the page's rem (drop or replace `COMPACT_BELOW_REM`); the viewports in that spec never put the editor between 768px and 864px, so the boundary case sets the editor's width directly or otherwise pins it as an absolute px width (the implementer decides how), and extend `acceptance/aoe4-save-status.spec.ts` for the 1200px case.
- Docs: `docs/aoe4-build-order.md` names the compact threshold as `48rem` in the text-view paragraph twice (the finish-time clause and the compact-mode sentence); both become untrue and change to the 768px width. Add one sentence to the Styling bullet of `ARCHITECTURE.md` stating that the site root font size is 18px so rem figures convert at 18; a grep of `docs` and `ARCHITECTURE.md` found no such statement at the base. (respec 1) (respec 2)
- Other tests that read the compact threshold (examples: the 390px and 1280x800 cases in `acceptance/aoe4-editor-width.spec.ts`) keep their expected values; tests whose boundary assertion uses `COMPACT_BELOW_REM` (the 48rem describe block and the compact-case bound checks) change with the threshold, and the implementer lists each.

**Out of scope:** the compact-mode levers (font, annotation width, paddings; ratified by SGS-140), any change to the step table, table view or active-step highlight, new media queries, changing the site root font size, and the factory design doc `design/M9.md` (updated through On merge).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 2) The compact switch point is 768px of editor width, absolute, and both container queries switch together: a Playwright case places the editor just below and just above that width (by setting the width directly on the `build-order-editor` element, which the container query reads, or another means the implementer chooses) and, read in one `page.evaluate` each, finds below it the gutter finish time hidden and the compact font, and at or above it the finish time visible and the M8 font; the finish time is hidden exactly when the compact font applies, on both sides. The case first asserts the editor width on each side. It fails against the `48rem` (864px) threshold: an editor width between 768px and 864px must be non-compact.
- [ ] (respec 2) At a 1200px-wide viewport (the lowest width of the one-line rule), after Save as copy with the link shown, the buttons, status, link input and Copy link share one line (equal vertical position) and the row has no horizontal overflow (`scrollWidth <= clientWidth`), read in one `page.evaluate` or inside `expect.poll` (LESSONS: Playwright layout checks). At 1199px the `save-row` children keep DOM order (the status directly after the buttons) and the row has no horizontal overflow; wrapping is permitted there but not asserted. The test fails if the link input's rem sizes make the row overflow at 1200px.
- [ ] (respec 1) Every doc sentence that states the compact threshold says 768px and matches the CSS, and a doc states that rem is 18px at the site root. No doc sentence says 1rem is 16px.
- [ ] Existing acceptance and unit tests keep their expected values except those the 768px threshold changes; the implementer lists each edited test and why.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` and `next build` pass. Review screenshots of the Build panel at 360x760, 768 and 1280 px wide show no horizontal overflow.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: the compact threshold was left as an owner question (Q65).
- Changed: owner chose 768px absolute (option A); Scope, criteria, docs and On merge now state it, and the boundary test must pin an absolute editor width because no current viewport lands between 768 and 864px.
- Stands: save-row check at 1200px and the 18px-root doc sentence are unchanged.

## Re-spec 2 - 2026-11-12

- Underspecified: the 1199px "wraps" assertion had no basis in the CSS (wrap is only permitted below 1200px), and the conditional save-row fix named no property or pass condition.
- Changed: 1199px now asserts DOM order and no overflow; the fix names the 1200px no-overflow property and `.linkInput` `min-width` / `flex-basis`; the two overlapping boundary criteria are merged; the 18px sentence goes in the ARCHITECTURE.md Styling bullet; On merge lists the design lines to update.
- Stands: both container-query changes, the docs edits and the test rules from Re-spec 1.

## Re-spec 3 - 2026-11-12

- Underspecified: Invariants said "none" although A1 to A3 have Paths covering `components/apps/aoe4-build-order/**`, and On merge covered the save-row figures unconditionally.
- Changed: Invariants lists A1 to A3 and says the change touches none of what they guard; On merge updates the design/M9.md `12rem` / `8rem` figures only if `.linkInput` sizes change.
- Stands: all Scope, criteria and Re-spec 1 and 2 changes.
