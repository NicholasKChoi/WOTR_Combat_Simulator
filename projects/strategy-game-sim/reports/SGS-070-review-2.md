# SGS-070 review 2

Verdict: **APPROVE**

Branch `sgs-070-aoe4-chart-legends-markers`, tip `2584b119f3dd2595369416a392bc5666c4d35df7` (local ref; not on origin), base `origin/main` `54d7e90`. This gate bounced the task, so it ran in full. The delta since `935bb17` was read line by line. Node 24.22.2. Worktree `worktrees/review-sgs-070-2`, removed after the review.

## Blocking findings

None.

## Spec gaps

None blocking. There is one wording fix for the ticket, under Q2 below.

## Manager questions

### Q1: Is the pin-compare test stable now?

Yes. All runs used `ACCEPTANCE_PORT=3871`.
- `npx playwright test acceptance/aoe4-build-order-pin-compare.spec.ts -g "a 400 run removes charts" --repeat-each=20`: **20/20 passed**.
- The whole pin-compare spec with `--repeat-each=20` (180 tests, 6 workers, so under the parallel load that showed the flake in review 1): **180/180 passed**.
- Full `npm run acceptance` (via `npx playwright test`): **551/551 passed**.

The `expect.poll` change (`pin-compare.spec.ts:194-200`) treats a null `boundingBox()` as "not yet" and retries. That removes the race. It still fails for a real reason, because the poll times out if the pinned line is not shorter than the current one.

### Q2: Does criterion 8 accept `data-label-rows="0"`?

Ruling: **criterion 8 is satisfied. Rework item 3's phrase "equals the max row + 1" cannot be met with a non-zero value in a server render, and the ticket wording should change, not the code.**

- `line-chart.tsx:88`: `const placed = chartWidth === null ? [] : placeMarkers(...)`. This guard already exists on `main` (`54d7e90` `line-chart.tsx:105`). Labels are placed only after `ResponsiveContainer` reports a width, and that never happens in `renderToString`. So on the server `placed` is empty and `rows` is 0. That 0 is exactly "max placed row + 1, 0 with none placed".
  - A non-zero server value would require placing labels at an assumed width. The client would then recompute different rows, which causes a hydration mismatch. That would be a behaviour change outside this ticket's scope.
- Criterion 8 as written asks for "renders with markers without error and `data-label-rows` is present". `line-chart.test.ts:55-59` does that: it renders with two markers and asserts `data-label-rows="0"`.
- The test can fail. Mutation: drop the `chartWidth === null ? [] :` guard, so labels are placed at plotWidth 1. "renders the label-row count, 0 without markers and 0 on the server with markers" then fails. Reverted. The test name matches what it asserts.
- The real non-zero value is covered elsewhere:
  - The committed acceptance check (`aoe4-build-order.spec.ts:373-375`) asserts rows > 0 and grid top = 5 + rows × 14 at 768 and 390 px.
  - My own probe at 1280 px on `english-knight-longbow` (below) found rows = 4 = the number of distinct label rows.
- **Recommended ticket wording fix:** change rework item 3 to "a server render with at least one marker, asserting `data-label-rows` is present and `0` (labels are placed only after the container reports its width)". Also, the Scope "Measurement" sentence implies that the server render places labels using the `label.length * 8` estimate. It does not: the estimate applies only on the client between the first resize and the first measuring effect. The sentence should say so.

### Q3: Does the legend acceptance test catch drift in the pinned line's stroke?

**The legend test alone does not catch it. A sibling test in the same spec does.** I tried the mutation.
- Mutation: in `line-chart.tsx:121`, change `stroke={pinnedColor(series, s.key, i)}` to `stroke={seriesColor(series.length + i)}`. The pinned line turns purple while the legend swatch stays blue.
  - "the pinned legend item toggles only the pinned line" (`pin-compare.spec.ts:77`) **passes**. It reads `stroke` from the current `food` line (line 88) and compares both swatches to that, so it never reads the pinned line's stroke.
  - "pinned lines are dashed in the current series colour while current lines are solid, in all three charts" (`pin-compare.spec.ts:53`) **fails**: `Expected: "#1f77b4" Received: "#9467bd"`.
  - Reverted.
- So the suite enforces pinned swatch = current stroke = pinned stroke, and the drift is caught. Since rework 1, swatch and line also share one helper (`pinnedColor`), so they can only drift if someone bypasses it.
- Not blocking. The legend test's name does not claim the pinned line's colour, and criterion 4 ("equal to the series line's stroke") is met. Optional tightening, noted below.

## Rework 1 items

