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
- **Depends on**: SGS-080 (lands stacked on it; merge the two as one stack, never 080 alone)
- **On merge**: none
- **Source**: BACKLOG.md "One farm per farmer (AoE4 sim)" (owner, 2026-11-02, written as "all four builds"; main has
  three); `reports/SGS-080-ticket-1.md` (Split); owner request in chat 2026-11-03

## Context

SGS-080 limits farm gathering to one villager per built farm. Villagers sent to `farm` with no free farm now wait idle
and the run returns a `farm-idle` warning, so the shipped builds, which place farm steps without that limit in mind,
lose food income and carry the warning. Each build's farm steps must be timed so that every villager sent to `farm` finds a built farm, and the
README quality bars still hold.

## Scope

Base: main `ee7ecb9` plus SGS-080 as specced. Paths are relative to the repo root. Behavior of the engine below is
SGS-080's end state: an arrival at `farm` beyond the built farms idles at the farm and takes a farm when one completes;
`sendWalking` takes idle farm villagers first; `farm-idle` is emitted at most once per run with `at` the first instant a
villager lacked a farm; `build farm ... then farm` builders take the new farm the instant it completes.

**1. Re-time the farm steps in the three builds** (`data/aoe4-build-order/builds/`):

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
completes no later than the villager that takes it arrives; and do not leave a farm built with no villager planned for
it long before one is. A step is added only as a `build farm` (or its position or `time` trigger changed); no step's action,
unit or tech is changed, no game number goes into the file, and every number stays a non-negative integer so the
build re-parses from its paste text. The exact farm counts and times are found by running the builds against the
SGS-080 engine and are written into the files by the implementer; this ticket fixes no constant.
Steps another test locates by index (see Scope 3) shift when a step is inserted; keep those steps in
their relative order.

**2. Quality bars (existing and new).** After the re-tune, at default inputs with depletion on, each build keeps every
bar the README states (at 1200 s and 3600 s no step is `waiting`, every non-reaction step has started, a `not-reached`
step has `waitingOn: 'trigger'`; every gold deposit that ran out has a `move all` reaction starting at its `depletedAt`;
no gold warning has severity `warning`; the knight/longbow build leaves no villager idle through 1800 s). Add one bar: no
`farm-idle` warning at 1200 s, 1800 s and 3600 s. In `lib/aoe4-build-order/builds.test.ts`, in the existing
`describe.each(listBuilds()...)` block (so it applies to every shipped build), add `it.each([1200, 1800, 3600])` asserting
`result.warnings.filter((w) => w.code === 'farm-idle')` is empty, using the file's `simulateTo` helper. Update
`docs/aoe4-build-order.md` at "Prebuilt builds live in `data/aoe4-build-order/builds/`" (the bar paragraph) to add that
no `farm-idle` warning appears at those horizons.

**3. Re-pin and fold in what 080 reports.** Everything below changes only because the builds changed; each pin is
re-derived from the stack's output, never loosened:

- Digests: `lib/aoe4-build-order/simulate-house-warnings.test.ts`, the three 1800 s digests and the knight/longbow
  `held` object (`step`, `at`, `seconds`; the `step` index changes if a step is inserted before it);
  `acceptance/aoe4-simulate-api-house-lead-time.spec.ts`, the two `shipped` rows (`cap`, `population`, `spent`,
  `steps`, `warnings`), and its `withoutPalaceHouses` filter (`i < 21 || i > 23` removes the three pre-palace houses by index) plus the
  population values and the 680 to 765 s series that follow from it; `lib/aoe4-build-order/simulate-construction.test.ts`
  the knight/longbow test (`population(660)` 40; it finds the houses by content, so it needs a number change only if the
  run changes).
- Other pins on shipped-build output that may move: `lib/aoe4-build-order/research.acceptance.test.ts` (veteran-longbowmen
  `completedAt` window and the tier counts at 845, 850 and 1800 s), `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`
  (`FIRST_GOLD_DEPLETED_SECONDS` and the gold depletion instants), `acceptance/aoe4-simulate-api-knight-longbow-build.spec.ts`
  (gold depletion expectations and the last-six-steps reaction positions: reaction steps stay the final six), and
  `lib/aoe4-build-order/builds.test.ts` (the 1TC "runs its first gold deposit dry" case,
  `second?.depletedAt` null). A pin that is unchanged by the re-tune is left alone; one that fails gets the new
  value only when the build's own bars still hold.
