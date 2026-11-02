# SGS-050: Add the prebuilt build "ENG Spear/Longbow into MAA/Crossbow"

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.7 (first new prebuilt build: no step waiting or not reached), M3.11 (the shipped build switches gold deposits through reactions)
- **Priority**: medium
- **Risk**: high
  <!-- The plan said medium and the work is data. But `lib/aoe4-build-order/builds.ts` is a non-test file under REPO.md criticalPaths `lib/**`, so the template rule gives high (same call as SGS-040). Business logic is one import and one array entry. The real risk is tuning: the build has to meet the full prebuilt bar at 1200 s and 3600 s with depletion on. -->
- **Invariants**: A1 (no game number in code: the build is a data file and every cost, time and amount comes from the snapshot and `rules/base.json`), A2 (no step may be left `waiting`; the bar asserts it)
- **LOC estimate**: ~3 business logic (`builds.ts`: one import, one array entry). Data: one new JSON file, about 30 to 45 steps. Tests ~40 (`builds.test.ts`). Prose: `data/aoe4-build-order/README.md` entry.
- **Depends on**: SGS-039 (`Trigger` kinds `depleted` and `bank`, `BuildStep.reaction`, default node amounts, the prebuilt bar in `builds.test.ts`, parts 1 to 3 at both horizons and 4 and 5 at 1200 s), SGS-040 (paste grammar for `whenever <ref> runs out`, `move all`, `gold#N`; the paste round-trip test; bar parts 4 and 5 extended to 3600 s). SGS-035 (`test-helpers.ts`, the shared bar helpers the new shape test imports). Transitively SGS-038 (stock, `move all`, deposits), SGS-042 (`waitingOn`), SGS-037. Use the final names from the SGS-039 and SGS-040 as merged; this ticket names no new contract.
- **On merge**: none
- **Source**: `design/M3.md` (Contracts: M3.7 builds, Gold deposit reactions in the shipped builds; Behavior rules: prebuilt builds bar and "how they meet it"); `plans/M3-20261101.md` outline P and owner answers 4 and 8

## Context

M3 adds two prebuilt builds next to ENG 1TC. This ticket adds the first: Feudal through the Council Hall, an opening of spearmen and longbowmen, Castle through the King's Palace, then a switch to men-at-arms and crossbowmen. With depletion on by default, each gold deposit the build exhausts needs a `whenever <ref> runs out move all ...` reaction, and the build must still meet the whole prebuilt bar at 1200 s and 3600 s.

## Scope

Names follow `design/M3.md` and the written SGS-039 and SGS-040. Re-read their final text as merged before starting.

**Not renamed.** `data/aoe4-build-order/builds/english-1tc.json` ("ENG 1TC") stays as it is. The final design lists the new file as new (`design/M3.md` module table, "(new)") and keeps ENG 1TC as the first build: the Playwright spec imports it (`acceptance/aoe4-build-order.spec.ts:2`), the page default is `listBuilds()[0]`, and `data/aoe4-build-order/README.md:42` and `builds.test.ts` name it and its source. `design/M3.md` (line ~71) settles this: no rename, new file.

**`data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`** (new, one `BuildOrder`):
- `civ: "english"`, `name: "ENG Spear/Longbow into MAA/Crossbow"` (unique: the page select uses `name` as the option value), a `source`, and `start.rally` set (the existing `builds.test.ts` "is an English build with a source and a start rally" requires both). `source` is a public build guide URL if the author finds a matching one, else exactly `hand-authored for this simulator`.
- Every number is a non-negative integer and every id an aoe4world `baseId`, so the build re-parses from its own paste text.
- Shape, in this order (ids exist in `data/aoe4-build-order/aoe4world/english.json`: `council-hall` age 1 and `kings-palace` age 2 landmarks, `barracks`, `archery-range`, `spearman`, `longbowman`, `man-at-arms`, `crossbowman`):
  1. an economy opening that brings the build to Feudal: lumber camp, mining camp, mill and farms, rallies between nodes;
  2. `build council-hall` (Feudal), then the production buildings: `build barracks`, `build archery-range`;
  3. the opening army: `produce spearman from barracks` and `produce longbowman from archery-range`, both after the Feudal landmark step;
  4. `build kings-palace` (Castle);
  5. the transition: `produce man-at-arms from barracks` and `produce crossbowman from archery-range`, placed after the `build kings-palace` step. The `man-at-arms` switch carries a `time` trigger set to the landmark's completion second (man-at-arms is a Feudal-age unit and would otherwise start before Castle). Because that second is hard-coded, set this trigger last, after all tuning of earlier steps, and re-check it if any earlier step changes; `crossbowman` is a Castle unit and waits on its age by itself.
  6. the gold deposit reactions (below), at the end of the step list.
