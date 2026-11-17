# SGS-189: Reorder the Knight/Longbow and Council Hall prebuilt builds

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: low
- **Invariants**: A3 (a reordered build must still give identical timings on repeated runs; the builds are data files under the A-section `Paths:`)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (two JSON step reorders, two README entries and one test re-pin; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M11.md OD3b option B (Knight/Longbow and Council Hall rows), M11.5 prep for M11.5a (B-B13); plans/M11-20261116.md outline A

## Context

The busy-building rule that a later ticket adds (a step waits for a free building, B-B1..B-B13) makes every blacksmith research block later steps for up to 60 s. Under it the Knight/Longbow and Council Hall builds miss their production floors and floating-resource cap as they are ordered today. The design measured that reordering their steps (OD3b option B) passes every `builds.test.ts` case on the current engine too, so the reorders land first as their own PR and the rule ticket carries only the rule, the Spear/Longbow edit and re-baselines. No step is added, removed, or has its trigger changed; only list position moves.

## Scope

Reorder `steps` in two files, keeping each step object byte-for-byte as it is (indentation and formatting as the files have it today). Indices below are the current zero-based indices (Knight/Longbow has 74 steps, 0-73; Council Hall 61 steps, 0-60); the "order" is the new sequence.

- `data/aoe4-build-order/builds/english-knight-longbow.json`: order 0-29, 31-34, 37, 30, 38-43, 35, 44, 45, 36, 46-48, 52-55, 49, 50, 56-63, 51, 64-73. Effect: `fitted-leatherwork` (30) follows the third stable (37), `bloomery` (35) follows the farms 38-43, `iron-undermesh` (36) follows the 740 s farm (45), `wedge-rivets` (49) and `decarbonization` (50) follow the 840 s farms (52-55), `insulated-helm` (51) follows the 942 s and 960 s farms (56-63). Every research still follows `build kings-palace` (27).
- `data/aoe4-build-order/builds/english-1tc-council-hall.json`: order 0-32, 34, 35, 33, 36, 40, 41, 42-46, 37, 38, 39, 47, 51-55, 48, 49, 50, 56-60. Effect: `iron-undermesh` (33) follows the 690 s mining camp and move (34, 35); `bloomery` and `fitted-leatherwork` (40, 41) follow The White Tower (36); the 900 s farms (42-46) precede `fertilization`, `veteran-longbowmen`, `veteran-spearmen` (37-39); then `decarbonization` (47); `lumber-preservation`, `textiles`, `specialized-pick` and the last two farms (51-55) precede `insulated-helm`, `balanced-projectiles`, `wedge-rivets` (48-50).
- `data/aoe4-build-order/README.md`: the Council Hall entry lists the new order as a transcription choice (its "Added after the guide" paragraph currently describes the old order: "then `fertilization`, `veteran-longbowmen`, `veteran-spearmen`, `bloomery` and `fitted-leatherwork`", "then the Castle blacksmith techs, `lumber-preservation`, ..."). The Knight/Longbow entry's sentences about where the blacksmith techs sit ("come after `build kings-palace`", "`veteran-longbowmen` and the Castle blacksmith techs ... follow `produce knight`", the farm-block sentences) are checked against the new order and corrected where they no longer hold. Scope names the statements, the implementer writes the wording.
- Tests: `lib/aoe4-build-order/research.acceptance.test.ts` "holds 20 tier-2 longbowmen just before completion and moves them all to tier 3 at it" (Knight/Longbow) is re-pinned to the counts the engine now returns; the design measured that only its counts move and its completion stays in (840, 845]. No other test changes its assertions; a test outside this one that fails is a defect to explain, not to re-baseline. Floors, the floating cap and bars in `builds.test.ts` and `production-floors.ts` are unchanged; a floor, cap or bar failure stops the ticket and goes in the report.
- Acceptance specs that load these builds must pass: `aoe4-simulate-api-knight-longbow-build`, `-prebuilt-plans`, `-prebuilt-farms`, `-veterancy-conversion`, `aoe4-marker-labels`, `aoe4-build-order-knight-longbow-page`. An assertion that moves is updated to the new value and named in the PR (the design expects none).

**Out of scope:** the busy-building rule and the Spear/Longbow build edit (later ticket); any engine, API or UI change; changing floors, caps or bars; adding, removing or retriggering steps.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The step sequence of each edited build, read by step content, equals the order above; the multiset of steps in each file is unchanged (nothing added, removed, or modified), checked in the implementer's report by comparing the files at the base and the branch.
- [ ] Every `builds.test.ts` case passes unchanged for every prebuilt build, including each floor, the floating-resource cap and the no-waiting bars at their existing horizons.
- [ ] The re-pinned "holds 20 tier-2 longbowmen ..." test still asserts the completion time lies in (840, 845] and that all tier-2 longbowmen move to tier 3 at it, with the counts the engine returns now (recorded in the report); it fails if the tier conversion stops moving the whole stock.
- [ ] No other unit test changes an assertion; the implementer lists every test file edited.
- [ ] The acceptance specs named in Scope pass.
- [ ] No data README entry describes the old Council Hall research order or places a Knight/Longbow blacksmith tech where it no longer sits; the Council Hall entry names the reorder as a transcription choice.
- [ ] No INVARIANTS.md regressions

## Open questions

none
