# SGS-081 ticket author report 5 (re-spec 4)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-081-aoe4-retune-prebuilt-farms.md

## Summary
Re-spec 4 rewrites the ticket from "re-time farm steps" to "re-author every prebuilt build under one villager per farm",
per the owner decision. Component aoe4-build-order, risk standard, about 40 test lines plus three re-authored build
JSONs, README and docs. Depends on SGS-080 (stacked). Title and file name kept, as the graph has them.

## New scope
- Re-simulate and re-author english-spear-longbow-maa-crossbow, english-knight-longbow and english-1tc so each is a
  viable version of its README-stated plan: enough farms paid from the economy, villager allocation re-planned, and
  optionally more production buildings of the units the plan names. 1TC keeps its guide steps (0 to 23) and appends
  post-guide steps.
- New `PRODUCTION_FLOORS` case in builds.test.ts at 1200 s: unit floors (villager plus each named military unit), a
  minimum food gather rate, and `MAX_FLOATING_AT_1200` per resource. The same values checked through the API in
  aoe4-simulate-api-prebuilt-farms.spec.ts, whose spear "capping the farm rallies" section (MAX_SPEAR_LONGBOW_STEPS)
  is deleted.
- README entries rewritten to the rebuilt files (choices, not results; no floor numbers); design-doc bar paragraph
  extended; existing pins re-derived by the Scope 3 rule.

## Measurements behind the floors (vitest script against the build files, 1200 s, default inputs)
| Build | tip | villager | military | food/min | floating f/w/g |
|---|---|---|---|---|---|
| Spear/longbow | 2fc9593 | 60 | spear 3, longbow 6, MAA 1, xbow 9 | 354 | 28/10014/2313 |
| Spear/longbow | main 1bdf1d6 | 79 | 13, 11, 32, 21 | 2796 | 6299/3790/2309 |
| Knight/longbow | 2fc9593 | 79 | longbow 49, knight 31 | 1557 | 1427/1460/98 |
| Knight/longbow | main | 78 | 54, 31 | 1557 | 1428/1286/98 |
| 1TC | both | 54 | spear 36, longbow 45 | 283 | 39/9037/853 |
Proposed floors (owner to confirm) and the reasoning are in Scope 2 of the ticket. At 2fc9593 the new case would fail
for spear/longbow and 1TC and pass for knight/longbow.

## Checked criteria
- `git grep -c MAX_SPEAR_LONGBOW_STEPS -- acceptance` at 2fc9593: `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts:2`.
- README Prebuilt section `grep -cE '[0-9]+\.[0-9]+ s'` at 2fc9593: 0.

## Diagrams
None (single component, outside the core control loop).

## Open questions (owner)
1. The floor values and cap: proposed table plus MAX_FLOATING_AT_1200 = 2000 (alternatives 3000; floors at 70%).
2. May the rebuild add production buildings? Proposed yes; without them the cap cannot be reached by spear/longbow and 1TC.
3. 1TC: guide steps frozen, post-guide steps appended to meet floors (proposed), or exempt 1TC from the floors.

## Overlap
None with other open tickets. SGS-080 (PR 88) is the engine dependency; the knight-longbow-sheep-to-deer branch in
the main checkout may touch english-knight-longbow.json (not checked; manager should confirm).