- The Feudal blacksmith techs are not part of this build. Villager production stays continuous and auto-houses stay on, so the build adds no `build house` step unless tuning needs one.
- **Gold reactions.** The design's rule: name the deposits in order from `gold` up to `gold#N`; for each deposit that runs out by 3600 s while it has gatherers, one reaction `whenever <ref> runs out move all <ref> to <next>`, where `<next>` is the next deposit, or any other node for the last one. If producers are still rallied to a deposit when it runs out, add `whenever <ref> runs out rally <producer> -> <next>` (otherwise spawns arriving there record a gold `idle-arrival` warning and fail bar part 5). N is at most `MAX_DEPOSITS` (8). Basis for N: a throwaway 23-step draft of this shape run on `main` with every node infinite gathered about 2,600 gold by 1200 s and about 9,000 by 3600 s, so expect two or three deposit run-outs by 3600 s and none by 1200 s. That draft is not committed and is not a tuned build. `main` has no depletion, so the implementer measures the real run-out times on the SGS-039/040 base and writes exactly one reaction per deposit that runs out by 3600 s (the last deposit's target is a non-gold node).
- Idle villagers on non-gold nodes are allowed by the bar (for example the sheep run out at 3000 food), but the build should not leave its sheep gatherers idle for a long time: send them to farms through `build ... from sheep then farm` steps, or add a non-gold reaction such as `whenever sheep runs out move all sheep to farm`. Either is fine; the bar does not ask.
- Tuning is the implementer's job: iterate step order, triggers, builders and the gold split until the bar holds. Do not change any default amount, input or rule to make it pass.

**`lib/aoe4-build-order/builds.ts`**: import the new file and add it to `BUILDS` after `english1tc` (design: "listed in `builds.ts` after `english-1tc`, in this order"). The ENG Knight/Longbow ticket (SGS-051) edits the same line and lists second: rebase only.

**`lib/aoe4-build-order/builds.test.ts`**: the bar parts and the paste round-trip already iterate `listBuilds()`, so the new build is covered once it is listed. Add one test for this build, found by name, that pins its shape at default inputs and 1200 s:
- the steps include `build council-hall`, `build kings-palace` after it, `produce spearman` and `produce longbowman` before the `kings-palace` step, and `produce man-at-arms` and `produce crossbowman` after it;
- `result.ages` includes age 3 (Castle) at 1200 s;
- `unitsProduced` shows a final count above 0 for each of `spearman`, `longbowman`, `man-at-arms` and `crossbowman` at 1200 s;
- the `man-at-arms` and `crossbowman` production steps have `startedAt` at or after the `kings-palace` step's `completedAt`.
Use `test-helpers.ts` for any helper it already exports (`lint:dup` stays at zero); do not copy the bar helpers.

**`data/aoe4-build-order/README.md`** ("Prebuilt builds", `:42`): add the new build's entry under the same pattern as ENG 1TC: name, source, what is omitted (nothing, or each omitted guide step with its reason), and transcription choices (why the `man-at-arms` trigger is a time, how the deposit reactions were chosen and the measured run-out times). SGS-039 (and SGS-040 for the 3600 s gold parts) rewrites the paragraph above the list to the bar wording, so this ticket does not touch it: it only adds its own entry. If the paragraph still says "keep running by 3600 s" or "never depleted" when you start, the base is wrong; stop and check.

