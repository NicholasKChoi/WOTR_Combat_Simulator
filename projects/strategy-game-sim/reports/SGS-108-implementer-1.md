# SGS-108 implementer report 1

Status: needs_review

- Ticket: SGS-108 (step run cell; charts dim on stale)
- Branch: sgs-108-step-run-cell, stacked on sgs-107-step-annotation-model (adde412)
- Tip SHA: d526ce3
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-108-step-run-cell

## Files touched
- components/apps/aoe4-build-order/step-annotation.tsx (new): KIND_CLASS, StepKindBadge, StepKindLegend(testId), annotationToneClass, StepTimes, StepRunCell.
- components/apps/aoe4-build-order/step-annotation.module.css (new): kind classes, badge, legendRow moved from results.module.css; runCell, times, warn, stale.
- components/apps/aoe4-build-order/step-annotation.test.ts (new): tone table, StepRunCell cases, StepTimes parity, StepTable render cases.
- components/apps/aoe4-build-order/step-table.tsx: `annotations` prop, legend, run cell + row data attributes, empty start-row cell, `step-table-scroll` box, Labeled wraps.
- components/apps/aoe4-build-order/step-table.module.css: scroll box, select max-width 7.5rem, narrow `startSpacer` hide.
- components/apps/aoe4-build-order/step-timeline.tsx: imports KIND_CLASS/StepKindBadge/StepKindLegend (own legend map and badge gone), uses model `finishedText`.
- components/apps/aoe4-build-order/results.module.css: kind*, badge, legendRow removed.
- components/apps/aoe4-build-order/results.tsx: `describedByStatus` prop drives `aria-describedby`.
- components/apps/aoe4-build-order/auto-run-status.ts (+ test): `statusDescribesResults(stale, status, hasResult)`.
- components/apps/aoe4-build-order/workbench.module.css: panel-wide `overflow-x: auto` rule and comment removed.
- pages/apps/aoe4-build-order.tsx: `stale` and `annotations` memos, `Results.dimmed = stale`, `describedByStatus`, `StepTable annotations`.
- docs/aoe4-build-order.md: edits listed under Doc claims.
- acceptance/aoe4-step-annotations.spec.ts (git mv from aoe4-build-order-timeline-compare.spec.ts, rewritten), acceptance/aoe4-build-order-pin-compare.spec.ts.

## Spec moves
- Moved into pin-compare (reusing its `runOk`, `pin`, `DASH`): "a pinned run that ends earlier shows run ends at on the pinned side ..." (pinned 300 s, current 1200 s; the opposite direction of the existing pinned-1200-vs-300 case, so kept) and "age deltas read m:ss earlier or later ..." (uses `formatMinSec` from lib, first result read from the load response).
- Dropped: `runWith`, `loadResult`, `mmss` (helpers only deleted cases used). Nothing moved to helpers.ts.
- The three timeline cases were rewritten onto `step-row`/`step-run`; no `step-timeline-row` locator remains in that spec.
- Other specs edited: none. No existing spec located step-table cells by position or asserted the old dimming rule in a way the new rule breaks; the full suite passes unedited.

## Tests
- `npm test`: 63 files, 1970 passed, 10 skipped (pre-existing skips). New: 27 in step-annotation.test.ts, 2 `statusDescribesResults` tables (30 rows) in auto-run-status.test.ts.
- `npx playwright test` (full): 870 passed. New spec cases: 10 (5 run cell, 4 stale incl. wiring, 1 layout at 1280).
- Invariants encoded: tone class table (warn for not-reached/waiting/flagged/longWait, stale only when stale, distinct keys); `StepRunCell` takes tone from `annotationToneClass` and renders times through `StepTimes`; `run: null` shows no times/status; in-progress Finished is `ongoing`; null annotations render no run cell/legend/`data-kind`; start row first cell empty; `statusDescribesResults` true only when stale and message non-empty; rows keep their own times after a delete (new row 0 -> `data-run-step="1"`); another build shows no times; invalid edit drops only the changed row's times; cells and charts dim and restore together; table, panel and delete buttons fit at 1280 and the textarea is not clipped.

