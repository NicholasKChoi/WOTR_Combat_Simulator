# SGS-144: Fix rem sizing that assumed a 16px root in the AoE4 editor and save row

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (CSS and docs only; A1 to A3 are untouched and no `Paths:` entry guards these rules)
- **Unverified assumptions**: none (the acceptance specs run in real Chromium, which resolves `rem` inside container queries against the page's root font size)
- **LOC estimate**: 15 (the threshold value in two CSS files, plus any save-row value the check below shows is wrong; specs and docs excluded)
- **Depends on**: none
- **On merge**: design/M9.md: C14, the M9.8 row and the compact-mode rows state the 18px root basis (and the owner's threshold answer)
- **Source**: owner backlog triage Q64 (2026-11-12): design/M9.md C14 and the SGS-140 ticket assumed 1rem = 16px; reported by the SGS-140 review and implementer

## Context

`styles/global.css` sets `html, body { font-size: 18px }`, so 1rem is 18px site-wide. Design M9 and the SGS-140 ticket sized the editor compact mode and the save row as if 1rem were 16px. SGS-140 shipped with the container query `(width < 48rem)`, which is 864px, not the 768px the design's numbers imply; the SGS-140 spec reads the root size, so it passes at either basis and no gate compared the threshold with the design's pixel intent. Between 768px and 864px of editor width (a 768px-wide tablet in the tabs layout, for example) the text editor is now compact, with the finish time hidden in the gutter.

### Cause

- `components/apps/aoe4-build-order/workbench.module.css` and `components/apps/aoe4-build-order/step-annotation.module.css`: two `@container build-editor (width < 48rem)` rules carry the number, and `docs/aoe4-build-order.md` (the text-view paragraph on the second gutter) names it.
- Viewport media queries in these files are in px (`min-width: 768px`, `max-width: 767.98px`, `min-width: 1200px`), so they are unaffected by the root size. Only container queries and rem-valued sizes inside them see 18px.

### Audit of other rem values (read at the base)

Rem values in M9 CSS that sit next to a px threshold: `.linkInput` and `.copyNameField` (`flex: 1 1 12rem`) and `.linkInput` `min-width: 8rem` inside the `min-width: 1200px` save-row rule in `workbench.module.css`, which at 18px are 216px and 144px. The existing `acceptance/aoe4-save-status.spec.ts` checks the one-line save row at 1280x800 only, not at the 1200px boundary the design names. The other rem values found (paddings, gaps, `.scrolledTable` `min-width: 30rem`, `.runCell` `min-width: 4rem`) are spacing, not thresholds, and no design rule ties them to a pixel width.

## Scope

- Decide the compact threshold from the owner's answer (Open questions). Whichever value is chosen, express it in the CSS in a unit that does not hide the basis, and change both container queries (`workbench.module.css`, `step-annotation.module.css`) together so the gutter finish time and the compact font switch at the same editor width. If the answer keeps 48rem, no CSS value changes.
- Save row: add the check described in the criteria at a 1200px-wide viewport, and fix the save-row sizes in `workbench.module.css` only if it fails. If it passes, no CSS change there.
- Extend `acceptance/aoe4-editor-width.spec.ts` (it holds `COMPACT_BELOW_REM` and reads the root font size) so the compact boundary is pinned as an absolute editor width in px rather than only as a multiple of the page's rem, and extend `acceptance/aoe4-save-status.spec.ts` for the 1200px case.
- Docs: `docs/aoe4-build-order.md` names the compact threshold as `48rem` in the text-view paragraph and the finish-time sentence; both change only if the owner picks another threshold. Add one sentence to `ARCHITECTURE.md` (or the AoE4 doc, wherever CSS conventions live) stating that the site root font size is 18px so rem figures convert at 18, if no doc says so today; grep both first.
- Other tests that read the compact threshold (examples: the 390px and 1280x800 cases in `acceptance/aoe4-editor-width.spec.ts`) keep their expected values; if the threshold moves, only a test whose viewport or boundary assertion depends on it changes, and the implementer lists each.

**Out of scope:** the compact-mode levers (font, annotation width, paddings; ratified by SGS-140), any change to the step table, table view or active-step highlight, new media queries, changing the site root font size, and the factory design doc `design/M9.md` (updated through On merge).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The compact switch point equals the owner's chosen width in absolute px: a Playwright case places the editor just below and just above that width (through the viewport, in the tabs layout) and, read in one `page.evaluate` each, finds compact (finish time `display: none`, 0.875rem font) below it and the M8 layout (finish time visible, 1rem font) at or above it. The case first asserts the editor width on each side. It fails against a threshold that differs from the chosen width by the 16px-versus-18px factor.
- [ ] Both container queries switch at the same editor width: a test asserts that whenever the gutter finish time is hidden the editor font is the compact one, and the reverse, at widths either side of the boundary.
- [ ] At a 1200px-wide viewport (the lowest width of the one-line rule), after Save as copy with the link shown, the buttons, status, link input and Copy link share one line with no horizontal overflow of the row, read in one `page.evaluate` or inside `expect.poll` (LESSONS: Playwright layout checks). At 1199px the row wraps in DOM order. The test fails if the link input's rem sizes make the row wrap or overflow at 1200px.
- [ ] Every doc sentence that states the compact threshold matches the CSS, and a doc states that rem is 18px at the site root. No doc sentence says 1rem is 16px.
- [ ] Existing acceptance and unit tests keep their expected values except those the threshold answer changes; the implementer lists each edited test and why.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` and `next build` pass. Review screenshots of the Build panel at 360x760, 768 and 1280 px wide show no horizontal overflow.
- [ ] No INVARIANTS.md regressions

## Open questions

- owner: Which width should text-editor compact mode start below? The shipped value is 48rem, which is 864px at the 18px root (design M9 C14 meant a 16px basis, 768px). Options: keep 48rem (864px; a 768px tablet in the tabs layout is compact), or change it to 768px (about 42.7rem at 18px; a 768px viewport keeps the wide editor). The 1280x800 and 390px requirements hold either way.
