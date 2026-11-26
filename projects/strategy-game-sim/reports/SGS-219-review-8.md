# SGS-219 review (n=8)

Verdict: **REQUEST CHANGES**

Branch `sgs-219-units-chart-population-cap-mark`, tip `65026066fb27e560c2c1cf6cd6a45c75715dbb54`, base `origin/main`. This is a full re-review after Rework 1; the prior review is `SGS-219-review-6.md` at `49e116a`. Scratch: `worktrees/review-sgs-219-units-chart-population-cap-mark`.

All three Rework 1 fixes landed in the code. The exact pinned-line count is restored per chart (`PINNED_LINE`, `:11`, `:123`). Both position reads now use `expect.poll` (`:118`, `:126`). The unbreakable `without.markLabels` assertion is gone. Production code and docs are byte-identical to the tip review-6 approved on content (`git diff 49e116a..HEAD -- components docs lib` is empty).

The one remaining blocker is the mutation record. Two later commits changed two tests after the breaks for them were recorded, so the rule "unless that item's test ... changed after it was recorded" voids those breaks. Several added items now have no valid failing break.

## Blocking findings

1. `acceptance/aoe4-population-cap-mark.spec.ts:117`, `:118`, `:121`, `:124`, `:126` - test - **Hide/hover/pin test.** Commit `b0f3fa7` changed `:118`, `:123` and `:126` of this test. That makes `SGS-219-implementer-5.md`'s breaks for it (run at `49e116a`) stale. `SGS-219-implementer-7.md` (run at `b0f3fa7`) records breaks only for `:120` (Units), `:123` (Units) and `:125` (both rows). These items have no valid failing break:
   - Units row: `:117` (count after hover), `:118` (polled `left` after hover), `:121` (count after hiding every kind), `:124` (count after pin), `:126` (polled `left` after pin).
   - Population row: `:118`, changed from a bare `expect` to `expect.poll`.
   - Population row: `:126`, new.
   
   Why it matters: an added or changed item with no failing break may be dead (common.md Tests). The `expect.poll` rewrite in particular has never been shown to fail on a persistent shift.
   
   Direction: at the current tip, re-run implementer-5's breaks in a `mutate-sgs-219` scratch and record the line each one fails on, per row:
   - `line-chart.tsx:278` hides the mark when `markerView.labelKind !== null`: must fail `:117`.
   - `line-chart.tsx:278` hides the mark when `markerView.hidden.size > 0`: must fail `:121`.
   - `line-chart.tsx:278` hides the mark when `pinned`: must fail `:124`.
   - `line-chart.tsx:280` shifts the mark's x while a marker entry is hovered (`labelKind` set): must fail `:118`.
   - `line-chart.tsx:280` shifts the mark's x while a run is pinned: must fail `:126`.

   No test change is needed if each fails.

2. `acceptance/aoe4-population-cap-mark.spec.ts:174`, `:177`-`:182` - test - **"Adds only its own label" test.** Commit `6502606` changed this test (`:166`-`:170`: it removed the `without.markLabels` settle and moved the two guards into the `toPass`). Both mutation records predate that commit. Implementer-7 ran its scratch at `b0f3fa7`, so its `:178` markLabels row is that commit's numbering; the line is `:177` at the tip. The new settle condition decides which `without` snapshot `:178`-`:182` compare against. So the earlier breaks no longer show that these items can fail at the tip. These items have no valid break:
   - `:174`: Units mark count 1.
   - `:177`: `markLabels` 1.
   - `:178`: `rows`.
   - `:179`: `markerLines`.
   - `:180`: `paths`.
   - `:181`: `dots`.
   - `:182`: `labels`.
   
   Direction: re-run these breaks at the tip and record the line each one fails on:
   - Delete the Units `timeMark` (`results.tsx:73`): must fail `:174`.
   - Label value `''` on the Units chart only (`line-chart.tsx:287`): must fail `:177`.
   - `line-chart.tsx:154` rows +1 while the mark is drawn: must fail `:178`.
   - `:127` drops the first visible marker while the mark is drawn: must fail `:179`.
   - `:159` drops the first chart row while the mark is drawn: must fail `:180`.
   - `:131` drops the first upgrade dot while the mark is drawn: must fail `:181`.
   - `:150` drops the first placed label while the mark is drawn: must fail `:182`.
   
   Each break is the one implementer-5 recorded. No test change is needed if each fails.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

