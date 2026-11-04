# SGS-083 implementer 1

Status: needs_review (with one scope deviation, below)
Branch: sgs-083-aoe4-highlight-step-span-on-charts, tip b43d72aff28bb4a950ae12319403dacfc9c403a3
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-083-aoe4-highlight-step-span-on-charts

## Files
- components/apps/aoe4-build-order/step-timeline-rows.ts: `StepSpan`, `stepSpan(row, end)` (null without start; in-progress to end; clamped to [0,end]).
- components/apps/aoe4-build-order/step-timeline.tsx: props now rows/activeStep/onActiveStepChange; row pointer/focus handlers, tabIndex 0, data-active, table-active via cn.
- components/apps/aoe4-build-order/results.tsx: rows memo, active state tied to result object, highlight passed to all four SeriesChart.
- components/apps/aoe4-build-order/line-chart.tsx: `highlight` prop; ReferenceArea (from<to) or ReferenceLine (from===to), both testid chart-step-band with data-from/data-to.
- components/apps/aoe4-build-order/step-timeline-rows.test.ts: `describe('stepSpan')` table, 8 rows (ticket's 6 plus two clamp rows).
- docs/aoe4-build-order.md: highlight prose in the step timeline paragraph.

## Deviation
Acceptance spec `acceptance/aoe4-build-order-step-band.spec.ts` (Scope 6) NOT written: implementer instructions say a separate gate owns acceptance-harness tests. Manager/acceptance gate must author it (zero-length row via pasted build with an instant move/rally/pause step, per spec-gate 2 note). Browser criteria are therefore unverified here.

## Tests
- Unit: step-timeline-rows.test.ts 32 passed. Full `npm test`: 1358 passed, 10 skipped (45 files).
- Existing acceptance run for regressions: aoe4-build-order-timeline-compare + aoe4-results-split, 10 passed.
- Invariant encoded: in-progress span reads the run end not completedAt; zero-length stays {30,30}; clamping to [0,end].
- Pre-existing tests edited: none (only added the import name and a describe block).
- Pinned outputs: none.

## Mutation checks
- in-progress `to` changed to `completedAt ?? 0`: the in-progress row failed; undone.
- clamp removed: 2 rows failed (clamp rows); undone.

## Doc claims
- docs/aoe4-build-order.md: "Pointing at a row or focusing it with the keyboard highlights the row and shades that step's span, from Started to Finished, on every chart" - results.tsx passes highlight to all four SeriesChart; step-timeline.tsx onPointerEnter/onFocus.
- "an `in-progress` step's span runs to the end of the run, a step whose start and finish are the same second shows as a single vertical line, and a `waiting` or `not-reached` step (no start) shows no band" - stepSpan, line-chart.tsx ReferenceLine branch.
- "Moving off the row, or running again, clears the highlight." - onPointerLeave/onBlur; results.tsx `active?.result === result`.
- No code comments added.

## Results
- tsc --noEmit clean; lint:dup clean; npx next build succeeded (npm ci run); no codegen configured.
- Not run: the full `npm run acceptance` suite; no band visual check in a browser.
- Diff touches only the six files above; no lockfile changes. No processes left running.

## Out-of-scope findings
None.
