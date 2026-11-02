# SGS-069 review 1

Branch sgs-069-aoe4-timeline-blocked-by-compare, tip 201238a47e9dea501853530c1d4a7b1434c08d38 (local only; not on origin
at review time), base origin/main 54d7e90. Reviewed in a detached worktree at that tip. Node 24.22.2.

**Verdict: REQUEST CHANGES** (one blocking test finding; production code is correct against the contract)

## Blocking findings

- acceptance/aoe4-build-order-pin-compare.spec.ts:100-142 - test - The test is named "...omits rows blank on both sides
  and shows delta = current - pinned", but its only row-set assertions are `keys.length >= 4` and "keys are in ROW_KEYS
  order". Neither checks that a row is omitted. Mutation: I removed the `.filter(...)` from `compareRows`
  (compare.ts:62). This test still passed. The other two compare tests ("pinning the shown result" and "compare-empty")
  failed, so the behaviour is covered elsewhere, but this test's name claims a check it does not make. The review bar
  treats that as blocking. Direction: compute the expected key list from `pinnedRun` and `current`, which are already in
  scope. A military key stays when `militaryAt` is non-null on either side, an age key when either run's `ages` has it,
  and `pop-cap` when either `populationCapReachedAt` is non-null. Then assert `keys` equals that list. The other option
  is to drop "omits rows blank on both sides" from the name.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | blockedBy for completed with `{prerequisite:4,resources:2,villagers:3}` and `{}` | pass | step-timeline-rows.ts:31-37; unit table rows 1-2 |
| 2 | waiting ends `still waiting on <waitingOn>`, phrase alone on empty breakdown; not-reached text | pass | step-timeline-rows.ts:32-36; unit rows 4-7; acceptance "a waiting step shows an en dash..." |
| 3 | 60 s gives longWait, data-long-wait, table-warning; 59.9 does not | pass | step-timeline-rows.ts:58 (`>=`); step-timeline.tsx:37-39; unit boundary 59.9/60/61; acceptance long-wait test (65 s) |
| 4 | in-progress Finished `ongoing`; waiting/not-reached en dash | pass | step-timeline.tsx:6; completedAt is null for those statuses so `formatStepTime` gives the en dash; acceptance tests for ongoing and waiting |
| 5 | header cells exactly five, `step-timeline-scroll` wraps; grep "Waited on/Stuck on" empty | pass | acceptance header assertion; grep returns nothing |
| 6 | `LONG_WAIT_SECONDS = 60` exactly one line in components | pass | step-timeline-rows.ts:9 only |
| 7 | keyNumbers on 700 s: 900/1200 run-ended, age not-reached, pop-cap 0 is `{value:0}` | pass | compare.ts:27-41; compare.test.ts keyNumbers tests |
| 8 | compareRows omits both-null rows, keeps order; delta only with both values | pass (code), see blocking finding for one test | compare.ts:45-62; unit omission tests; acceptance compare-empty and pin-same tests fail when the filter is removed |
| 9 | direction better/worse/same/null | pass | compare.ts:47-55; unit direction table + null case |
| 10 | 1200 s pinned vs 300 s current: `run ends at 5:00`, `not reached` for a one-sided age, dash delta | pass | compare-panel.tsx:17-20 uses the run's own durationSeconds; acceptance 1200/300 test checks `run ends at 5:00` and dash; `not reached` plus dash is checked in the compare-table test (the default build has no age rows at 300 s) |
| 11 | delta text and colour classes | pass | compare-panel.tsx:22-30, 66; U+2212 confirmed; acceptance asserts text-success/text-danger |
| 12 | pin shown result gives `same`; all-blank gives `compare-empty`, no rows | pass | acceptance tests at :202 and :232 |
| 13 | `compare-scroll` wraps; props unchanged; grep pinnedName/alreadyPinned empty; page compiles | pass | compare-panel.tsx:5-10, 50; grep empty; page untouched; `npx tsc --noEmit` clean |
| 14 | `npm test` and `npm run acceptance` pass; edited tests listed | pass (tests); PR listing is for the PR step | 40 files, 1094 passed / 8 skipped; acceptance 556 passed; implementer report lists the edited tests |
| 15 | docs describe new behaviour; no stale sentence | pass | docs/aoe4-build-order.md:806-838; grep for "Waited on", "Stuck on", "a dash when" and "seven rows" returns nothing stale (the "up to seven rows" sentence is accurate) |
| 16 | No INVARIANTS regressions | pass | see below |

I did not tick the criteria in the ticket because the verdict is not APPROVE.

## Invariants touched

