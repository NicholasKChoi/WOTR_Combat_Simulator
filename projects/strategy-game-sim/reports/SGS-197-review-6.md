# SGS-197 review 6 (delta, rework 1)

- Branch `sgs-197-chart-zoom-pan`, tip `5156184c78d41d43722b4e625e0baf728d552ad0`. Delta reviewed: `8a7ce31..5156184`, the tip review 4 bounced.
- Verdict: **APPROVE**. All four Required fixes from review 4 landed. The delta changes only `acceptance/aoe4-chart-zoom.spec.ts` (+65/-3) and no production file.

## Blocking findings

None.

## Required fixes from review 4

1. **Collapsed-chart drag (spec :189-207): landed.** The test now reads the collapsed RATES tbody rect and takes the point at 30% of its width and at its vertical middle. In the same evaluate it reads `elementFromPoint(x, y).closest('tbody').dataset.testid` and asserts that it is `chart-gather-rates`. It then presses there, moves 300 px right in 6 steps, releases, expands and calls `expectUnzoomed`.
   - The new assertion before the expand, `zoomOf(page, RATES)` is null, reads `data-zoom-from`/`data-zoom-to` on the tbody (spec :46-51), so it is not vacuous while the plot is unmounted.
   - The implementer ran the mutation review 4 named (press handler moved to the tbody). The test failed with `{from: 360, to: 937}`.
2. **Reorder (spec :647-651): landed.** Before ArrowDown the test asserts the previous sibling is `UNITS` (`chart-units-produced`). After the key press it polls until the sibling is `GATHERED` (`chart-gathered-resources`), then calls `stays()`. The implementer's mutation (removing the ArrowDown mapping) failed it with `chart-units-produced` received.
3. **B-Z7 window-edge label (spec :419-440): landed.** The new case runs at the 1200 and 1800 px viewports and selects 0.5 to 790/1200 on RATES.
   - From the API result it first asserts an age-up inside the window within 20 s of `to`.
   - Then, in one evaluate under `toPass`, it asserts that every `text.recharts-label` without a rotate transform lies within the grid's left and right edges, with 1 px slack. The y-axis label is drawn with `angle: -90` (`line-chart.tsx:166`), so the filter correctly leaves it out.
   - The implementer ran the full-game-end break the criterion names. The test failed at both widths: 1174.69 > 1139 at 1200 px, and 1558.32 > 1529 at 1800 px.
4. **Step band crossing `shown.from` (spec :489-516): landed.** The test first asserts `startedAt < shown.from < completedAt <= shown.to`. It then asserts one `chart-step-band` with the step's own `data-from`/`data-to`. In one evaluate under `toPass`, it checks that the band's left is within 1 px of the grid's left and its right is within 1.5 px of `grid.left + (completedAt - shown.from)/(shown.to - shown.from) * grid.width`. The implementer's `x1={highlight.from}` mutation failed it, with band count 0 instead of 1.

Nothing else is touched. The three deleted lines are the old press point, the old move target and the old `not.toBeNull()` reorder poll; each is replaced by a stronger check. No other test in the file was weakened.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria (delta re-check)

| Criterion | Verdict | Evidence |
|---|---|---|
| Select (B-Z1 to B-Z3), collapsed case | pass | Fix 1 |
| Markers, band, pinned (B-Z7) | pass | Fixes 3 and 4. The required check "a test fails if `placeMarkers` is still given the full game's `end`" is now met. |
| Survives (B-Z12) | pass | Fix 2 |

I did not re-check the other criteria: per delta mode, they keep their review-4 verdict (pass), and no production code changed. The invariants touched (A1-A3 and S1) still hold, because the delta is test-only.

## Lint

I ran `npx tsc --noEmit && npm run lint:dup` in the review scratch at 5156184, using the task checkout's `node_modules`. Both are clean: 0 clones, both in the source config (269 files) and in the tests config (168 files).

## Bot reconciliation

REPO.md has no `reviewBot.cli` and no `rulesFile`, so there is nothing to reconcile.

## UI inspection

Not run. The delta changes no UI, only an acceptance spec.

## Non-blocking notes

- `acceptance/aoe4-chart-zoom.spec.ts:647`: the closure `before` is also used after the press (`expect.poll(before).toBe(GATHERED)`). A name such as `previousChart` would read better.
- `:489`: the test name "with the step own times" reads better as "with the step's own times".
- Implementer's finding on fix 3: dropping only the `shown.from` origin argument, while still passing the window span, does not move any label far enough to fail the new case. The criterion asks about the full-game `end`, and that break is caught. The origin parameter itself is covered by the `placeMarkers` unit row in `chart-markers.test.ts`, so this leaves no gap against the ticket.
- The new step-band test and the existing one (:464) share three setup lines (`setupKnightLongbow`, `showView('table')`, units chart visible). That is two blocks, below the three-block helper threshold.

## Coverage

- Reviewed: `git diff 8a7ce31..5156184`, which is `acceptance/aoe4-chart-zoom.spec.ts` only. I also read its helpers (`zoomOf`, `zoomed`, `select`, constants :6-116), the existing band test (:464-487) and the label rendering in `components/apps/aoe4-build-order/line-chart.tsx` (:120, :166).
- Not run, per role: acceptance and browser tests. I judged coverage by reading the tests and the implementer's mutation record (reports/SGS-197-implementer-5.md).
- No REVIEW.md exists at the repo root, and no LSP tool was available.
