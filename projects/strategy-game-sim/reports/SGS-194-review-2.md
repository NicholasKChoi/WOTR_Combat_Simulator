# SGS-194 review 2

**Verdict: APPROVE**

Branch `sgs-194-results-charts-table` at 141a2534210f3fadaaa86a5ed830389888f0d05c. Delta review against the tip I bounced, 819d7892 (`git diff 819d789..141a253`). The base is `origin/main` 87f0cd7. The delta has one commit, "Measure chart marker labels only while the chart is expanded", and touches two files: `components/apps/aoe4-build-order/line-chart.tsx` (2 lines) and `acceptance/aoe4-chart-layout.spec.ts` (one new describe block plus imports).

## Blocking findings

None.

## Required fixes from review 1

1. Guard and deps: landed verbatim. `line-chart.tsx:129` reads `if (!text || labelKey === '' || collapsed) return` and `:136` reads `}, [labelKey, chartWidth, collapsed])`. `collapsed` is defined at `:116` (`layout?.collapsed ?? false`), so it is in scope. Collapsing runs the effect, which returns early without calling setState, so the effect does no extra work. Expanding re-runs the effect after the commit that removes `hidden`, and `getComputedTextLength()` then forces layout on a rendered element.
2. Acceptance case: landed at `acceptance/aoe4-chart-layout.spec.ts:467-511`. It follows the steps review 1 dictated:
   - It asserts the abbey line exists before editing it, and asserts the Feudal marker is defined.
   - It sets the duration to `ceil(feudal.at) + 12`.
   - Before expanding, it checks the precondition: Floating resources places the label `anchor: 'end', fits: true`.
   - After expanding, it reads both charts in one evaluate under `expect.poll` (LESSONS layout-read rule) and expects `end`/fits for both.
   - Can fail: on the old guard and deps, Gathered resources reads `start` with the right edge +52 px past the plot (review 1 inspection). The implementer's mutation run reverted exactly those two lines and the case failed at line 509 with `{ anchor: 'start', fits: false }`. The asserted value moves from `start`/false to `end`/true.
   - Helper use: `markerLabel` is imported from `chart-rows`, as `aoe4-chart-readability.spec.ts:3` does, and `waitForRun` comes from `acceptance/helpers.ts`. Neither is reimplemented.
3. Three named specs run: the implementer reports 37/37. I did not run them (acceptance-test's role).

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

Delta mode: no criterion carries a `(rework N)` tag. Only criterion 5, which review 1 failed, needs re-checking. The others stand as review 1 recorded them, and the delta touches no code they depend on.

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | table, aria-label, colgroup, tbody per chart, key results outside | pass | unchanged since review 1 |
| 2 | tbody shape, colspan 4, `th scope=rowgroup`, unit test | pass | unchanged since review 1 |
| 3 | `ChartHeaderRow` cells and aria | pass | unchanged since review 1 |
| 4 | B-T1 alignment | pass | unchanged since review 1 |
| 5 | B-T2 collapse / expand | pass | Fix at `line-chart.tsx:129,136`. Inspection after collapse, run change and expand: Gathered resources "Feudal 7:59" is `end` with its right edge -10 px from the plot edge at 1200 and 1280 and -12 px at 1800, identical to the always-expanded Floating resources chart. The new acceptance case covers it. |
| 6 | B-T3 reorder, midpoints, opacity | pass (note 1 of review 1 stands) | unchanged |
| 7 | B-T4 persistence | pass | unchanged |
| 8 | B-T5 width | pass | Inspection: page horizontal overflow 0 at 1200, 1280 and 1800 |
| 9 | tab-order spec unedited; no other pre-existing assertion changed | pass | The delta only adds a describe block. Across the whole branch (`git diff origin/main...HEAD` on test paths), the test files are the same as in review 1 plus this case. |
| 10 | No INVARIANTS regressions | pass | A1 to A3: UI effect only, no engine or data path |

## Invariants touched

A1, A2, A3 (paths `components/apps/aoe4-build-order/**`): all hold. No simulation code changed.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured, so this section was skipped.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` analyzed 160 files and found 0 clones.

## UI inspection

The delta changes rendered label placement, so I ran one inspection. I served the task checkout (`npx next dev`, port 3871), stopped it afterwards, and confirmed the port is free. At 1200, 1280 and 1800 (height 2800), each run did the same steps:
- clear storage, collapse Gathered resources;
- move the abbey line to `@6:00`, set the duration to Feudal + 12;
- expand, then read the Feudal label anchor and right-edge offset in both charts.

Results:
- Both charts show `end` at every width: -10, -10 and -12 px.
- Page horizontal overflow is 0 at every width.
- Screenshot `reexpanded-1280.png` was read: "Feudal 7:59" is whole and left of the marker line, inside the plot.

## Non-blocking notes

Review 1's notes 1 to 3 still apply unchanged (criterion 6 wording versus tbody opacity, the drop-position test reading boxes outside `expect.poll`, redundant `toContain` lines in `chart-header.test.ts`).

## Coverage

- Reviewed: the delta diff in full, `line-chart.tsx:108-140`, the new spec block and the helpers it uses (`openResults`, `control`, `chart`, `expectLayout` in the spec; `waitForRun` in `acceptance/helpers.ts:219`), and the commit message (author `choinickolas@gmail.com`; no ticket ids or factory pointers).
- Applied: LESSONS (`acceptance/**` layout-read rule) and the REPO.md review checklist sections "Every diff" and "AoE4 build order", the latter for the delta's UI state at 1200, 1280 and 1800.
- Not done: acceptance specs were not run (that is the acceptance-test role's job), and `next build` was not re-run for this two-line delta (the implementer reports it succeeds).
