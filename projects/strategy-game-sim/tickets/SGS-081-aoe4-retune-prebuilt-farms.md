# SGS-081: Re-time the farm steps of the prebuilt AoE4 builds for one villager per farm

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-03; backlog "One farm per farmer (AoE4 sim)"; split from SGS-080)
- **Priority**: medium
- **Risk**: standard
  <!-- Data and test pins only: no engine, route or schema change, so no strongModelTriggers item and no criticalPaths
       symbol applies. Standard rather than low because it edits three shipped data files that every build-quality
       test and the page read, and the numbers must be found by iterating against the new engine. About 40 to 80
       changed JSON lines, 0 lines of business logic. -->
- **Invariants**: A2 (farm steps are paid like any build; a step never starts unaffordable, so adding or moving farm
  steps must not make a step wait); A3 (builds stay deterministic; the `man-at-arms` time trigger is hard-coded and
  must be re-checked); A1 not touched (no game number moves into code)
- **LOC estimate**: 0 business logic. `data/aoe4-build-order/builds/english-1tc.json` (12 farm references today),
  `english-knight-longbow.json` (46), `english-spear-longbow-maa-crossbow.json` (22): farm steps added, moved or
  re-timed; README Prebuilt-builds prose; test pins and one new test case
- **Depends on**: SGS-080 (lands stacked on it; SGS-080 and SGS-081 ship as one stack, never 080 alone). SGS-079 is
  integrated on main, so its README wording is the starting text, not a dependency. (respec 2)
- **On merge**: none
- **Source**: BACKLOG.md "One farm per farmer (AoE4 sim)" (owner, 2026-11-02, written as "all four builds"; main has
  three); `reports/SGS-080-ticket-1.md` (Split); owner request in chat 2026-11-03

## Context

SGS-080 limits farm gathering to one villager per built farm. Villagers sent to `farm` with no free farm now wait idle
and the run returns a `farm-idle` warning (text: `<n> villager(s) arrived at farm from <m:ss> on with no free farm and wait idle until one is built.`; the rule has no off switch), so the shipped builds, which place farm steps without that limit in mind,
lose food income and carry the warning. Each build's farm steps must be timed so that every villager sent to `farm` finds a built farm, and the
README quality bars still hold.

## Scope

Base: main (at `1bdf1d6` or later, with SGS-079 integrated) plus SGS-080 as specced. (respec 2) SGS-080's branch may
leave shipped-build assertions failing (it does not re-tune the builds and lists each such failing test in its
implementation report); this ticket takes over every test on that list and makes it pass. (respec 2) Paths are relative to the repo root. Behavior of the engine below is
SGS-080's end state: an arrival at `farm` beyond the built farms idles at the farm and takes a farm when one completes;
`sendWalking` takes idle farm villagers first; `farm-idle` is emitted at most once per run with `at` the first instant a
villager lacked a farm; `build farm ... then farm` builders take the new farm the instant it completes. An extra farmer
waits idle and auto-takes the next farm built (a sim simplification), so builds only ever write `build farm` steps, never a
`move` to promote a waiting farmer. (respec 1)

**1. Re-time the farm steps in the three builds** (`data/aoe4-build-order/builds/`). Step numbers in this ticket
are 0-based indexes into the build file's `steps[]` array (as in `steps[14]` or `i < 21`), not the 1-based step
numbers the README and the page show. (respec 2)

- `english-1tc.json`: steps 9 to 11 (three `build farm` after the mill), 16 and 17 (315 s), 21 (after the blacksmith).
  Where villagers go to `farm` and how many: `then farm` builders and any `rally ... to farm` or `move ... to farm`.
- `english-spear-longbow-maa-crossbow.json`: steps 5 to 7 (after the mill), 10 to 12 (210 s); farm villagers come from
  `then farm` builders, the 200 s and 380 s Town Center rallies to `farm`, the King's Palace `rally ... to farm`, the 760 s
  rally to `farm`, and the `gold#3` reaction moving all gatherers to `farm`.