**`docs/aoe4-build-order.md`** (Prebuilt builds, `:576-578`): SGS-039 and SGS-040 rewrite this paragraph to state the bar and ENG 1TC's reaction. Re-read it. If it names the shipped builds, add this one; otherwise no edit. Nothing else in the doc becomes untrue.

**Out of scope:** any engine, parser, validator, page or OpenAPI change; ENG 1TC and the second build (SGS-051); changing a default amount or input; a rename of ENG 1TC; asserting a Castle time or unit counts (they are not part of the design's bar for this build, only the shape test above); the `docs/aoe4-build-order.md` M3 sections owned by SGS-054.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The file exists, is listed second in `listBuilds()` (after ENG 1TC), and `listBuilds().map(b => b.name)` has no duplicate. `git grep -n "english-spear-longbow-maa-crossbow" -- . ':!.claude'` finds 0 lines on `main` and at least 1 (the `builds.ts` import) after; `ls data/aoe4-build-order/builds | wc -l` prints 1 on `main` and one more after this ticket than before it.
- [ ] The build validates and re-parses from its own paste text to equal `start` and `steps` (the existing `validates` test and SGS-040's paste round-trip, now running on this build). Its text contains one `whenever <ref> runs out move all <ref> to <next>` line for each deposit reaction.
- [ ] Prebuilt bar for this build at default inputs, at 1200 s and at 3600 s (the `builds.test.ts` bar after SGS-040): (1) no step is `waiting`; (2) every non-reaction step has `startedAt !== null`; (3) a `not-reached` reaction has `waitingOn: 'trigger'`; (4) every gold ref whose `depletedAt` is at or before the horizon has a `move` reaction with `count: 'all'` and that `from`, whose `startedAt === depletedAt`; (5) no `node-depleted` or `idle-arrival` warning on a gold ref has `severity: 'warning'`.
- [ ] Part 4 is non-vacuous at 3600 s: `depletions` shows deposit 1 (`gold`) run out (`depletedAt` not null) and every run-out deposit has its reaction. The PR body lists each deposit's `depletedAt` and the number of reactions in the file (one per deposit that runs out by 3600 s, and none for a deposit that does not).
- [ ] Shape test (this ticket): the order of `council-hall`, the opening army, `kings-palace` and the transition steps is as in Scope; at 1200 s Castle is reached (`ages` has age 3); `spearman`, `longbowman`, `man-at-arms` and `crossbowman` each have a final count above 0; the `man-at-arms` and `crossbowman` steps start at or after the `kings-palace` completion.
- [ ] Mutations, run by the implementer in a throwaway worktree on the SGS-039/040 base and reverted (the bar and paste checks do not exist on `main`, so the author could not run these): removing the first deposit reaction from the file fails bar part 4 and part 5 at 3600 s; moving `produce man-at-arms` before `build kings-palace` fails the shape test; removing the `build kings-palace` step fails the shape test; deleting the reaction of the last deposit that runs out by 3600 s fails bar part 4 at 3600 s. The PR states each was run.
- [ ] No default amount, `start` value of another build, input, or rule file is changed: `git diff --stat main -- data/aoe4-build-order/rules data/aoe4-build-order/aoe4world data/aoe4-build-order/builds/english-1tc.json` is empty.
- [ ] `data/aoe4-build-order/README.md` has an entry for the build, and its prebuilt-builds paragraph (rewritten by SGS-039/040, not here) uses the bar wording; `docs/aoe4-build-order.md` has no statement the new build contradicts.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint:dup` and `npm run acceptance` pass (the Playwright spec lists every build from `listBuilds()` and its default stays ENG 1TC).
- [ ] Determinism: running the build twice at 3600 s gives equal results, including `warnings`.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