| Item | Result | Evidence |
|---|---|---|
| Pin-compare test robust, `--repeat-each=20` | pass | Q1: 20/20 for the test alone, 180/180 for the whole spec |
| "each in its own element" can fail | pass | `line-chart.test.ts:47` now matches `</button></div></div><div …chart-marker-legend`. Mutation: render `MarkerLegend` inside `SeriesLegend`'s outer div. The test fails. Reverted |
| Criterion-8 server render with markers | pass (wording fix recommended) | Q2 |
| One colour helper in `chart-rows.ts`, used by legend and line | pass | `chart-rows.ts:53-78` has `pinnedColor` and `legendItems`. `chart-legend.tsx:2` and `line-chart.tsx:121` import them. `git grep` finds no other copy of the rule. `lint:dup` reports 0 clones |
| No other changes | pass | The delta `935bb17..2584b11` touches only those 5 files, for those purposes |

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Separate "Series" and "Markers" legends, marker legend below and not inside | pass | Acceptance descendant and box checks pass (551/551). The unit structural check can now fail |
| 2 | grep for `recharts-legend-item\|<Legend` has no matches | pass | `git grep` exit 1 |
| 3 | `data-series` matches; clicking `food` toggles; markers stay | pass | Acceptance legend and marker tests pass |
| 4 | Pinned order, dashed/solid swatches, colour equals stroke, opacity 0.5, `pinned:food` hides only its line | pass | `legendItems` unit tests; `pin-compare.spec.ts:53` and `:77`. Q3 shows how the drift is caught |
| 5 | `placeMarkers` exported, with no-intersection, row-0 and more-rows tests | pass | Unchanged since review 1, where the row-always-0 mutation failed |
| 6 | Measured-width argument honoured | pass | Unchanged since review 1 |
| 7 | Knight + longbow at 1280: no label overlap, rows = max row + 1, grid y = 5 + rows × 14, labels above it | pass | Reviewer probe on this tip, all three charts: 12 markers (9 between 10:00 and 17:00), `data-label-rows=4`, distinct label tops at 2.5/16.5/30.5/44.5 px (4 rows), grid top 60.5 px against 61 expected (the 0.5 px is the stroke half-width, inside the committed test's < 1 tolerance), lowest label bottom 57.5 ≤ 60.5, 0 overlapping pairs. The committed test still uses `english-1tc` at 768/390 (non-blocking) |
| 8 | Server render with markers, `data-label-rows` present | pass | Q2 |
| 9 | Solid marker lines, ids kept, no markers means no marker legend | pass | Acceptance and unit tests |
| 10 | Docs | pass | Unchanged since review 1 (the delta has no docs change) |
| 11 | `npm test`, `tsc`, `npm run acceptance` pass; edited tests listed | pass | `npm test`: 1086 passed / 8 skipped. `npx tsc --noEmit`: clean. `lint:dup`: 0 clones. `npx next build`: ok. Acceptance: 551/551. The rework 1 test edits are `pin-compare.spec.ts:194-200` and `line-chart.test.ts:6,47,55-59` (these are the diff; the implementer report lists the round-1 edits) |
| 12 | No invariant regressions | pass | See below |

All criteria and the rework 1 items are ticked in the ticket.

### Invariants

- S1: holds. `chart-rows.ts` gains no imports, and `chart-legend.tsx` imports only `model` and `./chart-rows`.
- S2 and S3: not touched.
- A1, A2 and A3: not touched. The change is display only and `lib/**` is unchanged.

## Lint

`npx tsc --noEmit` and `npm run lint:dup` are both clean.

## Bot reconciliation

`reviewBot.cli` is empty and there is no `rulesFile`. No bot ran.

## Non-blocking notes

- `pin-compare.spec.ts:88-92`: compare the `pinned:food` swatch with `path(..., 'pinned:food')`'s stroke instead of the current line's. The legend test would then catch pinned-line drift on its own (Q3).
- `line-chart.test.ts:62-80`: the `legendItems` tests now cover a `chart-rows.ts` export, but they stay in `line-chart.test.ts`. The sibling `chart-rows.test.ts` holds the tests for the other `chart-rows` helpers (`seriesColor`, `toggleHidden`, marker styling), so a maintainer would look for them there.
- `chart-rows.ts:68-70`: `pinnedItem` is a block-bodied arrow with a single `return`. The surrounding code uses expression bodies.
- Carried over from review 1, still open: `acceptance/aoe4-build-order.spec.ts:20-21` has a double blank line. The 1280 px knight + longbow overlap check is still not committed; this review verified it with a probe.

## Coverage

Reviewed:
- The delta `935bb17..2584b11`: `chart-rows.ts`, `chart-legend.tsx`, `line-chart.tsx`, `line-chart.test.ts`, `aoe4-build-order-pin-compare.spec.ts`.
- The relevant parts of `aoe4-build-order.spec.ts` (marker label checks). Sibling `chart-rows.test.ts`.
- `main`'s `line-chart.tsx` for the `chartWidth` guard.

Ran:
- `npm ci`, `tsc`, `lint:dup`, `npm test`, `next build`, the full acceptance suite.
- Repeated pin-compare runs (Q1).
- Three mutations: the server rows guard, legend nesting, and the pinned stroke. All were reverted.
- A temporary 1280 px knight + longbow probe spec, deleted afterwards.

REPO.md checklist:
- "Every diff": build ok, and the page was loaded at 1280 through Playwright.
- "AoE4 build order": the copied-helper rule is now satisfied. Axis and tick labels at 1280 were not re-screenshotted in this round; the delta does not change layout, and review 1 checked them.

No processes are left running. Port 3871 is free.
