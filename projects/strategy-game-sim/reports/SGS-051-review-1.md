# SGS-051 review 1

Branch `sgs-051-aoe4-build-knight-longbow`, tip e25e534, base 835aceb (origin/main; local `main` is stale, so the diff was taken against 835aceb).
Diff: `data/aoe4-build-order/builds/english-knight-longbow.json` (new), `lib/aoe4-build-order/builds.ts`, `lib/aoe4-build-order/builds.test.ts`, `data/aoe4-build-order/README.md`.

**Verdict: REQUEST CHANGES**

## Blocking findings

1. `data/aoe4-build-order/builds/english-knight-longbow.json:172-175` (steps[21] `produce longbowman from archery-range`), with the second range at `:196` (steps[25]): **correctness**.
   - What: `produce` binds only the producer instances that exist when the step starts (`simulate.ts` `produce` -> `targetInstances`). The step starts at 492.7 s, when only the 5:00 range exists. The second range finishes at 705.3 s and never gets an order, and no later step produces from it. It is a 150-wood building that stays idle all game.
   - Measured: inserting one more `produce longbowman from archery-range` after the second range (before `move 12 farm to gold`) gives 25 longbowmen at 1200 s instead of 17. Castle then lands at 964 s and knights drop to 15, so the build needs retuning.
   - Why it matters: this is the main cause of the longbowman gap (17 vs ~54). The README entry says "Three stables and two archery ranges" as the army shape, but only one range produces.
   - Direction: after the second range is built, add a `produce longbowman from archery-range` step that targets both ranges, then retune so Castle and knights stay near the reference.

2. Implementer report / PR-body figures: **contract (AC "Report"; ticket Report section: "A gap from the reference is reported with its cause")**.
   - What: the Castle gap (905.4 s vs 804 s) has no stated cause. The longbowman cause given ("two ranges starved of wood/food") is wrong.
   - Measured floats: food is never short. It floats 1,532 at 480 s, 3,179 at 600 s, 4,065 at 660 s, 4,912 at 900 s and 2,936 at 1200 s. Wood income is 155-186/min until 840 s, and one range is idle (finding 1).
   - Castle cause, measured: gold income is 74/min until the `move 12 farm to gold` at 670 s, and gold sits at 537 at 660 s. So the palace's 600 gold is affordable only at about 680 s. The stable/range/stable before it also each wait 48-69 s on wood (steps[24..26] `waitBreakdown.resources`). Food villagers are over-allocated (854-1,090 food/min against a 3-5k float) while gold and wood are short.
   - Direction: report these causes. Retuning (moving food villagers to gold/wood earlier) is the implementer's choice, not required.

3. `data/aoe4-build-order/builds/english-knight-longbow.json:250-300` (steps[36..40], the five `whenever ... runs out` reactions), followed by twelve farm steps at `:302-388`: **contract**.
   - What: `design/M3.md` "Gold deposit reactions in the shipped builds" says "Reactions go at the end of the step list". The ticket says "end the step list with `whenever <ref> runs out move all ...`". Here the reactions sit in the middle, ahead of the 14/16/18-minute farms.
   - Behavior is unchanged: reactions are offered before non-reaction steps regardless of position. The shipped file still departs from the stated layout, and the page shows the build to users in this order.
   - Direction: move the five reactions to the end, after the 18:00 farms. Re-run `builds.test.ts`.

4. `data/aoe4-build-order/README.md:61-62` ("farms added at 14, 16 and 18 minutes"): **contract (doc sentence the code contradicts)**.
   - What: the `@14:00` farms (JSON `:302` on, steps[41..44]) start at 905.4 s (15:05), not at 14:00. They are `earlier-step` behind `produce knight from stable` (steps[34]), which waits for Castle (167 s on `prerequisite`).
   - The ticket warned about exactly this ("every later step stays `earlier-step` behind it").
   - Direction: move the `@14:00` farm block before `produce knight`. The knight cannot start before 905 s anyway, so this costs nothing. Otherwise, reword the README to give the actual start.

## Spec gaps

None.

## Acceptance criteria

- [PASS] AC1, file, name and civ, `builds.ts` entry. The file exists with the exact name and `civ: english`. `git grep -n english-knight-longbow -- lib/aoe4-build-order/builds.ts` gives 2 lines (import and array entry), after `english1tc`. SGS-050 is not on the base, so the ordering clause is not yet applicable.
- [PASS] AC2, `source` and `start.rally`. `source` is `hand-authored for this simulator` and `start.rally` is `gold`. The shared "validates" and "round-trips" suites pass for the build.
- [PASS] AC3, bar parts 1-5 at 1200 s and 3600 s. The shared suites pass. Independently measured at 3600 s: 0 waiting, and gold warnings are all `info`. The only `warning` is `node-depleted` on sheep at 780 s, which the bar allows.
- [PASS] AC4, part 4 non-vacuous at 3600 s.
  - Five gold refs run out: `gold` 1051.0, `gold#2` 1519.2, `gold#3` 1987.5, `gold#4` 2455.7, `gold#5` 2923.9.
  - Mutation run by me: deleting the `gold` reaction fails bar parts 4/5 at 1200 s and 3600 s, plus the new dry-deposit case.
  - The PR body does not exist yet (local branch). The README lists the run-outs.
