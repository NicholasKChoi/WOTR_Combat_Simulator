# SGS-081 review 4

Verdict: **REQUEST CHANGES**

Full re-review by the gate that bounced (review 3 at `f0fe3d6`), at tip `021baa5`. Delta `f0fe3d6..021baa5` touches
`acceptance/aoe4-simulate-api-triggers.spec.ts`, `data/aoe4-build-order/README.md` and `lib/aoe4-build-order/builds.test.ts`.
All five Rework 6 Required fixes are done correctly. One blocking finding remains: the marker-label acceptance failures
the manager asked about. They are a real regression on this branch, not a pre-existing flake. Worktrees:
`worktrees/review-sgs-081-r4` (021baa5) and `worktrees/review-sgs-081-r4-base` (2fc9593), both removed after the review.

The implementer report `reports/SGS-081-implementer-5.md` does not exist. I reviewed from the diff and the ticket.
The build JSONs did not change since `f0fe3d6`, so the per-build 1200 s values in `SGS-081-implementer-4.md` still apply.

## Blocking findings

1. `acceptance/aoe4-build-order.spec.ts:385-396` (`expectMarkerLabelsApart`) - test - The three "marker labels" specs
   fail on `021baa5` when run alone. They fail 9 of 10 runs on 021baa5 and 0 of 10 on `2fc9593`. I ran
   `npx playwright test acceptance/aoe4-build-order.spec.ts -g "marker labels"` 10 times on each tip, alternating, on an
   idle machine (load about 1).
   - Failures on 021baa5: the 768 px or 390 px 1TC case, once both. Every failure was at line 396
     (`Math.abs(plot.y - svgBox.y - (5 + rows * 14))`), with received values 3.5, 4.5, 8.5 and 10.5. The implementer
     saw the same race surface as the overlap assertion at line 408.
   - Cause: the helper reads each label's `boundingBox()`, then the plot box, then the SVG box, in sequence. Meanwhile
     the page is still smooth-scrolling to the results panel (`pages/apps/aoe4-build-order.tsx:151`
     `panel.scrollIntoView()`, with Bootstrap `scroll-behavior: smooth`). I sampled `scrollY` every 100 ms after the
     first chart line was visible:
     - 021baa5: `809,329,323,...` at 768 px and `900,377,353,...` at 390 px.
     - 2fc9593: `377,323,...` and `468,353,...`.

     The 1TC build now has 41 steps instead of 25. That makes the page taller (scrollHeight 7247 vs 5403 at 768 px,
     10103 vs 7255 at 390 px), so the scroll travels further and is still moving when the reads happen.
   - The product is correct. A probe that waited 3 s and then read every rect in one `page.evaluate` got a plot offset
     error of 0.0 and 0 label overlaps in all four charts at both widths, on 3 runs out of 3.
   - Under full-suite load the race usually hides: `npx playwright test acceptance/aoe4-` gave 510 passed in one run.
   - Why it matters: the criterion "`npm run acceptance` passes for every `acceptance/aoe4-*.spec.ts`" now fails most
     isolated runs because of this branch's data change. This is also the exact pattern the repo LESSONS.md bans
     ("never compare two sequential `boundingBox()` calls").
   - Direction: in `expectMarkerLabelsApart`, collect the label rects, the `.recharts-cartesian-grid` rect, the
     `svg.recharts-surface` rect and `data-label-rows` in a single `root.evaluate`. Wrap that read plus the offset check
     in `expect.poll` (or `expect(...).toPass()`) so it retries until the scroll settles, then assert above-plot,
     inside-plot and no-overlap on that one snapshot. Keep every assertion and tolerance; do not loosen them. The spec
     is an `acceptance/aoe4-*.spec.ts` file, so the ticket's diff-scope criterion allows the change; list it in the
     report.

## Rework 6 Required fixes

