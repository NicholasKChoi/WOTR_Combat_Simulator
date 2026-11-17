# SGS-199 implementer report 4

- Ticket: SGS-199 (risk low). Branch `sgs-199-page-help-modal`. Tip `d96b9589d98bb399525f8aa05cfe0fd665a4c588` (base `origin/main` 3e920ba).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-199-page-help-modal`
- Status: needs_review

## Files touched
- `components/apps/aoe4-build-order/page-help.tsx` (new): `PageHelp`, button, closed `dialog`, Close first, h2, seven `help-section`s, Tab wrap, backdrop-rect close, scroll reset on open.
- `components/apps/aoe4-build-order/page-help.module.css` (new): dialog 80dvh max with inner scrolling content, swatch size.
- `components/apps/aoe4-build-order/page-help.test.ts` (new): markup unit tests.
- `components/apps/aoe4-build-order/workbench.module.css`: `.headingRow` (h1 then button on one line).
- `pages/apps/aoe4-build-order.tsx`: h1 + `PageHelp` in a heading row before `BuildInput`.
- `components/apps/aoe4-build-order/build-text-editor.tsx`, `step-table.tsx`: stop rendering `StepKindLegend` (imports dropped).
- `components/apps/aoe4-build-order/step-annotation.test.ts`, `acceptance/aoe4-compact-view.spec.ts`, `aoe4-step-annotations.spec.ts`, `aoe4-results-split.spec.ts`, `aoe4-build-order-knight-longbow-page.spec.ts`: existing legend assertions rewritten (below).
- `acceptance/helpers.ts`: `legendOutsideHelp(page)` and `openHelp(page)` shared helpers.
- `acceptance/aoe4-help-modal.spec.ts` (new): B-H1..B-H9 (14 tests).

## Tests
- `npm test`: 91 files passed, 1 skipped; 2856 tests passed, 15 skipped. `page-help.test.ts` (5 tests): dialog closed and labelled by its h2; Close is the dialog's first child; seven sections each labelled by an inner `h3`; third holds the one legend with six labels; fourth holds the one swatch.
- `acceptance/aoe4-help-modal.spec.ts`: 14/14 pass. Full `acceptance/aoe4*` run: 977/977 pass (4.1 min). I ran acceptance because this ticket adds and edits acceptance specs.
- Invariants encoded: closed in server render; Close first; legend only in the modal in every state; swatch bg equals still-waiting run cell bg; legend colours equal run cell border colours; each section-5 term from the live page appears in the section; click inside rect (incl. edge on dialog element) does not close; reopen at scroll top; Tab/Shift+Tab wrap within the dialog; button sits right of the h1, centred on it, before the run bar; below 1200 px it scrolls sideways.

## Existing tests edited
- `step-annotation.test.ts` "renders no run cell, legend or kind without annotations" -> "renders no run cell or kind without annotations": dropped the `step-kind-legend` not-contain half (rule: without-annotations test drops its legend half).
- `step-annotation.test.ts` "keeps the start row cell empty and shows the legend" -> "... and renders no legend with annotations": now asserts `step-run` present and `step-kind-legend` absent (rule: table with annotations asserts no legend).
- `aoe4-compact-view.spec.ts` "the annotation column and the legend are absent before a result and the legend follows the parsed steps" -> "the annotation column is absent before a result and no view renders the legend outside the help modal": count checks became `legendOutsideHelp` count 0; legend-above-textarea layout read dropped (and the `readLayout` import); START_ONLY count-0 check dropped (case no longer changes the legend); the syntax-error `toBeVisible` became outside-modal count 0.
- `aoe4-compact-view.spec.ts` "...compact view..." (the one with `legend(page)` count 1 in text and table views): became `legendOutsideHelp` count 0; local `legend` helper removed.
- `aoe4-step-annotations.spec.ts` "every row carries its kind and the run timing the API reports, under one legend" -> "..., with the legend only in the help modal": outside-modal count 0, then legend inside the open modal has count 1, visible, kinds equal `LEGEND_KINDS`.
- `aoe4-step-annotations.spec.ts` `legendColors`: opens the modal and reads the legend inside it; expected run-cell colours unchanged (used by "a run cell shares its kind colour..." and "every run cell keeps a 4px kind border...").
- `aoe4-results-split.spec.ts` "a build with no steps ...": legend count-0 became the outside-modal check.
- `aoe4-build-order-knight-longbow-page.spec.ts` "shows its six reactions ...": legend `toBeVisible` now runs after `openHelp`, then Escape.
- `aoe4-split-scroll.spec.ts`: no edit needed. At base its `charts` h3 query is already scoped to `[data-testid="chart-table"] h3`, and no section heading is exactly `Build order`. Passed unchanged.
- No other page-wide `getByText`/`h3`/`querySelectorAll` query in `acceptance/` was affected (searched; whole aoe4 suite passes unchanged elsewhere).

## Doc claims (added text in page-help.tsx content, each checked against code)
- "The page re-runs the simulation shortly after you stop editing, so there is no run button" - `use-auto-run.ts`, `docs/aoe4-build-order-ui.md` (no run button).
- "the run status at the end of the bar" - `build-input.tsx` `auto-run-status` last.
- "each scrolls on its own" - `workbench.module.css` `.column` overflow-y auto.
- Gutter/popover/table sentences - `build-text-editor.tsx`, `step-annotation.tsx`.
- Yellow tint / Blocked by sentences - `annotationToneClass`, `blockedByText`, `LONG_WAIT_SECONDS = 60` in `step-annotations.ts`.
- Series/Markers/dashed/unit line/upgrade dot/zoom/pan/Reset zoom/Reorder chart/Collapse chart/Expand chart - `chart-legend.tsx`, `chart-zoom-bar.tsx`, `chart-header.tsx`, `collapse-caret.tsx`; Shift+drag pan and drag-to-zoom per design B-Z1/B-Z9 (covered by the zoom tests of their own ticket).
- Pin sentence ("remembered in this browser") - `pin-storage.ts` (`writeStoredPin`); compare table - `compare-panel.tsx` Pinned/Current/Delta.
- Code comment in `page-help.tsx`: "Chromium's native modal Tab order passes through the browser UI (document.body) between the last and first stop, so the wrap is made here to keep focus on the dialog's own elements." - observed in a debug run: Tab sequence content, close, BODY, close... before `wrapTab` was added.

## Mutation checks
Unit (`page-help.test.ts`, `step-annotation.test.ts`), each reverted:
- `page-help.tsx` dialog given `open`: "renders the dialog closed" failed on `not.toMatch(/\sopen/)`.
- Close button moved after the h2: "puts the close button before everything else" failed.
- An eighth section added: "has seven sections" failed (8 vs 7).
- `<StepKindLegend />` removed: "holds the step kind legend" failed (third section lacks it).
- Swatch testid renamed: "holds the warn swatch" failed.
- `<div data-testid="step-kind-legend">` re-added in `step-table.tsx`: the table-with-annotations test failed on `not.toContain('step-kind-legend')`.
Acceptance (`aoe4-help-modal.spec.ts`), each reverted:
- `outsideRect(event)` dropped from the click handler: edge-click test failed at `expect(modal).toBeVisible()` after the padding click.
- `scrollTop = 0` removed: "opening twice" failed (Expected 0, Received 300).
- Tab check removed from `wrapTab`: Tab test failed at "Tab press 2" (focus left the dialog).
- Swatch `.warn` class dropped: failed on swatch bg not transparent.
- "Reorder chart" removed from section 5 text: feature table failed on `drag handle: Reorder chart`.
- `PageHelp` placed before the h1: placement test failed on the deep-equal of insideSection/centreInTitle/rightOfTitle/beforeRunBar.
- An `onClose` focus-return handler I first wrote passed when removed (Chromium returns focus natively), so I deleted the handler and `openRef`; the focus-return assertions now rely on native behavior.
Note: a mutation run killed by timeout once left the `<PageHelp />` line removed in `pages/apps/aoe4-build-order.tsx`; I restored it before the final runs. The final diff has it.

## Pinned outputs
None.

## Codegen, build, lint
- codegen: not set. `npx next build`: passed (whole module). `npx tsc --noEmit && npm run lint:dup`: passed, 0 clones.
- `git diff --stat <base>`: only the files listed above; no tool-made changes.

## Invariant check
A1-A3 untouched (no engine/data change). Doc `docs/aoe4-build-order-ui.md` not edited, per the ticket (docs ticket owns it).

## Deviations and decisions to review
- Tab wrap: Chromium's native modal passes focus through the browser UI between the last and first stop, which the criterion "only ever land on elements inside the dialog" forbids. I added `wrapTab` (a keydown handler on the dialog) and made `help-content` `tabIndex={0}` (a keyboard-scrollable region). The Tab/Shift+Tab test asserts the wrap order close -> content -> close.
- Structure: dialog children are Close, h2, then `div[data-testid=help-content]` (scrolls); the h2 and Close stay visible while content scrolls. I added a test id `help-content` not named in the ticket.
- Section 5 text names the handle as `Reorder chart` and the caret as `Collapse chart` and `Expand chart`; the spec reads these from the live names with the chart title removed.
- `copy-saved-link-hint` appears only after a refused clipboard write, so the B-H7 test uses `REFUSED_CLIPBOARDS[0]` and clicks Copy link.

## Unverified assumptions added
None beyond the ticket's (focus returns natively on close in Chromium; the dev spec asserts it).

## Out-of-scope findings
None.
