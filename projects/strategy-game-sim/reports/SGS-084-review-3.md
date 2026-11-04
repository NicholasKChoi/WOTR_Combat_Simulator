# SGS-084 review 3 (delta: rebase conflict resolution)

- **Verdict: APPROVE.** No blocking findings.
- Scope: `git range-diff b39cba4..b37d345 9dfe36f..5c9a348` (review 2 approved b37d345; rebased onto origin/main 9dfe36f, tip 5c9a348fce004d68586cbc41e6743239acabbdff).

## Range-diff
- Commit 2 (b37d345 -> 5c9a348): identical patch (`=`).
- Commit 1 (42f836e -> 764989d): only context changes in `line-chart.tsx` and `results.tsx`. Every other file (simulate.ts, model.ts, result-series.ts, tests, openapi.json, docs, acceptance version pins) has the same patch as the approved commit. `docs/aoe4-build-order.md` auto-merged; the `gatherers` Outputs bullet and the `Per villager` toggle paragraph sit next to main's text and do not contradict the step-band docs.

## Conflict resolution
- `components/apps/aoe4-build-order/line-chart.tsx`
  - Imports: `type ReactNode` (branch) plus `ReferenceArea` (main) both present.
  - Props (line 73-74): `highlight?: StepSpan | null` and `headerControls?: ReactNode`; destructuring (line 77) has `highlight = null, headerControls`.
  - Render: the branch's header wrapper (lines 104-111) and the y-label `textAnchor: 'middle'` are applied; main's `ReferenceArea`/`ReferenceLine` band blocks (`data-testid="chart-step-band"`) are unchanged. `git diff 9dfe36f..HEAD` on this file shows only the branch's three hunks, identical to the approved branch hunks. Nothing from main lost.
- `components/apps/aoe4-build-order/results.tsx`
  - Single `import { useMemo, useState } from 'react'` (main already imported both; the branch's separate `useState` import dropped correctly).
  - Main's `rows`/`active`/`activeRow`/`highlight` kept; branch's `perVillager` state and `gatherRateSeries` follow them (line 30-31). Hook order is unconditional (no early return before any hook).
  - Gather rates `SeriesChart` (line 61-83) passes both `highlight={highlight}` and `headerControls={...}`, plus per-villager `yLabel`, `series`, and `pinned`. The other three charts are unchanged against main (still pass `highlight`).

## Checks run (in a detached review worktree at 5c9a348)
- `npx tsc --noEmit`: pass. `npm run lint:dup`: 0 clones.
- `npm test`: 46 files, 1452 passed, 10 skipped.
- Playwright: `aoe4-build-order-step-band.spec.ts` (8) and `aoe4-gathered-resources.spec.ts` (5) pass, plus a throwaway combined spec (deleted after the run, not committed): run default build, check `gather-rates-per-villager`, y label reads `Per villager per minute`, hover a completed step row -> exactly one `chart-step-band` in `chart-gather-rates` with `data-from`/`data-to` equal to the step's `startedAt`/`completedAt` and non-zero height, the box stays checked, the label stays; pointer off removes the band; uncheck, re-hover -> band back and label `Per minute`. 15/15 passed. Both features work together on the Gather rates chart.

## Acceptance criteria
- Delta mode: no code outside the conflict changed, so the criteria ticked at review 2 still hold. Criteria 64 and 65 (respec 1 / rework 1, page-level per-villager tooltip value checks) are the acceptance-test gate's specs, running in parallel; left unchecked here.
- Rework 1 criterion "Rebase onto current origin/main ... keep `textAnchor: 'middle'` and main's `<Tooltip>` changes": still holds after this second rebase (`formatChartValue` tooltip present, `textAnchor: 'middle'` present).

## Invariants touched
- None beyond review 2; the resolution touches only UI composition. The simulate engine patch is byte-identical to the approved one.

## Bot reconciliation
- `reviewBot.cli` empty; no rules file. Nothing to reconcile.

## Non-blocking notes
- None.

## Coverage
- Reviewed: range-diff of both commits; full current `line-chart.tsx` (SeriesChart) and `results.tsx` top and Gather rates chart; docs diff vs main.
- Not reviewed: unchanged-patch files (approved at review 2). REPO.md review checklist not re-run beyond the conflict files (delta).
- Processes: Playwright's own `webServer` stopped. A `next-server` on port 3784 belongs to the acceptance-test gate's worktree (`worktrees/sgs-084-aoe4-gather-rate-per-villager`), not this review.