- `english-knight-longbow.json`: steps 9 to 11, 14 and 15, and the four-farm blocks at 600, 840, 960 and 1080 s
  (steps 34 to 37, 45 to 56); farm villagers come from `then farm` builders, `rally capital-town-center to farm`
  (step 28), and the `whenever sheep runs out move all sheep to farm` reaction (the last step).

For each build, the rule to meet: every villager that is sent to `farm` (a rally, a `then farm` builder, a `move`, a
reaction) arrives at a built farm. Do it by adding `build farm` steps, or moving or re-timing existing ones, so a farm
completes no later than the villager that takes it arrives; and, as a tuning guideline only (no test pins it and it is not a failing bar), do not leave a farm built with no
villager planned for it long before one is. (respec 1) A step is added only as a `build farm` (or its position or `time` trigger changed); no step's action,
unit or tech is changed, no game number goes into the file, and every number stays a non-negative integer so the
build re-parses from its paste text. The exact farm counts and times are found by running the builds against the
SGS-080 engine and are written into the files by the implementer; this ticket fixes no constant.
Steps another test locates by index (see Scope 3) shift when a step is inserted; keep those steps in
their relative order.

**2. Quality bars (existing and new).** After the re-tune, at default inputs with depletion on, each build keeps every
bar the README states (at 1200 s and 3600 s no step is `waiting`, every non-reaction step has started, a `not-reached`
step has `waitingOn: 'trigger'`; every gold deposit that ran out has a `move all` reaction starting at its `depletedAt`;
no gold warning has severity `warning`; the knight/longbow build leaves no villager idle through 1800 s). Add one bar, the only farm bar (only idle farmers fail the shipped-build quality bars; an unused built farm does not) (respec 1): no
`farm-idle` warning at 1200 s, 1800 s and 3600 s. In `lib/aoe4-build-order/builds.test.ts`, in the existing
`describe.each(listBuilds()...)` block (so it applies to every shipped build), add `it.each([1200, 1800, 3600])` asserting
`result.warnings.filter((w) => w.code === 'farm-idle')` is empty, using the file's `simulateTo` helper. Update
`docs/aoe4-build-order.md` at "Prebuilt builds live in `data/aoe4-build-order/builds/`" (the bar paragraph) to add that
no `farm-idle` warning appears at those horizons.

**3. Re-pin and fold in what 080 reports.** (respec 2) The rule, not a closed list: any test that pins a shipped
build's output (a digest, a time, a count, a population or resource value, a warning) or locates a shipped build's step
by index, and that fails after the re-tune, is re-derived from the stack's output (or its index updated to the same
step), never loosened, skipped or deleted. A pin that does not move is left alone. The implementer lists every test it
edits in the report, with old and new values. Find the candidates with
`git grep -lE "english-(1tc|knight|spear)|listBuilds|english1tc|knightLongbow|spearLongbow" -- lib acceptance` (30 files
on main today, `builds.ts` included, which is not a test and does not change). Known pins, as seeds only:

- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: the three 1800 s digests and the knight/longbow `held` object
  (`step`, `at`, `seconds`).
- `acceptance/aoe4-simulate-api-house-lead-time.spec.ts`: the two `shipped` rows and the `withoutPalaceHouses` filter
  (`i < 21 || i > 23` removes the three pre-palace houses by index) plus the values that follow from it.
- `acceptance/aoe4-simulate-api-timelines.spec.ts`: `english1tc` `steps[4]`, `steps[14]` and `steps[22]` timings, the
  Feudal `reachedAt` and the final counts (`steps[14]` and `steps[22]` shift if a farm step is inserted before them).
- `lib/aoe4-build-order/research.acceptance.test.ts`, `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`
  (`FIRST_GOLD_DEPLETED_SECONDS`), `acceptance/aoe4-simulate-api-knight-longbow-build.spec.ts` (the reaction steps stay
  the final six), `lib/aoe4-build-order/simulate-construction.test.ts`, `lib/aoe4-build-order/simulate-triggers.test.ts`,
  `lib/aoe4-build-order/simulate.test.ts` (`listBuilds()[0]`), and the other `acceptance/aoe4-*.spec.ts` files the grep
  finds.