| Fix | Result |
|---|---|
| README.md:91-92 replaced with review-3 finding 1 text, word for word | done. `README.md:89-93` matches the quoted text exactly; steps 4-8 of the spear file (`mill` from sheep then farm, three farms sheep to farm, a fourth sheep to sheep) agree |
| README.md:85-86 Town Center rally sentence | done. `README.md:84-85` matches; `start.rally` is `sheep` and step 2 rallies to wood at 20 s |
| README.md:100-102 replaced with review-3 finding 3 text | done. `README.md:101-102` matches |
| Triggers spec compares every non-reaction step, keeps 24 pins, exact length | done. `aoe4-simulate-api-triggers.spec.ts:445-449`: `slice(0, -1)` covers steps 0-39. 1TC has 41 steps and the only reaction is index 40, so this is every non-reaction step. Length is pinned to 40 and 41 |
| Spear/longbow idle-arrival/step-stuck coverage through 1800 s | done. `builds.test.ts:184-190`. Mutation check: with steps 34 and 37 rallied to `sheep`, it fails with an `idle-arrival` warning; reverted afterwards |

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `production-floors.ts` values, two importers, case shape, catches 2fc9593 | pass | unchanged since review 3 |
| 2 | All three builds pass every per-build case | pass | `npm test`: 1350 passed, 10 skipped (1349 plus the new spear case) |
| 3 | Spear "reaches Castle" unchanged; no idle-arrival/step-stuck through 1800 s | pass | case unchanged; the new case covers 1800 s and can fail (mutation above) |
| 4 | Plans kept; 1TC frozen slice; added steps triggered | pass | build JSONs unchanged since review 3, which verified this by script |
| 5 | Round-trip and validate | pass | existing cases pass |
| 6 | Prebuilt-farms spec; no `MAX_SPEAR_LONGBOW_STEPS`; lint:dup | pass | unchanged; 0 clones |
| 7 | Re-pins re-derived and listed | pass | triggers spec fixed. The listing lives in implementer-4; implementer-5's report is missing |
| 8 | README checks | pass | regex prints 0; findings 1-3 fixed; no floor numbers |
| 9 | Design doc bar paragraph | pass | unchanged |
| 10 | Report gives per-build 1200 s values | pass | implementer-4; data unchanged |
| 11 | Diff stat scope | pass | delta touches only allowed files |
| 12 | npm test, tsc, lint:dup, acceptance pass for every `aoe4-*.spec.ts` | fail | tsc, lint:dup and npm test pass; the full aoe4 acceptance passed once (510), but the marker-label specs fail 9/10 isolated runs (finding 1) |
| 13 | No invariant regressions | pass | see below |

No boxes ticked (verdict is not APPROVE).

## Invariants

- A1 holds. No code change in the delta.
- A2 holds. Build data is unchanged since review 3, which verified no `waiting` step at 1200/3600 s.
- A3 holds. There is no engine change, and the `man-at-arms` trigger is unchanged.

## Lint

`npx tsc --noEmit` is clean and `npm run lint:dup` finds 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Non-blocking notes

- `README.md:102` is now a 174-character line, and the rest of the entry wraps at about 110. It renders the same; a
  rewrap would match the file.
- `builds.test.ts:184-190` repeats the knight case's warning filter (`builds.test.ts:139`) in a second describe. There
  are two copies, which is under the three-copy threshold, and jscpd finds no clone. It is fine as is.
- Review-3 notes still stand: two builds hit the 200 population cap before 1200 s, and the spear "no gold deposit has
  run out at 1200 s" margin is 0.65 s.

## Coverage

- Reviewed: all three files in `f0fe3d6..021baa5`, plus `acceptance/aoe4-build-order.spec.ts:385-442`,
  `components/apps/aoe4-build-order/line-chart.tsx` and `pages/apps/aoe4-build-order.tsx:146-151` for the marker-label
  diagnosis.
- Ran on Node 24.22.2:
  - tsc, lint:dup, `npm test` and `npx next build` (succeeds);
  - the full `acceptance/aoe4-` suite (510 passed);
  - 10 isolated "marker labels" runs on each of 021baa5 and 2fc9593;
  - three temporary probe specs, one for the settled layout and one for scrollY on each tip, all removed;
  - one mutation run of the new spear case, reverted.
- REPO.md "Every diff" and "AoE4 build order" sections applied. There is no UI change, so no screenshots.
