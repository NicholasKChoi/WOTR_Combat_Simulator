# SGS-111 implementer 1

- Ticket: SGS-111 (drop the house gate)
- Branch: `sgs-111-drop-house-gate`, base origin/main 68dd089
- Tip: 3844378
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-111-drop-house-gate
- Status: **needs_review**

## Files touched

- `lib/aoe4-build-order/simulate.ts`: removed `lastHouseStep`, `houseGateOpen`, `accrueHeld`, `houseWarnings`, Engine `supplyBlocked`/`heldAt`/`heldSeconds` and their three writers, the `accrueHeld` call and `...houseWarnings(engine)`. `startAutoHouses` now returns early only for `!autoHouses || !house`.
- `lib/aoe4-build-order/model.ts`: `SimWarning` loses `auto-houses-never-start` and `auto-houses-held`.
- `lib/aoe4-build-order/depletion.ts`: `tieRank` auto-house branch removed, comment fixed.
- `lib/aoe4-build-order/depletion.test.ts`: neverStart/held rows removed; a `farm-idle` row added to the sort table so the rank mutation breaks the table itself.
- `lib/aoe4-build-order/simulate-house-gate.test.ts` (renamed from simulate-house-warnings.test.ts): rewritten.
- `lib/aoe4-build-order/simulate-construction.test.ts`: gate test rewritten to the new rule; one palace pin updated.
- `lib/aoe4-build-order/research.acceptance.test.ts`: veteran-longbowmen pins updated to engine values.
- `data/aoe4-build-order/builds/english-knight-longbow.json`: data retune (see below).
- `data/aoe4-build-order/README.md`: new house rule; knight-longbow description matches the retune.
- `docs/aoe4-build-order.md`: Houses and supply, sort sentence, Severity rows, `warnings` field.
- `docs/api/openapi.json`: two `SimWarning` oneOf variants removed; `warnings` description rewritten.
- `acceptance/aoe4-simulate-api-house-gate.spec.ts` (renamed from house-warnings spec): rewritten.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: variant list and `WarningKeys` tuple reduced to four.

## Data retune (english-knight-longbow)

Once the gate was gone, the old data failed the existing `builds.test.ts` bar `MAX_FLOATING_AT_1200 = 2000`: gold at 1200 s was 2913. Old and new values with the old data on the new engine: villagers at 1200 went from 76 to 81, longbowmen from 50 to 49, knights from 31 to 29, and floating at 1200 went from {food 63, wood 1177, gold 1878} to {118, 1481, 2913}. Castle went from 764.37 to 776.54. I tried about 25 variants. The chosen edit changes three things:
- Step 28 (capital TC rally after `build kings-palace`) goes from `gold` to `wood`.
- Step 45 farm: `time` 722 becomes 740, and `then` goes from `wood` to `farm`.
- Steps 56-59 (942 group): `then` goes from `wood` to `farm`.

The result at 1200 s: villagers 81, longbowmen 67, knights 31, food 1557/min, and floating {383, 1954, 11, 0}. There are no waiting or unstarted steps and no farm-idle, idle-arrival or step-stuck warnings at 1200, 1800 or 3600. Five gold deposits are dry by 3600. Every floor is met (61/36/23/1180).
- The wood margin is thin (46 under the cap). Moving step 45 to 735 instead of 740 pushes wood to 2055, so this tuning is sensitive.
- Step 44 (12:00 rally TC to wood) now repeats the step-28 rally. The README says so.

ENG 1TC and Spear/Longbow are byte-identical to before: every step start is identical, and the 1800 s digest pins `32a982d42fa1e689` and `60e54bd7196e39e7` still pass.

## Tests

- `npm test`: 62 files, 1842 passed, 10 skipped, 0 failed.
- `npm run acceptance` (full suite): 861 passed. No prebuilt acceptance pin needed changing.

New and rewritten unit tests, with the invariants they encode (`simulate-house-gate.test.ts`):
- Fixture: houses at(0) and at(600), `durationSeconds` 700, `twoTowns`, `woodStart`.
  - With `autoHouses: false`, population is flat from the hold to 595 s, the hold is before 535 s, population rises after the late house, and the houses complete at [20, 620] (no auto-house).
  - With `autoHouses: true`, population at hold+5 and at 595 rises past the off run's limit. The late step starts at 600, and an auto-house completes before 600.
  - Neither run has an `auto-houses*` code.
  - Determinism (A3): a second run of each is deep-equal.
- No-house order: houses complete at [120, 220, 320], and the timeline digest `679240f54895c11f` is the same on the origin/main engine (verified by running the file against the old simulate.ts).
- A reaction house that never fires: auto-houses complete at the same times as the no-house run, production passes the off run's limit, and there is no auto-houses warning.
- Same-instant case: an explicit house triggered at 100 s, the instant the no-house run starts its first auto-house (completion 120 minus 20 s build). It starts at 100, and the completions equal the no-house run's [120, 220, 320], so no extra auto-house is built.
- Prebuilt digest pins for ENG 1TC and Spear/Longbow at 1800 s stay unchanged. The Knight digest pin was dropped because that build changes by design.

`depletion.test.ts`: the sort table now has 13 rows including `farm-idle`, with the title "orders by at, then node warnings by ref and code, then farm-idle, then step-stuck by step".

## Pre-existing tests edited