A pin that fails gets the new value only when the build's own bars still hold.

- Take over every shipped-build quality assertion that SGS-080's implementation report lists as failing for lack of
  re-tuning (its report names the test and the reason): each is fixed by re-tuning the build, never by loosening or
  skipping the assertion. If a failing assertion is a bar this ticket cannot meet by farm steps alone, report
  `needs_spec` with the assertion and the reason. (respec 2)
- A guide step that the re-tune forces out of a build (it would break a bar) is left out and listed under that build's
  Omitted entry in the README with its reason, per the README rule. None is expected.

**4. README** (`data/aoe4-build-order/README.md`, section "Prebuilt builds", from `## Prebuilt builds` to `## Hand-entered
values`). Rewrite the prose to match the re-tuned files, stating choices and rules only, no measured values (the rule
SGS-079 sets: a value written in the build file, such as a `time` trigger, a step's `@m:ss`, a farm count or block time, is an
input and may stay; a value read from a simulation result, such as a `depletedAt`, `startedAt`, completion or warning
time, is not written). Start from main's text, which already follows that rule (SGS-079 is integrated: the opening
paragraph ends "measured results (run-out times, when a step fires, warnings' times) are not listed"). (respec 2) Changes:

- Add to the opening paragraph the farm rule: a farm holds one villager (enforced by the engine), so each build times
  its `build farm` steps so that every villager sent to `farm` finds a built farm, and the bar includes no `farm-idle`
  warning.
- Per entry, rewrite the sentences that name farms to the new files: `english-1tc` ("the mill and the three farms",
  line about the 4:00 builders) and any farm steps added; `english-spear-longbow-maa-crossbow` (the King's Palace
  rally to farms, the `gold#3` reaction to farms, the farms added at the mill and at 210 s); `english-knight-longbow`
  ("Farms are added in blocks of four at 10:00, 14:00, 16:00 and 18:00" becomes the new block times, as inputs, with
  the reason for each timing, such as the sheep run-out reaction sending villagers to farm needing farms built before it fires, but no measured
  instant).
- The knight/longbow entry's "the third of these (step 24)" is a 1-based display number (0-based index 23); update it
  if a step is inserted before that house. (respec 2)
- Keep each entry's structure (name, source, Omitted list, transcription choices) and change no other section.

**5. Docs elsewhere.** Grep `docs/aoe4-build-order.md` and `data/aoe4-build-order/README.md` for `farm` and the
build-quality bar and fix any statement the re-tune makes untrue (Scope 2 names the one known place).

**Out of scope:** any engine, route, OpenAPI or UI change (SGS-080); a new prebuilt build; a farm-count model beyond one
villager per built farm; optimizing a build's economy beyond meeting the bars (no search for the best farm times); changing
any non-farm step, unit count, tech, rally or trigger except the `man-at-arms` time trigger (below); loosening or skipping
a build-quality assertion.

The `man-at-arms` `time` trigger of 681 s in `english-spear-longbow-maa-crossbow.json` is an input that must not start
before Castle (the README says re-check it when an earlier step changes). Re-check it after the re-tune; change the value
only if the existing "reaches Castle ..." case in `builds.test.ts` fails.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] For each of the three builds at default inputs, `simulateBuildOrder` at 1200 s, 1800 s and 3600 s returns no
  warning with code `farm-idle`: the new `it.each([1200, 1800, 3600])` case in `builds.test.ts`'s per-build block. Catches: a
  farm step that completes after the first villager sent to `farm` arrives (checked by re-timing the first farm step of any build 60 s later and
  seeing the case fail).
