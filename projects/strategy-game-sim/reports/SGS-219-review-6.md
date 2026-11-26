# SGS-219 review (n=6)

Verdict: **REQUEST CHANGES**

Branch `sgs-219-units-chart-population-cap-mark`, tip `49e116a42b563f65d692f27e5ca0abf1d288833a`, base `origin/main` (`0d70911`). Full review (first review of this ticket). Scratch `worktrees/review-sgs-219-units-chart-population-cap-mark`.

The production change is correct: one `timeMark: populationCapMark` entry on `chart-units-produced` (`components/apps/aoe4-build-order/results.tsx:73`). The docs and help text match the code, and the UI inspection found no defects. The blocking findings are all in `acceptance/aoe4-population-cap-mark.spec.ts`: one pre-existing assertion was weakened without a ticket rule, two new layout comparisons do not follow LESSONS, and the implementer's mutation record has no break for several added assertions.

## Blocking findings

1. `acceptance/aoe4-population-cap-mark.spec.ts:122` - contract - The pre-existing hide/hover/pin test asserted `page.getByTestId(POPULATION).locator('path[data-series="pinned:population"]')` `toHaveCount(1)`. Turning the test into a `MARKED_CHARTS` loop replaced that with `locator('path[data-series^="pinned:"]').first()` `toBeVisible()`, so the Population row no longer asserts that exactly one `pinned:population` line exists. The ticket's rule for existing tests is "Every other case in that spec keeps its assertion and its Population-chart target", and acceptance criterion 7 is "keeps asserting what it asserted before except the Population-only expectation". This change falls under neither, and the implementer's report calls it a "judgement call". Why it matters: a pre-existing assertion is weakened with no rule allowing it. Direction: keep the exact-count assertion per chart with a map, for example `const PINNED_LINE = { [UNITS]: 'pinned:<a unit line key the default build draws, e.g. villager>', [POPULATION]: 'pinned:population' }`, then `await expect(page.getByTestId(id).locator(\`path[data-series="${PINNED_LINE[id]}"]\`)).toHaveCount(1)`. Confirm the Units key against `unitLineSeries` (`key: u.baseId`) for the default build. Give the Units entry a mutation break: no pinned lines on the Units chart (for example `pinned={id === 'chart-units-produced' ? undefined : ...}` at `results.tsx:141`) must fail this line.

2. `acceptance/aoe4-population-cap-mark.spec.ts:117` and `:125` - convention - These lines compare the mark's `getBoundingClientRect().left` with `before` using a bare `expect(await mark.evaluate(...)).toBe(before)`, with no `expect.poll` or `toPass()`. Line 125 is new in both rows, and line 117 is new in the Units row. LESSONS.md (`Paths: acceptance/**`) requires every layout-value comparison to be wrapped in `expect.poll` or `toPass()`, because recharts redraws (here after pinning, which adds lines) move elements between reads. Why it matters: these are the documented flake shape in this repo (SGS-162 RCA). Direction: `await expect.poll(() => mark.evaluate((el) => el.getBoundingClientRect().left)).toBe(before)` at both lines.

