# SGS-051: Add the prebuilt build ENG Knight/Longbow (King's Palace)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.7 (second prebuilt build, meets the prebuilt bar), M3.11 (the build switches gold deposits through reactions)
- **Priority**: medium
- **Risk**: high
  <!-- REPO.md criticalPaths `lib/**` applies: the ticket adds one entry to lib/aoe4-build-order/builds.ts (and test lines in builds.test.ts, which alone would not count). The plan rated this medium and called the risk tuning, not code; the template rule (criticalPaths) makes it high. The data file (about 60 to 90 steps) is excluded from the business-logic count, which is about 3 lines. -->
- **Invariants**: A1 (the build is data; every cost, time and rate stays in the snapshot and rules files, and no step restates one), A2 (the build only sequences steps; a step that cannot be afforded waits and shows as waiting, which the bar forbids at the two horizons), A3 (the build and its result are deterministic)
- **LOC estimate**: ~3 business logic (`builds.ts` one import and one array entry; one `builds.test.ts` ordering assertion ~15 lines of test); new JSON `builds/english-knight-longbow.json`, tests, docs excluded
- **Depends on**: SGS-039 (reactions, `depleted` trigger, depletion on by default, the five-part bar test in `builds.test.ts` at parts 1-3 for 1200 s and 3600 s and parts 4-5 for 1200 s), SGS-040 (paste grammar for `whenever <ref> runs out`, `move all`, `gold#N`; the paste round-trip test; parts 4-5 extended to 3600 s), SGS-041 (multi-tier `researchEntry`, note ids; research steps pick the entry at the current age); transitively SGS-038, SGS-037, SGS-035. SGS-050 (the first M3.7 build) adds its own line to `builds.ts` in parallel: rebase only, no shared contract.
- **On merge**: none
- **Source**: `design/M3.md` (Contracts: M3.7 builds, Gold deposit reactions in the shipped builds; Behavior rules: prebuilt builds bar and "how they meet it"); `plans/M3-20261101.md` outline Q

## Context

M3.7 asks for two prebuilt builds beyond ENG 1TC. This one is a Castle-Age knight and longbow army reached through the King's Palace landmark. It must meet the prebuilt bar in the design with depletion on at default inputs: at 1200 s and at 3600 s no step is waiting, every non-reaction step has started, a reaction is not-reached only because its trigger has not held, every gold deposit that runs out by the horizon is switched by a `move all` reaction at the run-out instant, and no gold warning has `severity: 'warning'`. The risk is tuning a long build against the engine, not code.

## Scope

Names follow `design/M3.md`, SGS-039, SGS-040 and SGS-041. SGS-050 did not exist as a file when this was written; it shares only the `BUILDS` array in `builds.ts`.

**`data/aoe4-build-order/builds/english-knight-longbow.json`** (new, a `BuildOrder`, same shape as `english-1tc.json`)
- `civ: "english"`, `name: "ENG Knight/Longbow (King's Palace)"` (exact string from the design), a `source` that is a public build-guide URL if one matching "knight and longbow into a King's Palace Castle" is found, else the string `hand-authored for this simulator`, and `start.rally` set (the existing `builds.test.ts` case "is an English build with a source and a start rally" requires it). A `start.villagers` split is optional and must sum to the civ's starting villagers.
- Feudal age by any `age1_landmark` the implementer chooses (ENG 1TC uses `abbey-of-kings`; `council-hall` is the other age-1 landmark in the snapshot). Castle by `build kings-palace` (snapshot `kings-palace-2`, class `age2_landmark1`, 1200 food + 600 gold, 220 s). The PR body names the Feudal landmark chosen and why.
- Army: `knight` from `stable` (snapshot entries `knight-3` and `knight-4`, so a `produce knight` step waits for Castle) and `longbowman` from `archery-range`. Shape from the owner's scratch run (a reference, not an assertion): 3 stables and 2 archery ranges; 12 villagers moved to gold at the switch to military production; farms added over time (3 at the switch, then 4 each at about 14, 16 and 18 minutes).
- Blacksmith: the Feudal techs `steeled-arrow`, `fitted-leatherwork`, `bloomery` and `iron-undermesh` (snapshot age 2, producedBy `blacksmith`) are `research` steps placed after the `build kings-palace` step in the list. A `build` step starts when it pays and the next step arms only after it starts, so the techs then queue behind the landmark instead of taking its gold first. Castle-age upgrades the implementer adds (candidates in the snapshot: `veteran-longbowmen`, `veteran-horsemen` which `upgradeTargets` maps to `horseman`, so it does not change knights, and the Castle blacksmith techs) are the implementer's tuning. The owner's scratch run spent about 1,750 gold on upgrades, finishing about 18:07.
- Ordering constraint to respect: a `produce knight` step arms once the landmark step has started but cannot start until Castle completes (220 s later), and every later step stays `earlier-step` behind it. Steps that must run before Castle completes (stables, ranges, the farms and the villager move to gold) go before that `produce`, or are time- or villager-triggered earlier in the list.
- Gold deposits: name the deposits in order from `gold` up to `gold#N`, N at most `MAX_DEPOSITS`. For every deposit that runs out by 3600 s while it has gatherers, end the step list with `whenever <ref> runs out move all <ref> to <next>` (`<next>` is the next deposit, or another node for the last deposit that runs out). If a producer is rallied to a deposit when it runs out, add `whenever <ref> runs out rally <producer> -> <next>`. A `build ... then <ref>` or `rally` to a deposit that has already run out is an `idle-arrival` warning on a gold ref (bar part 5), so those steps name the live deposit. N is found by measuring: 12 gold villagers draw 4000 per deposit in a few minutes of game time, so this build likely switches more deposits than ENG 1TC. Never change a default amount or input to fit.
- The build must also leave no non-reaction step waiting or not-reached at either horizon, and must validate and round-trip through the paste format (`whenever` lines included).