The diff touches `components/apps/aoe4-build-order/**`, so A1-A3 and S1 apply.
- A1 holds. `LONG_WAIT_SECONDS` is a display threshold from the design (C10), not a game cost, time or rate, and it is
  not in simulation code.
- A2 holds. There is no engine change, and waiting time still reaches the timings (`waitBreakdown` is unchanged).
- A3 holds. There is no randomness or clock use.
- S1 holds. The diff imports only the same app's lib and components.
- S3 does not apply. There is no new input or loop.

## Caller's verification questions

1. **Removed `t > durationSeconds` guard in `militaryAt`: the claim holds.** `sampleTimes` (lib/aoe4-build-order/simulate.ts:726-734)
   pushes `t` only while `t <= durationSeconds` and then appends `durationSeconds` itself, so `times` never holds a value
   past the duration. The sampling loop (simulate.ts:882-889) pushes one `spent.military` entry per time, so the arrays
   line up. 600, 900 and 1200 are multiples of `SAMPLE_SECONDS = 5`, which means `indexOf(T) >= 0` exactly when
   `T <= durationSeconds`. The `spent === undefined` path in compare.ts:28-31 is therefore the same as the ticket's rule.
   Note that origin/main's `militaryAt` never had such a guard; the implementer added one during work and then took it out.
2. **`waiting` steps never reach `longWait`: true, and it matches C10.** `waitSeconds` is assigned only when a step
   starts (simulate.ts:453), so a step still `waiting` at the end reports 0, and its time is in `waitBreakdown`. The
   ticket and design say literally `longWait = waitSeconds >= LONG_WAIT_SECONDS`, and the code does exactly that. No
   highlight is lost on screen: a `waiting` row is `flagged`, so it already gets `table-warning` (step-timeline.tsx:39).
   The only difference is that a waiting row has no `data-long-wait` attribute. The new docs sentence ("A row whose
   `waitSeconds` is 60 or more is highlighted as a long wait") matches the code. I do not count this as a contradiction.
   If the owner wants `data-long-wait` on long-stuck waiting rows as well, for example from the breakdown total or from
   `durationSeconds - armedAt`, that is a design change to C10 and a follow-up, not a defect here.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## Lint

`npx tsc --noEmit` is clean, and `npm run lint:dup` found 0 clones.

## Non-blocking notes

- step-timeline-rows.test.ts:73: `expect(LONG_WAIT_SECONDS).toBe(60)` only restates the literal. The boundary rows on
  the next two lines already pin the behaviour, so this line can go.
- acceptance/aoe4-build-order-m3-flow.spec.ts:58-60: the assertion went from "exactly the seven keys" to "a non-empty,
  in-order subset". It cannot catch a wrongly omitted row. The same expected-key computation as in the blocking fix
  would make it exact.
- compare-panel.tsx:50 and step-timeline.tsx:17 use an inline `style={{ overflowX: 'auto' }}`. Bootstrap 5.3.8 (the
  installed version) has the `overflow-x-auto` utility, and the repo's styling convention is utility classes plus CSS
  modules. The siblings do use inline style for one-off sizes (step-table.tsx:105, line-chart.tsx:133), and the
  narrow-layout ticket will move layout rules anyway, so this is optional.
- compare-panel.tsx:22-30: `formatMinSec` rounds, so a time delta under 0.5 s (for example ages at 300.5 and 300.2)
  shows `0:00 earlier` in green with `data-direction="better"`. The design defines direction on the raw delta, so this is
  per spec, but the display is odd. Military spend is integer data in practice, so `+0 resources` cannot happen.

## Repo review checklist

- Every diff: `npx next build` succeeded. The touched page was loaded and driven through the Playwright suite, which
  starts its own `next dev`: 556 passed, including the new timeline and compare flows. There are no chart changes, so
  the 1280 px overlap check does not apply, although the existing 1280 px tests passed.
- AoE4 build order: no helper or constant is copied from another `lib/aoe4-build-order/` module. `formatMinSec` and
  `formatStepTime` are imported, and the jscpd check is clean. The doc rewrite matches the code.

## Coverage

I reviewed every file in the diff: compare.ts, compare-panel.tsx, step-timeline-rows.ts, step-timeline.tsx,
docs/aoe4-build-order.md, compare.test.ts, step-timeline-rows.test.ts, and the three acceptance specs. I also read
simulate.ts (sampling, waitSeconds, waitingOn finalisation), format-time.ts and the page call site (pages/apps/aoe4-build-order.tsx:121).
I ran tsc, lint:dup, npm test, next build, the full acceptance suite, and one mutation run (described above, then reverted).
I could not review anything about the PR or the Vercel preview, because the branch was not pushed at review time.