3. `acceptance/aoe4-population-cap-mark.spec.ts` (several lines) - test - The implementer's Mutation checks (`SGS-219-implementer-5.md`) have no failing break for these added items. This is the only implementer report, so nothing else covers them:
   - `:77`, `:78`, `:80`, `:81`: the Units row of the looped first test (`data-at`, `data-label`, `stroke`, `stroke-width`). The report says "Not separately broken: the stroke and stroke-width assertions". For the Units row these are added assertions, not pre-existing ones. `MARKED_CHARTS` lists `UNITS` first, so one shared break fails on the Units row. Breaks: `line-chart.tsx:281` `stroke` to another colour; `:282` `strokeWidth={3}`; `:285` `data-at={drawnTimeMark.at + 1}`; `:284` `data-label="Cap"`.
   - `:102` (`data-at` in the views test): break with a view-dependent mark time at `results.tsx:73`, for example a mark shifted 60 s in the `buildings` view. `:103`: the record's `:287` label break names no test. State that it fails this test at `:103`.
   - `:119` (Units row, `chart-marker` count 0 after hiding every kind): break so the Units chart ignores `markerView.hidden` (for example pass `NO_MARKER_VIEW` for `chart-units-produced`).
   - `:122` (Units row, pinned line present): see finding 1.
   - `:124` (label text after pinning, Units row): break by dropping the label while pinned (`label={pinned ? undefined : {...}}` at `line-chart.tsx:286`). The count at `:123` does not catch this break.
   - `:133` and `:134` (Population not zoomed and still marked after zooming Units): break by sharing one zoom window across charts, or by using Units' zoom for Population. If no realistic break fails `:133`, state why it is kept.
   - `:167` (`markLabels` 0 for the run with the cap dropped): `:163` already asserts the absence. Record a break that fails `:167` alone, or delete the assertion and keep the read in `toPass` behind another settle condition.
   - `:177` (`markLabels` 1): the record's "adds-only (mark count)" break (delete the Units `timeMark`) fails on `:174` first. Break with the mark line still drawn but no label (`label` removed at `line-chart.tsx:286`).
   The data-condition guards at `:114`, `:169` and `:170` are exempt (common.md Tests requires them). Why it matters: an item with no failing break may be dead (common.md Tests, mutation check per assertion). Direction: run the breaks above in a `mutate-sgs-219` scratch and record each one with the line it fails on. Rewrite or delete any assertion no break can fail.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

1. Units shows exactly one mark, with `data-at` equal to the API value and label `Population cap m:ss`, in both views; Population keeps its mark - **pass**. The code at `results.tsx:73` and `:145` passes the same `populationCapMark(result)` regardless of `unitsProducedView`. Tests at spec `:71-85` and `:96-105`. Inspection: both views at 1200/1280/1800 px, count 1, `data-at` 1094.94 (default) and 1247.01 (upgrade build, 1800 s).
2. A 600 s run shows no mark on any chart - **pass** (spec `:87-94`; `populationCapMark` returns null for a null cap, `result-series.ts:137`).
3. Gather rates, Gathered resources and Floating resources show no mark - **pass** (spec `:83`; the record has the pass-to-every-chart break failing).
4. On Units the mark ignores hide, hover and pin; a pinned run draws no mark of its own; zooming Units hides it there while Population keeps its own - **pass** on the code (`line-chart.tsx:156` and `:278` depend only on `timeMark`, `shown` and `zoomed`, not on markers, `markerView` or `pinned`; `timeMark` comes only from `result`, `results.tsx:145`). Tests at `:107-127` and `:129-137`, subject to findings 1-3. "A run with no markers" has no Units test. The draw condition does not read `markers`, so the code passes it. Non-blocking note below.
5. (respec 1) `data-label-rows`, marker lines, series paths and upgrade dots equal those of the same run with the mark absent; the mark label is the only extra label - **pass** (`rows` comes from `placed` at `line-chart.tsx:154`, which excludes the time mark; spec `:139-184`). Subject to finding 3 for `:167` and `:177`.
6. Docs and help - **pass**. `docs/aoe4-build-order-ui.md:131`, `:139`, `:191` and `:197`, and `docs/aoe4-build-order-format.md:476`, are each true against the code. `page-help.tsx:101-107` matches, and `page-help.test.ts` still checks seven sections and adds a regex on the Units paragraph. `ARCHITECTURE.md:30` ties the mark to no chart (confirmed, no edit needed). `docs/aoe4-build-order.md` needs no edit.
7. Edited specs keep their assertions except the Population-only expectation; listed specs pass with the run list - **fail** (finding 1). The run list is present (27 files, all passed).
8. Pre-existing unit tests keep their assertions - **pass** (`page-help.test.ts` only adds a line; vitest on it: 6 passed).
9. No INVARIANTS.md regressions - **pass**.