- `simulate-construction.test.ts`, "stay off until the last build-house step has started", renamed "plan from the start alongside explicit build-house steps". The ticket rule is: a changed-behavior test takes the engine value, checked against the rule.
  - The house-at-600 run at 200 s now equals the no-house run (20, was 13).
  - The houses at 0/30 run is unchanged ([20, 50, 320], 40 villagers at 400).
  - `autoHouses: false` is still 33.
  - The late-house-at-300 run is now [20, 220, 320], with villagers 24 at 240 and 30 at 300. It was 23 and 23, held.
- `simulate-construction.test.ts`, "keep population rising while the knight + longbow King's Palace builds without its explicit pre-palace houses": population(660) went from 44 to 47, which is the data retune's effect. The rule assertion population(760) > population(660) is kept.
- `research.acceptance.test.ts`, "holds 9 tier-2 longbowmen ..." renamed "holds 20 tier-2 longbowmen ...". Engine values: veteran starts at 776.54 and completes at 843.16. Tier-2 is 20 at 840 and tier-3 is 20 at 845; longbowman-3 at 1800 went from 64 to 72. The window moved from (835, 840] to (840, 845].
- `depletion.test.ts`, the sort table: rows for the removed codes deleted and a farm-idle row added.
- The old house-warnings unit and acceptance specs were replaced; their cases tested removed codes.

## Pinned outputs

- House completions: [20, 620] for the off fixture, [120, 220, 320] for the no-house run, and [20, 220, 320] for late-at-300.
- Villagers: 24 at 240 and 30 at 300 for late-at-300.
- Digest `679240f54895c11f` for the no-house run (`twoTowns`, `woodStart`, 400 s).
- Research pins and palace population 47, as listed above.

## Mutation checks (all undone; `git diff` of simulate.ts/depletion.ts was confirmed against the backup after each)

- **Gate restored.** I ran the new test files against origin/main's `simulate.ts`, which has the gate restored.
  - house-gate test, "keeps population rising": fails at line 69 with `expected 30 to be greater than 30`, the production-continues assertion.
  - The reaction-never-fires test fails with `expected [] to equal [120,220,320]`.
  - The no-auto-houses-warning test fails with `['auto-houses-held']`.
  - The construction test "plan from the start" fails with `expected 13 to be 20`.
- **`houseDemand` ignores `engine.constructing`** (simulate.ts:638): the same-instant test fails at line 110 with `[120,120,125,130,135]` vs `[120,125,130,135]`, an extra auto-house. The no-house and digest tests fail too.
- **`!engine.inputs.autoHouses` check dropped** (simulate.ts:665): the off fixture fails with `expected [20,220,...,620] to equal [20,620]`, and the reaction test's off run fails too.
- **farm-idle rank set to `[2,0,0]`** (depletion.ts:181): the sort table test fails at depletion.test.ts:215, and the farm-idle test fails at :220.
- **Determinism:** no break tried; there is no nondeterministic code path to flip.

## Doc claims

- `docs/aoe4-build-order.md`, Houses and supply: "With `autoHouses` on, auto-houses plan from the start whether or not the order has `build house` steps." Backed by `startAutoHouses`, whose early return is now only `!autoHouses || !house`.
- "Explicit `build house` steps start as ordered and add houses on top." Backed by `offerSteps`; the house-gate test shows the late step starting at 600 with auto-houses in place.
- "The planner counts a house under construction in its headroom whichever kind it is, so an explicit step that starts after auto-houses already cover the demand adds a surplus house." Backed by `houseDemand`, which maps all of `engine.constructing`. I wrote "adds", not "only then", because a slow explicit house finishing past the lead is not counted.
- "With `autoHouses: false` no auto-house is built, and production blocks at supply until a `build house` step adds more." Backed by `startAutoHouses` and `payOrder`'s supply return.
- "No warning reports production held at the supply limit." Backed by `SimWarning` in model.ts.
- Sort sentence, `warnings` field and OpenAPI `warnings` description: they list node warnings (node-depleted before idle-arrival), then farm-idle, then step-stuck by step. Backed by `depletion.ts:tieRank`.
- README: "Auto-houses plan from the start as well, so the explicit houses add supply on top of them." Same source as above.
- README: "once the palace starts, new villagers go to wood (the 12:00 rally to wood repeats it)". Backed by data step 28 and step 44; no TC rally lies between them.
- README: "the farm at `time` 740 (one) and the group at 942 (four) are built by wood gatherers who farm them". Backed by data steps 45 and 56-59, which have `then: farm`.

## Stages

- Codegen: none set.
- Build (`npm ci && npx next build`): pass.
- Lint (`npx tsc --noEmit && npm run lint:dup`): 0 errors, 0 clones.
- Removed-name grep over lib, components, pages, acceptance, docs and data: no matches.
- The worktree was clean after commit, with no tool-made changes.

## Invariants

- A1 (numbers in data files): the retune is in the build JSON only, with no engine constants.
- A2 (no negative resources): the auto-house payment path is unchanged.
- A3 (determinism): tested.

## Out-of-scope findings

- The Knight/Longbow tuning is fragile: its wood float sits 46 under the bar.
- Step 44 of english-knight-longbow is now a redundant rally. Removing it would shift step indices that tests look up by search, so I left it.
- The README knight paragraph mentions "the Town Center rally to farm", but no TC rally to farm exists in the build. This was already there before my change; I left it.