**`lib/aoe4-build-order/builds.ts`**: import the new JSON and append it to `BUILDS` after `english1tc` and, once SGS-050 is on the base, after the spear/longbow build, in the design's order (today `builds.ts:5` has the single entry). Update the header comment only if it is wrong afterwards (it is not).

**`lib/aoe4-build-order/builds.test.ts`**: the `describe.each(listBuilds())` suites from SGS-039 and SGS-040 cover validation, round-trip and the bar for the new build with no edit. Add one case for this build only: its four blacksmith `research` steps come after its `build kings-palace` step in `steps`, and at 3600 s each of their `startedAt` is at or after the `kings-palace` step's `startedAt`.

**`docs/aoe4-build-order.md`** (prebuilt builds paragraph, "Prebuilt builds live in `data/aoe4-build-order/builds/`"): the sentence lists no build names today, so no edit is required. If SGS-050, 039 or 040 have added a list of builds by then, add this one to it. Grep `ENG 1TC` in the docs and `README.md` for any statement that there is one prebuilt build.

**Report** (PR body, not a test assertion): the Castle time (the `ages` entry with `age: 3`, `reachedAt`) and the knight and longbowman counts at 1200 s (sum of `counts` last sample over `unitsProduced` entries with `baseId` `knight` and `longbowman`, at `durationSeconds: 1200`), next to the reference: Castle about 13:24 (804 s), about 23 knights and about 54 longbowmen at 20:00, and the gold spent on upgrades. A gap from the reference is reported with its cause, and is not a failure.

**Out of scope:** SGS-050's build; any engine, validation, parser or OpenAPI change; changing ENG 1TC, a default amount, an input or a rule; asserting the reference numbers in a test; the page, step table and timeline; the M3 docs audit (SGS-054).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `data/aoe4-build-order/builds/english-knight-longbow.json` exists, with `name` exactly `ENG Knight/Longbow (King's Palace)` and `civ` `english` (absent on `main`: `test -e` fails today), and `lib/aoe4-build-order/builds.ts` lists it after ENG 1TC (`git grep -n "english-knight-longbow" -- lib/aoe4-build-order/builds.ts | wc -l` prints 0 on `main` and 2 after: the import and the array entry). When the spear/longbow build is also listed, `listBuilds().map((b) => b.name)` has it before this one.
- [ ] The build has a `source` (URL or `hand-authored for this simulator`) and `start.rally`; `validateBuildOrder` returns no issues; `parseBuildOrderText(formatBuildOrderText(build))` is `ok` with `start` and `steps` equal to the build's (the existing suites, no edit).
- [ ] Prebuilt bar, at default inputs, at 1200 s and at 3600 s, for this build (the shared suites): (1) no step is `waiting`; (2) every non-reaction step has `startedAt !== null`; (3) a `not-reached` reaction has `waitingOn: 'trigger'`; (4) every gold ref (`nodeKindOf(ref) === 'gold'`) with `depletedAt` at or before the horizon has a `move` reaction with `count: 'all'` and that `from` whose `startedAt === depletedAt`; (5) no `node-depleted` or `idle-arrival` warning on a gold ref has `severity: 'warning'`. Parts 1-3 are asserted at both horizons by SGS-039, parts 4-5 at 1200 s by SGS-039 and at 3600 s by SGS-040.
- [ ] Part 4 is non-vacuous at 3600 s: the 3600 s result has at least one gold ref with `depletedAt` not null (so at least one `whenever <ref> runs out move all` reaction in the file has `startedAt === depletedAt`). The PR body lists each gold ref that ran out, its `depletedAt`, and the reaction that moved it. Mutation (run in a throwaway worktree after the build exists): deleting the reaction for the first deposit from the JSON fails the bar test for this build at 3600 s (parts 4 and 5).
- [ ] Order: in the JSON, `jq '[.steps | to_entries[] | select(.value.action == "research" and (.value.tech | IN("steeled-arrow","fitted-leatherwork","bloomery","iron-undermesh"))) | .key] | min'` is greater than `jq '[.steps | to_entries[] | select(.value.building == "kings-palace") | .key] | first'`, the new `builds.test.ts` case asserts it plus `startedAt` order at 3600 s, and moving the four research steps before the `build kings-palace` step in the JSON fails that case.
- [ ] Content: the build contains a `build kings-palace` step, at least one `produce knight` step with `producer: "stable"`, at least one `produce longbowman` step with `producer: "archery-range"`, the four blacksmith techs, and no `amount`, rate, cost or time number (A1). At 1200 s the result has an `ages` entry with `age: 3` (Castle reached) and a `knight` and a `longbowman` series ending above 0.
- [ ] Report: the PR body gives Castle time and the knight and longbowman counts at 1200 s next to the reference (Castle about 13:24, about 23 knights and about 54 longbowmen at 20:00), the Feudal landmark chosen, the number of deposits N, and each gold run-out time. No test asserts these numbers.
- [ ] No default amount, input, rule or other build changes (`git diff --stat` shows only the new JSON, `builds.ts`, `builds.test.ts`, and a docs line if one is needed). The full unit suite and `npx tsc --noEmit` and `npm run lint:dup` pass; `npm run acceptance` passes (the new build appears in the page's prebuilt select and its text parses).
- [ ] No INVARIANTS.md regressions

## Open questions

None. The Feudal landmark, the Castle-age upgrades, the number of deposits N and the tuned counts are implementer choices inside the criteria above; the reference numbers are reported, not asserted.
