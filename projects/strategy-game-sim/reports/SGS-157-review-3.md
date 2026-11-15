# SGS-157 review 3 (delta mode)

- Branch: sgs-157-buildings-chart-overlap, tip 134c9a9b84a1ba71591f95b16a6223a69529c0ea
- Delta: 5d97056..134c9a9 (a38608c acceptance-test, 57d342a simplify, 134c9a9 rework 2)
- Scratch: worktrees/review-sgs-157-buildings-chart-overlap (removed after this report)

## Verdict: REQUEST CHANGES

The code change is correct. The blocking finding is in the two acceptance tests that a38608c adds. The
Rework 2 premise is wrong, as the implementer said; see "Rework 2 soundness" below.

## Blocking findings

1. `acceptance/aoe4-chart-views.spec.ts:207-209` and `:227-231` - convention (LESSONS.md "Playwright layout
   checks read every rect in one `page.evaluate` (or wrap the check in `expect.poll`)", Paths `acceptance/**`)
   plus repeated helper - what: both new tests define the same `endY` lambda, which reads one path per
   `evaluate`. They then compare values from sequential reads outside any poll: `gap()` for `before` at
   :209, and the three `expect(await endY(a)).toBe(await endY(b))` lines at :229-231. The rework-1 test
   at :186-191 reads both paths in one `chart.evaluate`, so the branch now has three copies of the
   end-y parse. - why it matters: in this chart the y pixels move between reads. `SeriesChart` re-renders
   after `ResponsiveContainer.onResize` and after the label-width `useEffect`, and the top margin is
   `CHART_MARGIN_PX + rows * LABEL_LINE_HEIGHT` (`line-chart.tsx:151`). A redraw between two reads changes
   the plot height. That is the flake class the lesson records (SGS-066/068/070). Also, a fix to the `d`
   parse would have to land in three places. - direction: add one file-level helper next to `line`
   (`:34`) that reads every requested path in one evaluate. Move the body of :186-191 into it, for example
   `const lineEndYs = (page: Page, id: string, keys: readonly string[]) => chart(page, id).evaluate((el, ks) => ks.map((key) => Number(el.querySelector(\`path[data-series="${key}"]\`)?.getAttribute('d')?.match(/-?[\d.]+/g)?.at(-1))), keys)`.
   Use it in all three Buildings tests:
   - Test at :180: `const [townCenterEnd, barracksEnd] = await lineEndYs(page, UNITS, ['capital-town-center', 'barracks'])`.
   - Hide test: compute `gap` from one `lineEndYs(page, UNITS, [first, second])` call. Keep the `expect.poll(gap)` after the click.
   - Pinned test: read all four keys in one call inside `expect(async () => { ... }).toPass()`, keeping the same three assertions.

   No assertion changes, so each test still fails on what it fails on today. The pinned test fails if
   `chart-rows.ts:67` looks up `offsets[key]` instead of `offsets[seriesKeyOf(key)]`: pinned lines then
   draw at raw 1 while `barracks` is lifted by its slot offset (0.225 of a building with two slots), so
   `pinned:barracks` end y stops matching `barracks`. The hide test fails if `offsetSlotKeys` stops
   filtering `hidden` (`chart-rows.ts:55`): the first-second gap stays at 0.15 of a building instead of
   growing to 0.225.

## Rework 2 soundness (asked by the caller)

- **The implementer's claim holds. I verified it.** `toChartRows` with a pinned run (`chart-rows.ts:31-43`)
  creates every union-time row as `{ t }`. `fill` then writes current keys only at the current run's own
  times. So in a pinned-only row the current key is absent, not `undefined`. `lift` loops
  `Object.entries(row)` (`:65`), so it never sees an absent key and cannot make it `NaN`. With real data,
  a current key can only be present with an `undefined` value if a series has fewer values than `times`.
  `simulate.ts:986-997` pushes one `buildingSamples` entry per sampled time, and
  `production-buildings.ts:24` maps one count per sample, so Buildings series always match `times` in
  length. The "<building>: NaN" tooltip in the tech-lead report was not reachable with real Buildings data
  at 57d342a.
- **Run evidence:** I put 57d342a's `chart-rows.ts` into the scratch (the only difference from the tip is
  line 68) and ran `vitest run chart-rows.test.ts`: 1 failed, 45 passed.
  - The "current series have fewer values than times" row failed with `AssertionError: expected NaN to be undefined`.
  - The "current run ends before a longer pinned run" row passed.
  - At the tip all 46 pass.