Chore check: no runnable behavior changes beyond the mark the PROJECT.md decision (Q138) allows for a `(standalone chore)`. The pre-existing spec edits are ones the ticket prescribes, apart from finding 1.

## Invariants touched

- A1, A2, A3 (paths `components/apps/aoe4-build-order/**`): hold. No `lib/` or data change, and the mark time comes from the API's `populationCapReachedAt`.
- S1: holds (no cross-app import).
- spec-checklist: Contracts (names match the CONTEXT Key surfaces; `chart-time-mark` and `populationCapMark` unchanged), Scope (nothing out of scope; `line-chart.tsx`, `chart-markers.ts`, zoom modules and `compare.ts` untouched), Naming, A1-A3: all hold.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup` (jscpd, both configs): 0 clones.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured; skipped.

## UI inspection

I served the task checkout at port 3871 (`npx next dev`) and ran `inspect.cjs` (Playwright). It loaded the default build (cap 18:15) and `ENG Knight/Longbow (King's Palace)` at 1800 s (cap 20:47, with tier text and 12 marker lines). Each was checked at 375, 1200, 1280 and 1800 px, in the Units and Buildings views of Units produced, plus the Population chart. For each, the script checked the mark count, `data-at`, stroke, whether the label box is inside the grid and above the x axis line, overlap of the label with every other SVG text and upgrade dot, clipped overflow inside the chart, and document horizontal overflow.

Results:
- The mark count is 1 on both charts in every case.
- The label is inside the grid and above the axis everywhere.
- The label overlaps no text or dot. The upgrade build's `Veteran` tier text sits clear of it.
- No clipped elements.
- Document horizontal overflow appears only at 375 px, which is the documented below-minimum behavior under the 1200 px floor and was present before this change.

Screenshots read: `upgrade-1200-units-units`, `default-1280-buildings-units`, `default-1800-units-units`, `upgrade-1280-population`. The mark draws in `#a52a2a` with its bottom label on the side the rule picks. In the Buildings screenshot the label is behind the recharts tooltip, which my click on the toggle left open (an inspection artifact; the numeric check shows no overlap). The server was stopped and the port is free.

## Non-blocking notes

- `page-help.tsx:106`: the edited JSX text line is about 210 columns, while its siblings wrap at about 160. Consider rewrapping. Suggested wording: "Its red vertical line, the same line the Units chart draws, shows when the population cap was reached; the line is not a marker, ...".
- `page-help.test.ts:55`: the regex `[^]*` spans the whole help text, so it still passes if the sentence moves to a later paragraph. Matching within the Units paragraph would be tighter.
- Criterion 4's "a run with no markers" has no Units test. The draw path does not read `markers` (`line-chart.tsx:278`), and the ticket's Scope coverage list does not name this case.

## Coverage

Files reviewed: all six changed files, plus `line-chart.tsx` (`SeriesChart`, `timeMarkDrawn`), `result-series.ts` `populationCapMark` and `unitLineSeries`, `acceptance/helpers.ts` (`setDurationInPlace`, `openPage`), `ARCHITECTURE.md:30`, the cap mentions in `docs/aoe4-build-order.md`, and the other specs and unit tests that name `chart-time-mark`, `timeMark` or `Population cap`. I ran no acceptance tests (role rule). I did not rerun `npx next build`; the implementer recorded it succeeding, and the inspection's `next dev` compiled the page.

REPO.md Review checklist: "Every diff" was done (the page was loaded through `next dev`). "AoE4 build order" was done: screenshots at 1200, 1280 and 1800, with 375 for the below-minimum rule; no axis or marker label overlap; no copied helper (the diff reuses `populationCapMark`); no Bootstrap/module CSS mix (no styling change). The other sections do not apply.