## Pre-existing tests edited
None.

## Doc claims (docs/aoe4-build-order.md)
- "choosing a build in the select settle the input at once" and "until a settled input changes the request." (wording fixes, as ticket).
- "the step table wraps to fit the Build panel's column, a table that still cannot fit scrolls inside its own box (`step-table-scroll`), and the Build panel itself never scrolls sideways": step-table.tsx `step-table-scroll` + `.scroll { overflow-x: auto }`; workbench.module.css no longer sets overflow on `.workbenchSplit > :first-child`; layout spec.
- Dimming paragraph (charts and run cells dim when shown text or duration differs from live, and on invalid/rejected/failed, including the 500 ms debounce and `updating`; select alone does not; `aria-describedby` only while dimmed and status text non-empty): auto-run.ts `resultsStale`, auto-run-status.ts `statusDescribesResults`, pages/apps/aoe4-build-order.tsx.
- Run cell paragraph (first cell per row once a result is shown, legend above, kind colour, `m:ss`/`ongoing`/en dash, waited, causes, `still waiting on`, `not reached (...)`, warning background for waiting/not-reached or 60 s or longer, empty start-row cell, prefix-then-suffix alignment by `formatBuildStep`, edit one step keeps others' times, another build gives none): step-annotation.tsx, step-annotations.ts `alignSteps`/`buildAnnotations`/`stepRun`. The parenthetical "any other step has a border with no colour and no badge" rests on `.kindOther { --kind-color: transparent }` and `STEP_KINDS.other === null`; today no live step has kind `other`, so it is not exercised.
- Code comments added: one in step-annotation.module.css on the `tbody > tr > td.warn` specificity (hidden constraint).

## Pinned outputs
None pinned from engine output beyond the API cross-checks (values read from `simulateOk` at run time).

## Mutation checks
Unit (vitest, each undone by restoring a backup; `git status` clean before commit):
- step-annotation.tsx drop `waiting` from tone -> "waiting" and "waiting, stale" fail.
- `data-stale={undefined}` -> "marks the cell stale only while stale" fails.
- StepTimes finished uses `completedAt` -> "shows the in-progress run timing" and the in-progress StepTimes case fail.
- step-table.tsx start spacer removed -> "keeps the start row cell empty and shows the legend" fails.
- `data-long-wait` from `flagged` -> "puts a run cell first ... marks only the long wait" fails.
- statusDescribesResults without `stale &&` -> every stale-false row with a message fails.
- StepRunCell with its own copy of the times markup -> both `StepTimes` parity cases fail.
- tone `stale && styles.stale` -> `styles.stale` -> no-run/completed/in-progress rows fail.
- legend removed -> start-row/legend test fails.
Acceptance:
- page `dimmed` back to status-only -> delete-row case (opacity 0.5 expected) and the wiring case fail.
- StepTable `stale={false}` -> delete-row case (`data-stale`) and invalid-edit case (cell opacity) fail.
- Layout: before the select max-width fix the layout case failed (`tableFits`/`deletesInside` false, table 671 vs panel 534); passes after.

## Codegen, build, lint
- codegen: none set.
- `npx next build`: passes.
- `npx tsc --noEmit` clean; `npm run lint:dup`: 0 clones.

## Invariant check
A1-A3: no `lib/`, data or API change. No INVARIANTS regressions.

## Notes and out-of-scope findings
- Layout margin is thin: the step table measures 532 px against a 534 px panel at 1280 px (rem is 18 px on this page). The table's min width is set by `.table select { max-width: 7.5rem }`, the run cell `min-width: 4rem` and the 105 px button cell. A wider control later will overflow the column again, and the `step-table-scroll` box then takes over.
- Select labels longer than 7.5rem truncate inside the closed select (the open list shows full text).
- Under 768 px the table module's `.table td { border: 0 }` outranks the run cell's kind border, so the kind colour border is not drawn in the narrow card layout (no new narrow rule per ticket). The badge still shows.
- The retained timeline's badges now carry `data-testid="step-kind-badge"` (shared component); no spec counts them.
- Run cell test id `step-kind-badge` is on row badges only; legend items have `data-kind` and no test id.