- [ ] Every existing per-build case in `builds.test.ts` passes unchanged in meaning (no `waiting` step and every non-reaction
  step started by 1200 s and 3600 s; gold reactions start at the run-out instant; knight/longbow has no `idle-arrival` or
  `step-stuck` warning through 1800 s and its sheep reaction starts at the sheep run-out); none is loosened, skipped or
  deleted.
- [ ] Villagers moved to `farm` by a reaction or rally find farms: the knight/longbow `sheep` reaction and the spear/longbow
  `gold#3` reaction each start with `gatherers.farm` plus the moved villagers not above the farms built at that instant
  (observable as no `farm-idle` warning at 3600 s, which the first criterion covers).
- [ ] Each build still re-parses from its paste text unchanged (existing round-trip case) and validates (existing `validates` case).
- [ ] (respec 2) Every test that pins a shipped build's output or step index and fails after the re-tune (Scope 3 rule,
  not only the seeds) is re-derived from the stacked engine output or has its index moved to the same step; none is
  loosened, skipped or deleted. The report lists each test file edited and each pin, with old and new values.
- [ ] Every shipped-build assertion that SGS-080's implementation report lists as failing passes on this branch, unchanged
  in what it checks; the report names each one. (respec 2)
- [ ] In the Prebuilt-builds section of the README (`awk '/^## Prebuilt builds/,/^## Hand-entered/' data/aoe4-build-order/README.md`),
  `grep -cE '[0-9]+\.[0-9]+ s'` prints 0 (it prints 0 on main today, with SGS-079 integrated) (respec 2), and no sentence quotes a simulated
  instant (run-out, start, completion or warning time). Every input the entries state today (the 681 s trigger unless Scope
  changed it, the 4:00 and 5:00 and 6:00 builder points, the deposit and reaction counts, the guide step times in the ENG 1TC
  Omitted list) is still there.
- [ ] The README opening paragraph states the farm rule and the `farm-idle` bar; the knight/longbow entry's farm block times
  match the steps in `english-knight-longbow.json` that carry a `time` trigger and `build farm` (a reviewer compares the two).
- [ ] `docs/aoe4-build-order.md` bar paragraph says no `farm-idle` warning appears at those horizons.
- [ ] (respec 2) `git diff --stat` for the ticket (against SGS-080's tip) touches only: the three build JSONs, the README,
  `docs/aoe4-build-order.md`, `lib/aoe4-build-order/builds.test.ts`, and test files (`*.test.ts` under `lib/aoe4-build-order/`,
  `acceptance/aoe4-*.spec.ts`) that pin a shipped build and are listed in the report. No non-test file under
  `lib/aoe4-build-order/` changes.
- [ ] (respec 2) `npm test` (every AoE4 unit test), `npx tsc --noEmit` and `npm run lint:dup` pass, and `npm run acceptance`
  passes for every `acceptance/aoe4-*.spec.ts`, not only the seeds in Scope 3.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-03

- Underspecified: whether an unused built farm fails the bars, and whether extra farmers wait or stay idle.
- Changed: owner answers folded in. Only idle farmers fail (`farm-idle` absent at 1200, 1800, 3600 s); an unused farm is a
  tuning guideline. Extra farmers wait idle and auto-take the next built farm, so builds write only `build farm` steps; the
  warning text and the absence of an off switch are recorded in Context. Both open questions removed.
- Stands: all other scope and criteria unchanged.

## Re-spec 2026-11-03 (2)

- Underspecified: the pin list was closed and the diff-stat and acceptance criteria were limited to it, though about 20
  more tests load a shipped build; step numbers had no stated base.
- Changed: Scope 3 is now a rule (any failing shipped-build pin is re-derived, never loosened, and listed) with a grep
  seed; diff-stat allows any pinning test file; full AoE4 unit and acceptance sets must pass; indexes are 0-based
  `steps[]`; SGS-079 is integrated, so the conditional is gone and the README grep baseline is 0; 080 and 081 ship as one
  stack and 081 takes over the failing tests 080's report lists.
- Stands: no branch work exists yet; Scope 1, 2, 5 and the other criteria are unchanged.