- [PASS] AC5, order. jq: min research index 30 > palace index 29. The new test asserts index order and `startedAt` order. Mutation run by me: moving the four techs before the palace fails that case.
- [PASS] AC6, content.
  - The build has `build kings-palace`, `produce knight` from `stable`, `produce longbowman` from `archery-range`, and the four techs.
  - jq `has("amount")` prints `false`.
  - At 1200 s, Castle is reached at 905.4 s, with knight 24 and longbowman 17 (both > 0).
- [FAIL] AC7, report. Castle time and counts are given, but the gap causes are missing or wrong (blocking 2).
- [PASS] AC8, diff scope, unit, lint and acceptance.
  - The diff touches only the 4 allowed files.
  - `npm test`: 37 files, 998 passed, 4 skipped.
  - `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
  - `npx next build`: OK.
  - `acceptance/aoe4-build-order.spec.ts`: 27 passed. This includes the test that lists every prebuilt build and loads its text.
  - I did not run the full `npm run acceptance`; the implementer reports 522 passed.
- [PASS with finding] AC9, README entry. It names the landmark, the blacksmith ordering, N=5 and the run-out times, and those times match the measured values. One sentence is contradicted (blocking 4).
- [PASS] AC10, no invariant regressions.

I did not tick any boxes: the verdict is not APPROVE.

## Invariants touched

- A1, holds. The JSON has no `amount` key and no cost, rate or duration. Only time triggers and counts are used.
- A2, holds. No step is waiting at either horizon. Engine code is unchanged.
- A3, holds. The build is data only. Two runs give identical results; the run-out times in the README match the measured values exactly.
- S1-S3, not touched.

## Points the manager asked about

- **Castle 905 s vs ~804 s and 17 longbowmen vs ~54.** The ticket says not to assert these and not to treat a gap as a failure, and nothing asserts them (correct). The 17 has a real defect behind it, though: the second range is idle (blocking 1). Both stated causes are missing or wrong (blocking 2).
- **`rally kings-palace -> wood`.** This is valid and necessary. The King's Palace is a villager producer (`isVillagerProducer`). A new instance takes `rallyDefaults` or else `start.rally` (`gold`), and the rally step before the build sets `rallyDefaults`.
  - Mutation run by me: removing the step fails bar part 5 with `idle-arrival` on `gold`. That is 8 idle villagers at 1200 s and 28 at 3600 s, arriving from 17:18.
  - Rallying to an infinite node is an allowed alternative to the ticket's `whenever <ref> runs out rally <producer> -> <next>`. The README documents it. Not a finding.
- **Tests added.**
  - `researches its blacksmith techs after the King's Palace starts` is the ticket-specified case. It can fail (mutation confirmed).
  - `runs several gold deposits dry by 3600 s` (`dry.length > 1`) is an extra non-vacuity guard for AC4. Its name matches its assertion, and it fails when the first reaction is removed.
  - Both use `it.runIf(build.name.includes(...))`, the same pattern as the existing `1TC` cases (`builds.test.ts:50`, `:84`). Fine.

## Bot reconciliation

`reviewBot.cli` is empty, so there is no bot. `rulesFile` is empty.

## Non-blocking notes

- `builds.ts:6`: the `BUILDS` line is now long. A one-entry-per-line array would make SGS-050's rebase (it appends to the same array) a clean one-line insert instead of a same-line conflict.
- `source`: the implementer report does not say whether a public guide matching "knight and longbow into a King's Palace Castle" was searched for. The fallback string is allowed. State the search in the PR body.
- Upgrade gold: about 750 on blacksmith techs plus veteran longbowmen (`spent.research` is 1,200 at 1200 s including horticulture and the others), against the reference's ~1,750. This is implementer tuning. Report it in the PR body as the ticket asks.
- Ticket shape "3 farms at the switch": two farms (steps[22..23]) sit between the blacksmith and the stables. This is reference shape only, not asserted.

## Coverage

- Reviewed: all four changed files.
- Engine paths read to judge the data: `simulate.ts` produce, rally, `addBuildingInstance`, `writeRally`.
- Also read: `design/M3.md` (M3.7, the reaction layout rule, the bar), `docs/aoe4-build-order.md` (prebuilt paragraph), and the ENG 1TC JSON for opening parity. The first five minutes match except that 1TC's barracks and double-broadax are dropped.
- Commands I ran:
  - lint, the unit suite and `next build`;
  - the page acceptance spec;
  - `next start` on port 3917 with a POST of the build to `/api/aoe4-build-order/simulate`: Castle 905.4 s, 0 waiting;
  - three mutations;
  - simulation probes for floats and rates.
- Not run: the full `npm run acceptance` suite (only `aoe4-build-order.spec.ts`).
- REPO.md checklist: "Every diff" was done (build, and the page loaded through Playwright and `next start`). "AoE4 build order" was done: no copied helper, no engine rule change, no chart change. `REVIEW.md` does not exist. Project and repo LESSONS.md are empty.
