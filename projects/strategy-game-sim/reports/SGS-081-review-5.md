# SGS-081 review 5

Verdict: **APPROVE**

Delta review by the gate that bounced (review 4 at `021baa5`), at tip `eb6406c`. The delta `021baa5..eb6406c` is one file:
`acceptance/aoe4-build-order.spec.ts` (+38/-24), only in `expectMarkerLabelsApart` (lines 385-425). Review 4 passed
everything else at `021baa5`. Worktree: `worktrees/review-sgs-081-r5`, detached at `eb6406c`, removed after the review.

Note: `origin/sgs-081-aoe4-retune-prebuilt-farms` is still at `2fc9593`. `021baa5` and `eb6406c` are local commits only,
so the manager must push before the PR step.

## Blocking findings

None.

## Rework 7 Required fixes

| Fix | Result |
|---|---|
| One `root.evaluate` for label rects, plot rect, SVG rect and `data-label-rows`, retried with `toPass` | done. `aoe4-build-order.spec.ts:387-424`. Every value comes from one synchronous `getBoundingClientRect` snapshot, so all the geometry is from one frame. `toPass()` retries until the scroll settles. Same shape as the sibling `aoe4-step-table.spec.ts:476-493` |
| Assertions and tolerances unchanged | confirmed line by line. Plot offset is still `Math.abs(plot.y - svgBox.y - (5 + rows * 14)) < 1` (:409). Above-plot is still `<= plot.y + 0.5` (:411). The inside-plot (:414) and pairwise no-overlap (:420) expressions are character-identical. `rows > 0` is kept (:408). The old per-label `toHaveCount(1)` is now `matches.length === 1` per label plus `found` having length `markers.length` (:396-405), which is the same strictness |
| `-g "marker labels"` 10/10 alone; full aoe4 acceptance passes | confirmed independently, see below |

### Runs on eb6406c (Node 22.17.0, load about 1)

- `npx playwright test acceptance/aoe4-build-order.spec.ts -g "marker labels"` alone, 10 consecutive runs: 3 passed every run, 10/10 (review 4 saw 1/10 on 021baa5).
- Mutation: in `components/apps/aoe4-build-order/line-chart.tsx:150` I changed `dy: (row - rows)` to `(row - rows + 1)`. All 3 specs failed with "label N in chart-units-produced is not above the plot", after `toPass` timed out at the 60 s test timeout. Reverted, and `git status` is clean. So the retry does not make the check pass no matter what.
- `npx playwright test acceptance/aoe4-`: 510 passed (1.4 min).
- `npm test`: 1350 passed, 10 skipped. `npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones. `npx next build` succeeds.

## Spec gaps

None.

## Acceptance criteria (whole ticket, at eb6406c)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `production-floors.ts` values, importers, case shape, catches 2fc9593 | pass | unchanged since review 3/4 |
| 2 | All builds pass every per-build case | pass | `npm test` 1350 passed |
| 3 | Spear "reaches Castle"; no idle-arrival/step-stuck through 1800 s | pass | unchanged since review 4 (mutation-verified there) |
| 4 | Plans kept; 1TC frozen slice; added steps triggered | pass | build JSONs unchanged since review 3 |
| 5 | Round-trip and validate | pass | `npm test` |
| 6 | Prebuilt-farms spec; no `MAX_SPEAR_LONGBOW_STEPS`; lint:dup | pass | unchanged; 0 clones |
| 7 | Re-pins re-derived and listed | pass | review 4; delta has no pins |
| 8 | README checks | pass | README unchanged since review 4 |
| 9 | Design doc bar paragraph | pass | unchanged |
| 10 | Per-build 1200 s values in report | pass | implementer-4; data unchanged |
| 11 | Diff-stat scope | pass | delta adds only `acceptance/aoe4-build-order.spec.ts` (allowed as `acceptance/aoe4-*.spec.ts`), listed in implementer-6 |
| 12 | npm test, tsc, lint:dup, acceptance for every `aoe4-*.spec.ts` | pass | all pass; 510 acceptance; marker labels 10/10 isolated |
| 13 | No invariant regressions | pass | test-only delta |

All 13 boxes ticked in the ticket.

## Invariants

The delta is test code only, with no production change.
- A1, A2 and A3 hold as in review 4.

## Lint

tsc is clean, and jscpd finds 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Non-blocking notes

- `aoe4-build-order.spec.ts:405`: when a label is missing or duplicated, the failure now reads "expected length N, received M" instead of naming the label text. That is weaker diagnostics, but the behavior is the same.
- `:396` uses case-sensitive `textContent.includes`, while the old `hasText` was case-insensitive with normalized whitespace. That is stricter, and it passes.
- Out of scope, already on main (`e296ba9`): `aoe4-build-order.spec.ts:493` compares two sequential `boundingBox()` reads (`seriesBox`, `markerBox`). That is the pattern LESSONS.md bans, but it is a vertical-order check inside one chart and has not flaked. BACKLOG candidate.
- I ran on Node 22.17.0 (the harness asks for 24.x). Review 4 ran on 24.22.2, with the same suite counts.

## Coverage

- Reviewed: the full `021baa5..eb6406c` diff, its callers (`:427-504`), and the sibling pattern `aoe4-step-table.spec.ts:476-537`.
- REPO.md "Every diff" (next build) and "AoE4 build order" were applied. There is no UI change, so no manual page load beyond the acceptance runs.
- No processes left running.