- Fold in every shipped-build quality assertion that SGS-080's implementation report lists as failing for lack of re-tuning
  (its report names the test and the reason): each is fixed by re-tuning the build, never by loosening or skipping the
  assertion. If a failing assertion is a bar this ticket cannot meet by farm steps alone, report `needs_spec` with the
  assertion and the reason.
- A guide step that the re-tune forces out of a build (it would break a bar) is left out and listed under that build's
  Omitted entry in the README with its reason, per the README rule. None is expected.

**4. README** (`data/aoe4-build-order/README.md`, section "Prebuilt builds", from `## Prebuilt builds` to `## Hand-entered
values`). Rewrite the prose to match the re-tuned files, stating choices and rules only, no measured values (the rule
SGS-079 sets: a value written in the build file, such as a `time` trigger, a step's `@m:ss`, a farm count or block time, is an
input and may stay; a value read from a simulation result, such as a `depletedAt`, `startedAt`, completion or warning
time, is not written). Read SGS-079 (branch `sgs-079-aoe4-prebuilt-docs-no-measured-results`) first. If it is merged, edit its text; if not, edit the
main text and remove the measured values as SGS-079 specifies, so that the result is the same either way. Changes:

- Add to the opening paragraph the farm rule: a farm holds one villager (enforced by the engine), so each build times
  its `build farm` steps so that every villager sent to `farm` finds a built farm, and the bar includes no `farm-idle`
  warning.
- Per entry, rewrite the sentences that name farms to the new files: `english-1tc` ("the mill and the three farms",
  line about the 4:00 builders) and any farm steps added; `english-spear-longbow-maa-crossbow` (the King's Palace
  rally to farms, the `gold#3` reaction to farms, the farms added at the mill and at 210 s); `english-knight-longbow`
  ("Farms are added in blocks of four at 10:00, 14:00, 16:00 and 18:00" becomes the new block times, as inputs, with
  the reason for each timing, such as the sheep run-out reaction sending villagers to farm needing farms built before it fires, but no measured
  instant).
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
- [ ] Digests and pinned values listed in Scope 3 are re-derived from the stacked engine output. The implementer lists each
  pin edited, with old and new values, and each pin left unchanged because it did not move.
- [ ] Every shipped-build assertion that SGS-080's implementation report lists as failing passes, unchanged in what it checks.
- [ ] In the Prebuilt-builds section of the README (`awk '/^## Prebuilt builds/,/^## Hand-entered/' data/aoe4-build-order/README.md`),
  `grep -cE '[0-9]+\.[0-9]+ s'` prints 0 (it prints 6 on main and 0 on the SGS-079 branch), and no sentence quotes a simulated
  instant (run-out, start, completion or warning time). Every input the entries state today (the 681 s trigger unless Scope
  changed it, the 4:00 and 5:00 and 6:00 builder points, the deposit and reaction counts, the guide step times in the ENG 1TC
  Omitted list) is still there.
- [ ] The README opening paragraph states the farm rule and the `farm-idle` bar; the knight/longbow entry's farm block times
  match the steps in `english-knight-longbow.json` that carry a `time` trigger and `build farm` (a reviewer compares the two).
- [ ] `docs/aoe4-build-order.md` bar paragraph says no `farm-idle` warning appears at those horizons.
- [ ] `git diff --stat` for the ticket (against SGS-080's tip) touches only: the three build JSONs, the README, `docs/aoe4-build-order.md`,
  `lib/aoe4-build-order/builds.test.ts`, and the test files whose pins Scope 3 lists. No file under `lib/aoe4-build-order/` other than
  tests changes.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` pass, and `npm run acceptance` passes for the AoE4 specs named in Scope 3.
- [ ] No INVARIANTS.md regressions

## Open questions

- `owner`: Should a built farm with no villager planned for it be a failure of the bars too (a build that builds all
  its farms at once would pass the `farm-idle` bar), or is only idle villagers a bar? This ticket treats it as a tuning rule (do
  not leave a farm unused long before its villager) that no test pins, and adds only the `farm-idle` bar.
- `owner`: SGS-080 leaves open whether excess farmers wait idle at the farm or stay idle until moved. This ticket assumes
  they wait and take a farm when built (SGS-080's default). If the owner picks the other, the farm timing rule here is
  unchanged but any build that relies on the promotion must add `move` steps; re-spec then.