1. Units shows exactly one mark with the API `data-at` and the `Population cap m:ss` label, in both views, and Population keeps its mark: **pass**. `results.tsx:73` passes the same `populationCapMark` regardless of `unitsProducedView`. Tests at spec `:72-86` and `:97-106`; breaks recorded in implementer-5 and implementer-7, and both tests are unchanged since.
2. A 600 s run shows no mark on any chart: **pass** (`:88-95`).
3. Gather rates, Gathered resources and Floating resources show no mark: **pass** (`:84`; implementer-5's pass-to-every-chart break).
4. On Units the mark survives hiding, hovering and pinning; a pinned run draws no mark; zooming Units hides it there while Population keeps its own: **pass** on the code (`line-chart.tsx:278` reads only `timeMark`, `shown` and `zoom`). Tests at `:108-128` and `:130-138`; finding 1 covers the missing records. "A run with no markers" still has no Units test; non-blocking, as in review-6.
5. (respec 1) `data-label-rows`, marker lines, paths and dots equal those of the run without the mark, and the mark label is the only extra label: **pass** on the code (`rows` comes from `placed`, which excludes the time mark). Test at `:140-184`; finding 2 covers the missing records.
6. Docs and help: **pass**. The text is unchanged since review-6, where it was checked against the code: `docs/aoe4-build-order-ui.md:131`, `:139`, `:191`, `:197`, `docs/aoe4-build-order-format.md:476`, and `page-help.tsx:101-107`. `page-help.test.ts`: 6 passed (rerun here).
7. Edited specs keep their assertions except the Population-only expectation, and the listed specs pass with a run list: **pass**.
   - The Population row again asserts `path[data-series="pinned:population"]` `toHaveCount(1)` (`:123`).
   - `:118` keeps the same comparison, now under `expect.poll`.
   - The base test 2's final Population count is kept inside the `MARKED_CHARTS` loop (`:94`).
   - The run list (27 files) is in implementer-5. Only this spec changed since then, and implementer-7 reran it (14 passed).
8. Pre-existing unit tests keep their assertions: **pass**.
9. No INVARIANTS.md regressions: **pass**.

Chore check: no runnable behavior changed in this rework (test file only). The only visible change is the mark that the PROJECT.md decision allows for a `(standalone chore)`.

Rework 1 Required fixes: all three are ticked and landed. For `:122`→`:123`, the Units key `pinned:villager` matches `unitLineSeries` (`key: u.baseId`, `result-series.ts:12-14`), and the `results.tsx:141` break is recorded as failing `:123` on the Units row. `:117/:125`→`:118/:126` use `expect.poll` as dictated. The `:167` assertion was deleted (allowed by the fix text). The third fix's breaks were run, but the record went stale after `6502606`; see finding 2.

## Invariants touched

- A1, A2, A3: hold. No `lib/` or data change; the mark time is the API's `populationCapReachedAt`.
- S1: holds.
- spec-checklist: no item or invariant has `Paths:` on `acceptance/**`. The production items were checked in review-6 and that code is unchanged.

## Linter

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones (190 files).

## Bot reconciliation

`REPO.md` has no `reviewBot.cli` or `rulesFile`; skipped.

## UI inspection

Not rerun. The UI code (`components/`) and docs are byte-identical to `49e116a`, which review-6 inspected at 375, 1200, 1280 and 1800 px in both Units produced views and on Population. That run found no overflow, overlap or clipping (see `SGS-219-review-6.md`, UI inspection). This rework changed only the acceptance spec.

## Non-blocking notes

- `:101` (`aria-pressed` after the view click) and `:164` (no Units mark under `dropCap`) are setup guards with no recorded break. I treat them like the exempt data-condition guards (`:115`, `:168`, `:169`). Giving them a message string would mark them as guards.
- `PINNED_LINE: Record<string, string>` lets a typo'd chart id return `undefined`, which builds the selector `data-series="undefined"`; the test would then fail on count 0, so the typo would not pass silently. Fine as is.
- Review-6's notes stand, as the implementer left them: `page-help.tsx:106` line length, the span of the `page-help.test.ts:55` regex, and no Units test for "a run with no markers".

## Coverage

- Reviewed: the full branch diff (6 files), the rework delta `49e116a..HEAD`, `results.tsx:59-145`, and `result-series.ts` `unitLineSeries`.
- Checked the mutation records of `SGS-219-implementer-5.md` and `SGS-219-implementer-7.md` against the tip, item by item.
- Ran no acceptance tests or mutations (role rule).
- REPO.md Review checklist: "Every diff" and "AoE4 build order" were done in review-6 on the same production code. This delta is test-only, so no page reload was needed. The other sections do not apply.