- **The criterion as written is sound and passes.** It says "a row where the current run has no value
  (pinned run longer) keeps the current key `undefined` after the offset is applied, never `NaN`", and
  that holds at the tip. The Required fix's statement that this test "fails on tip 57d342a with NaN" is
  false. No setup of the named trigger can fail at 57d342a.
- **The tests:**
  - Row 2 is the real fail-first test of the guard.
  - Row 1 is not vacuous: it fails if `lift` is rewritten to loop over series or offset keys (`lifted[k] = row[k] + offset`), or if `toChartRows` starts writing current keys into pinned-only rows and the guard is dropped.
  - Row 1 does not exercise the guard itself. Keeping both rows in one `it.each` is the right shape.
- **Why not NEEDS_SPEC:** the criterion's checkbox text is met, and nothing is left for the spec to
  decide.
- **Recommendations for the manager** (not blocking):
  - Correct the ticket's Rework 2 finding text so a later reader does not take NaN as reachable.
  - Tell the owner on board Q99 that the guard is defensive and the reported tooltip could not occur with real data.

## Spec gaps

None blocking. See the Rework 2 soundness note above.

## Acceptance criteria (delta mode: rework 2 re-checked; the rest carried from review 2 at 5d97056, and nothing in the delta changes them)

- (rework 2) Missing current value stays `undefined`, never `NaN`; unit test in `chart-rows.test.ts`: **pass**.
  The guard is at `chart-rows.ts:68` and the test is at `chart-rows.test.ts:243-252`. Row 2 fails without
  the guard (I ran it); row 1 covers the named trigger, which already held (see above).
- Hiding a building removes its slot: pass (unit test `chart-rows.test.ts:228-232`). It is also covered
  through the page by the new acceptance test at :198, which has the read-pattern defect above.
- Pinned and current line share an offset; a pinned-only key gets a distinct one: pass (unit
  `:234-241`). It is also covered through the page by the new acceptance test at :216, which has the
  read-pattern defect above.
- All other criteria: pass as recorded in SGS-157-review-2.md. The delta touches only a comment, an
  export, and the `lift` guard in `chart-rows.ts`, and adds tests.
- Invariants A1, A2, A3: touched (path), and still hold. The delta changes only chart row building and tests; no simulation or data change.

## Test bar across the branch

`git diff 5d97056..HEAD` on test paths only adds tests; no test was deleted or weakened. The new tests can
fail for real reasons (mutations named above). The new unit rows are an `it.each` table, which is fine.

## Other checks

- Comment change `chart-rows.ts:48`: "Slot i of n gets i * MAX_LINE_OFFSET / n, so offsets are distinct,
  never negative and always below half a count." This is true of `:50` (0.45 < 0.5, i < n).
- `offsetSlotKeys` unexported: its only caller is `toOffsetChartRows`, and no test imports it (grep).
- Lint: `npx tsc --noEmit` exit 0; `npm run lint:dup` found 0 clones.
- Unit: `vitest run components/apps/aoe4-build-order/` 31 files, 808 tests passed.

## Bot reconciliation

REPO.md has `reviewBot.cli: ""`, so the bot did not run. There are no bot findings.

## Non-blocking notes

- `typeof value !== 'number'` at `chart-rows.ts:68` is dead to the type checker (`ChartRow` is
  `Record<string, number>`). It is the runtime guard the ticket asked for and reads fine.

## Coverage

- Reviewed: the full delta (`acceptance/aoe4-chart-views.spec.ts`, `chart-rows.ts`, `chart-rows.test.ts`).
  For context I also read `line-chart.tsx` (formatter, row building), `simulate.ts:975-1023`, and
  `production-buildings.ts`.
- UI inspection: not run. The delta changes no rendered UI (row values change only for malformed input).
- REPO.md "Every diff" checklist: the implementer report records `next build` succeeding at 134c9a9. I did
  not load the page; this is delta mode and no UI changed.
- No acceptance or browser tests run (role rule).
