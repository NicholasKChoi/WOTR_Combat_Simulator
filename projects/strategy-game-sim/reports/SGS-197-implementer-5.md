# SGS-197 implementer 5 (rework 1)

- Branch `sgs-197-chart-zoom-pan`, tip `5156184c78d41d43722b4e625e0baf728d552ad0` (parent 8a7ce31), checkout `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-197-chart-zoom-pan`. Committed locally, not pushed.
- Status: needs_review. checkout.sh reused the checkout at 8a7ce31; no `origin/<branch>` existed, so the own-commit check was skipped.

## Files touched
- `acceptance/aoe4-chart-zoom.spec.ts` only (test-only). No production file changed (verified `git status` clean apart from it).

## Required fixes
- [x] Collapsed drag: presses at 30% of the collapsed RATES tbody, middle row; same evaluate asserts `elementFromPoint(...).closest('tbody').dataset.testid === 'chart-gather-rates'`. Also asserts `zoomOf` is null right after release (before expanding), so a failure names the behavior.
- [x] Reorder: asserts previous sibling is `chart-units-produced` before ArrowDown, polls to `chart-gathered-resources` after, then `stays()`.
- [x] B-Z7 edge label: new case at 1200 and 1800 px, selects 0.5 to 790/1200 on RATES, asserts an age-up is inside the window within 20 s of `to` from the API result, then in one evaluate under `toPass` asserts every unrotated `text.recharts-label` is within the grid left/right (1 px slack).
- [x] Step band crossing `shown.from`: new case. Asserts `startedAt < shown.from < completedAt <= shown.to` first, one `chart-step-band` with the step's own `data-from`/`data-to`, band left within 1 px of grid left, band right within 1.5 px of the computed position, in one evaluate under `toPass`.

## Mutation checks (each undone; production files restored from copies, `git status` shows only the spec)
1. Collapsed drag: `onPointerDown` moved from the `chart-plot` div to the tbody, and `readPlot` falls back to the tbody rect when the plot is gone. Failed at `expect(zoomOf).toBeNull()` "the drag across the collapsed chart zoomed nothing", received `{from: 360, to: 937}`. (Without the added pre-expand assertion, the same break failed later at the expand step, `chart-plot` not found; so I added the assertion.)
2. Reorder: `chart-header.tsx:17` ArrowDown mapping removed. Failed: expected `chart-gathered-resources`, received `chart-units-produced`.
3. Edge label: `line-chart.tsx:120` `placeMarkers(labelled, end, plotWidth, ...)` (full game end, no origin; the reviewer's break). Failed at both widths: "Castle 12:57" right expected <= 1139 received 1174.69 (1200 px); expected <= 1529 received 1558.32 (1800 px). Note: dropping only the `shown.from` origin argument while keeping `shown.to - shown.from` as the span does NOT fail the test (both viewports passed); the origin alone is not distinguishable by label position here. The call-site break the criterion names (full-game end) is caught.
4. Step band: `line-chart.tsx` `x1={band.from}` changed to `x1={highlight.from}`. Failed: `chart-step-band` count expected 1, received 0.

## Results
- `acceptance/aoe4-chart-zoom.spec.ts`: 30 passed (1.2 min), after restore of production code.
- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- Unit suite and `next build` not rerun: no production or unit file changed in this pass.
- Pre-existing tests edited: the two zoom-spec cases named in the findings (collapsed drag, survives collapse/reorder), assertions strengthened only; rework ticket allowed it.
- Doc claims: none added. Comments added: none.
- Unverified assumptions added: none.
- Out-of-scope findings: none.
