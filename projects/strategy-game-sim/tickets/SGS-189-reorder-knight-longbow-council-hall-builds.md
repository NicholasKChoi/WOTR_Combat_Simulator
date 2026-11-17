# SGS-189: Reorder the Knight/Longbow and Council Hall prebuilt builds

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: low
- **Invariants**: A3 (a reordered build must still give identical timings on repeated runs; the builds are data files under the A-section `Paths:`)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (two JSON step reorders, one README entry and one test re-pin; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M11.md OD3b option B (Knight/Longbow and Council Hall rows), M11.5 prep for M11.5a (B-B13); plans/M11-20261116.md outline A

## Context

The busy-building rule that a later ticket adds (a step waits for a free building, B-B1..B-B13) makes every blacksmith research block later steps for up to 60 s. Under it the Knight/Longbow and Council Hall builds miss their production floors and floating-resource cap as they are ordered today. The design measured that reordering their steps (OD3b option B) keeps every `builds.test.ts` case passing on the current engine, so the reorders land first as their own PR and the rule ticket carries only the rule, the Spear/Longbow edit and re-baselines. No step is added, removed, or has its trigger changed; only list position moves.

On the current engine (origin/main 87f0cd7, reorders applied) the reorder moves `veteran-longbowmen` in Knight/Longbow to complete before 840 s, so the one test that pins its completion window fails; every other unit test passes unchanged. The design's 841.2 s completion (M11.5a row) is the value under the busy-building rule, not on this ticket's engine.

## Scope

Reorder `steps` in two files, keeping each step object byte-for-byte as it is (indentation and formatting as the files have it today). Indices below are the current zero-based indices (Knight/Longbow has 74 steps, 0-73; Council Hall 61 steps, 0-60); the "order" is the new sequence.

- `data/aoe4-build-order/builds/english-knight-longbow.json`: order 0-29, 31-34, 37, 30, 38-43, 35, 44, 45, 36, 46-48, 52-55, 49, 50, 56-63, 51, 64-73. Effect: `fitted-leatherwork` (30) follows the third stable (37), `bloomery` (35) follows the farms 38-43, `iron-undermesh` (36) follows the 740 s farm (45), `wedge-rivets` (49) and `decarbonization` (50) follow the 840 s farms (52-55), `insulated-helm` (51) follows the 942 s and 960 s farms (56-63). Every research still follows `build kings-palace` (27).
- `data/aoe4-build-order/builds/english-1tc-council-hall.json`: order 0-32, 34, 35, 33, 36, 40, 41, 42-46, 37, 38, 39, 47, 51-55, 48, 49, 50, 56-60. Effect: `iron-undermesh` (33) follows the 690 s mining camp and move (34, 35); `bloomery` and `fitted-leatherwork` (40, 41) follow The White Tower (36); the 900 s farms (42-46) precede `fertilization`, `veteran-longbowmen`, `veteran-spearmen` (37-39); then `decarbonization` (47); `lumber-preservation`, `textiles`, `specialized-pick` and the last two farms (51-55) precede `insulated-helm`, `balanced-projectiles`, `wedge-rivets` (48-50).
- `data/aoe4-build-order/README.md`, `english-1tc-council-hall` entry: its "Added after the guide" paragraph describes the old order and becomes untrue in three places: the 660 s blacksmith is said to research `steeled-arrow` and `iron-undermesh` (`iron-undermesh` now follows the 690 s mining camp and move); `bloomery` and `fitted-leatherwork` are listed after `fertilization`, `veteran-longbowmen`, `veteran-spearmen` (they now follow The White Tower directly, and those three follow the 900 s farms); and "the Castle blacksmith techs" are placed before `lumber-preservation`, `textiles`, `specialized-pick` and the two farms (only `decarbonization` now precedes them; `insulated-helm`, `balanced-projectiles`, `wedge-rivets` follow). The paragraph is corrected to the new file order, and the entry names the reorder as a transcription choice (design OD3b). The implementer writes the wording.
- `data/aoe4-build-order/README.md`, `english-knight-longbow` entry: its sentences on where steps sit (the four blacksmith techs after `build kings-palace`; `veteran-longbowmen` and the Castle blacksmith techs after `produce knight`; the 10:00 farm block after the third stable and the 10:34 pair) were read against the new order and still hold. Change a sentence only if it contradicts the new file; the PR says whether the entry changed.
- Tests, `lib/aoe4-build-order/research.acceptance.test.ts`, "holds 20 tier-2 longbowmen just before completion and moves them all to tier 3 at it" (Knight/Longbow): it asserts the completion lies in (840, 845] and reads counts at the literal times 840, 845 and 1800, which no longer bracket the completion. Re-pin it so its window follows the result instead of literals: `veteran-longbowmen` completes within the run's horizon; at the last sample before the completion the longbowman stock is wholly tier 2 (a non-zero count, asserted first so the test cannot pass on an empty stock) and holds no tier 3; at the first sample at or after it the whole stock is tier 3 and none is tier 2; no tier-2 longbowman exists at any later sample. Counts are the values the engine returns, recorded in the report with the completion time. A title that names a count names the count the test pins. The busy-building ticket (SGS-190) re-measures the counts again under its rule; with the window derived from the result, it does not move the sample times.
- No other test changes its assertions; a test outside the one above that fails is a defect to explain, not to re-baseline. Floors, the floating cap and the bars in `builds.test.ts` and `production-floors.ts` are unchanged; a floor, cap or bar failure stops the ticket and goes in the report.
- Acceptance specs: every acceptance spec that loads `english-knight-longbow` or `english-1tc-council-hall`, by importing the JSON or by selecting or requesting the build by name, passes. Examples found at the base: `aoe4-simulate-api-knight-longbow-build`, `-prebuilt-plans`, `-prebuilt-farms`, `-veterancy-conversion`, `-house-rule`, `-deer-pack`, `aoe4-marker-labels`, `aoe4-build-order-knight-longbow-page`, `aoe4-build-order-inline-issues`, `aoe4-build-order-m4-flow`, `aoe4-chart-readability`. An assertion that moves is updated to the new value and named in the PR.

**Out of scope:** the busy-building rule and the Spear/Longbow build edit (later ticket); any engine, API or UI change; changing floors, caps or bars; adding, removing or retriggering steps; the Spear/Longbow and ENG 1TC README entries.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The step sequence of each edited build, read by step content, equals the order above; the multiset of steps in each file is unchanged (nothing added, removed, or modified), checked in the implementer's report by comparing the files at the base and the branch.
- [ ] Every `builds.test.ts` case passes unchanged for every prebuilt build, including each floor, the floating-resource cap and the no-waiting bars at their existing horizons.
- [ ] (respec 1) The re-pinned Knight/Longbow conversion test takes its sample times from the `veteran-longbowmen` completion, not from fixed times: it asserts a non-zero tier-2 stock and no tier 3 at the last sample before completion, the whole stock at tier 3 and none at tier 2 at the first sample at or after it, and no tier 2 at any later sample. It fails if the conversion leaves any tier-2 longbowman behind or converts before completion. The report records the completion time and the counts the engine returns.
- [ ] (respec 1) No unit test other than the conversion test changes an assertion; the implementer lists every test file edited.
- [ ] (respec 1) Every acceptance spec that loads `english-knight-longbow` or `english-1tc-council-hall` (by import or by build name) passes; any assertion updated is named in the PR.
- [ ] (respec 1) The Council Hall README entry's "Added after the guide" paragraph lists its steps in the order of the new file (including where `iron-undermesh`, `bloomery`, `fitted-leatherwork` and each Castle blacksmith tech sit) and names the reorder as a transcription choice; no Knight/Longbow README sentence contradicts the new Knight/Longbow file order.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-16

- Underspecified: the ticket took the design's "only the counts move" for the longbow conversion test, but on the current engine the reorder moves `veteran-longbowmen` completion below 840 s (838.0 s measured); it also gave a closed acceptance-spec list and missed the Council Hall README's 660 s `iron-undermesh` clause.
- Changed: the conversion test now derives its window from the completion instead of (840, 845]; the spec list is a rule with examples; the README scope names every untrue clause and the Knight/Longbow entry is confirmed as still holding.
- No branch work exists yet; the reorder indices and effects are unchanged and verified against origin/main.
