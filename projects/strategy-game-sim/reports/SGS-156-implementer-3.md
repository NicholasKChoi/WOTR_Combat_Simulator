# SGS-156 implementer 3 (after re-spec 5)

Status: **needs_review**

- Ticket: SGS-156 (auto-houses plan ahead for wood). Type Bug, risk high.
- Branch: `sgs-156-auto-houses-plan-ahead`, base origin/main (branch forked at e50e074; origin/main is now c5bd608).
- Tip: 411dfb3c05acbc42d9ca1f5f7dffaef389dae588 (3 commits: 8528302, ff47225, 411dfb3)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-156-auto-houses-plan-ahead
- Not rebased. `git merge-tree --write-tree origin/main HEAD` merges cleanly. The new main commits touch only `acceptance/aoe4-results-split.spec.ts` and `lib/combat-simulator`.
- Everything in Scope 1-9 is unchanged from ff47225. See reports/SGS-156-implementer-2.md for that work: tests, mutation checks, doc claims, the bug regression, and the edited pre-existing tests.

## This pass (Scope 10)

### Measured floating at 1200 s

Measured with default inputs and `durationSeconds: 1200`, using a throwaway vitest file. The file was deleted and never committed.

| Build | food | wood | gold | stone |
|---|---|---|---|---|
| ENG 1TC | 1538.69 | 2511.69 | 853.17 | 0 |
| ENG Spear/Longbow into MAA/Crossbow | 1516.57 | 1937.40 | 356.29 | 0 |
| ENG Knight/Longbow (King's Palace) | 383.40 | 1954.42 | 11.14 | 0 |
| ENG 1TC Council Hall | 1787.46 | 2219.55 | 1626.12 | 0 |

Every value is at most 2600, so the needs_spec stop rule does not trigger.

### Files touched this pass

- `lib/aoe4-build-order/production-floors.ts`: `MAX_FLOATING_AT_1200` changed from 2000 to 2600. No floor was lowered and no build data was changed.
- `data/aoe4-build-order/README.md`: reworded two sentences that claimed the wood does not float (details below).

### Grep for the cap value and its reasoning

- No doc, comment or test quotes 2000 as the cap. `production-floors.test.ts` uses the constant by name and needs no edit.
- `docs/aoe4-build-order.md` "Prebuilt builds" says "that file's cap". It is unchanged and still true.
- README line 62, "a build that starves its production or leaves its economy unspent fails", is unchanged and still true at the higher cap.
- README line 84 (ENG 1TC section) was changed.
  - Before: "the extra buildings let the farmed food and the wood go into spearmen and longbowmen instead of floating."
  - After: "the extra buildings spend the farmed food and part of the wood on spearmen and longbowmen."
  - Why it is true: ENG 1TC floats 2511.69 wood at 1200 s (table above), so only part of the wood is spent.
- README line 168 (ENG 1TC Council Hall section) was changed.
  - Before: "Past the population cap the economy's income goes into these techs instead of floating."
  - After: "Past the population cap these techs spend part of the economy's income, and the rest floats."
  - Why it is true: Council Hall floats 2219.55 wood, 1787 food and 1626 gold at 1200 s, after it reaches the population cap at about 1110 s.
- README line 119 (Spear/Longbow) is not changed: "The extra buildings and farms are there so the economy's food, wood and gold are spent on units instead of floating." It states what the buildings are for, not that nothing floats. That build stays under the old 2000 cap (wood 1937). The spec-gate note named this line, and I judged it outside the ticket's "reword only if they claim no wood floats" rule.

## Tests

- `npm test`: 2583 passed, 0 failed, 15 skipped (85 files). The two floating-cap failures from implementer-2 now pass.
- No pre-existing test was edited in this pass.

## Mutation check

I set `production-floors.ts:30` to 2500, which is below the measured 2511.69. `builds.test.ts` > "prebuilt build ENG 1TC" > "meets its production floors and keeps its floating resources under the cap at 1200 s" then failed with `floating wood: expected 2511.6867666638495 to be less than or equal to 2500`. I restored the value to 2600 before committing.

## Codegen, build, lint

- codegen: not set.
- build (`link-node-modules && npx next build`): passed.
- lint (`npx tsc --noEmit && npm run lint:dup`): no type errors and 0 clones.
- The tree was clean after the commit. The build changed no stray files.

## Acceptance

`acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts` uses the same `productionChecks` and constant. I did not run it, since only acceptance-test runs Playwright. The unit twin passes for all four builds.

## Invariant check

- This pass changes a test cap and README text only. It does not touch A2 or A3 code paths.
- The A2 and A3 analysis for the engine is in implementer-2 and still holds.

## Unverified assumptions added

None.

## Changelog

No changelog file exists on main. The PR description must say that every saved build's simulated result shifts (Scope 9). It should also say that the floating cap at 1200 s rose to 2600.

## Out-of-scope findings

None new. The note in implementer-2 still stands: the fixture test is guarded by three independent mechanisms, so it does not pin any single one of them.

## Processes

The only processes started were the build and vitest, which ran in the foreground and have exited. No servers were started.
