# SGS-057 implementer report 1

- Ticket: SGS-057-aoe4-zod-schema-text-to-build
- Branch: sgs-057-aoe4-zod-schema-text-to-build (base origin/main 54d7e90)
- Tip: c207726ecaed379b2cd77dcdcb2e94adf7c7b172
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-057-aoe4-zod-schema-text-to-build

## Files
- package.json, package-lock.json: add zod ^4.6.7 (lockfile adds only the zod entry)
- lib/aoe4-build-order/schema.ts (new): catalog, zod shapes and refinements, checkBuildOrder, checkSimInputs, resolveSimInputs, nearestId, SIM_INPUT_BOUNDS, INPUT_DEFAULTS, OPTIONAL_STEP_FIELDS, nodeRefIssue, and the shared helpers moved out of validate.ts
- lib/aoe4-build-order/text-to-build.ts (new): TextToBuildResult, textToBuildOrder
- lib/aoe4-build-order/validate.ts: moved code deleted; imports from schema.ts and re-exports SIM_INPUT_BOUNDS, nodeRefIssue, resolveSimInputs and NodeRefProblem
- lib/aoe4-build-order/step-options.ts: `names` (lowest-age display name per listed building, produced unit and tech)
- lib/aoe4-build-order/model.ts: `suggestion?: string` on BuildOrderIssue
- docs/api/openapi.json: `suggestion` on the issue schema
- acceptance/aoe4-simulate-api-contract.spec.ts: `suggestion` added to the issue's optional-key list and record
- lib/aoe4-build-order/schema.test.ts (new), text-to-build.test.ts (new), step-options.test.ts (new describe)

## Tests
- schema.test.ts 146, text-to-build.test.ts 11, step-options.test.ts 8: all pass
- npm test: 42 files, 1234 passed, 8 skipped, 0 failed
- They cover: shape errors as syntax with exact messages; trigger-kind suggestions (soon: none; tme: time); ids, bounds and cross-field rules; rejected techs and how each is classified; rally-source cross-step rows; repeated research; issue ordering (civ, name, start, steps in field order, cross-field, then cross-step after every step); gating (a bad field hides cross-field rules, a bad step hides cross-step rules, a bad start hides start rules); line labels; purity (A3); the step cap 200/201; unknown keys dropped; OPTIONAL_STEP_FIELDS agrees with the schema; nearestId (match, case, tie goes to the earliest, threshold, empty list); checkSimInputs defaults, merge, 59/60/3600/3601, every-issue order, non-object, and that it equals resolveSimInputs; the bounds and defaults literals; the catalog is deterministic and survives JSON; defaultStart; names.knight; every listBuilds() build is ok and unchanged; textToBuildOrder paste cases with lines, parse failure unchanged and without lines, 20000 accepted, 20001 rejected before parsing, repeat calls equal, the knight/longbow paste returns ok.

## Pre-existing tests edited
- step-options.test.ts: added `describe('stepOptions names')`. No existing assertion changed. Scope adds `names` to StepOptions.
- acceptance/aoe4-simulate-api-contract.spec.ts: `suggestion` added to the optional-key list and the issue record. The ticket requires the contract to carry the new optional field. No other assertion changed.

## Mutation checks (each failed the named tests, then was reverted from a backup)
durationSeconds max 3601; names find->findLast; nearestId threshold +1; tie `<`->`<=`; dropped lowercasing; text cap `>`->`>=`; lines dropped from the check; start gate removed; steps gate removed; cross-step rank equal to step rank; ORDER_KEYS reordered; suggestion dropped; defaultStart rally dropped; rally walkSeconds removed from OPTIONAL_STEP_FIELDS; step cap `>`->`>=`; cross-field rules dropped; rejectedTechs code forced; trip merge dropped; influenceCoverage default merge dropped; `value ?? {}` dropped; nodeAmounts null rejected; resolveSimInputs altered; rally instance check dropped; produce-rally source dropped; start rally ignored; villagerProducers filter dropped; z.object->looseObject. The rejectedTechs mutation first survived (the test compared the catalog with itself), so I added an explicit classification test, which now catches it.

## Stages
- tsc --noEmit clean; lint:dup 0 clones (one test-vs-source clone of the bounds literal was fixed by rewriting the test as rows)
- npm ci && next build OK
- npm run acceptance: 551 passed
- Acceptance greps: the five definitions are only in schema.ts; no zod/v3; no value import of ./data, fs or node: in schema.ts or text-to-build.ts

## Invariants
- S3: SIM_INPUT_BOUNDS and the 20000 text cap are defined once in schema.ts. textToBuildOrder enforces the cap and the step cap. The route is unchanged.
- A1: game numbers come from the catalog/data (startVillagerTotal, defaults, rejectedTechs, names). Only the request bounds and INPUT_DEFAULTS are literals.
- A3: checking is pure, and the tests assert that repeat calls give equal results.

## Deviations / for review
1. The catalog carries two fields beyond C2: `units` (all unit baseIds, used for unknown-unit suggestions) and `inputDefaults` (trips, walkSeconds, nodeAmounts), so checkSimInputs needs only the catalog.
2. `''`: the ticket says textToBuildOrder('') returns what parseBuildOrderText('') returns, but C4a parses and then checks. The empty order has no start.rally while capital-town-center produces villagers, so it gets `{ok:false, issues:[start: no start.rally ...], lines:{steps:[]}}`. validateBuildOrder gives the same today. I kept C4a and assert the check of the parsed order. The ticket text needs a fix if the manager agrees.
3. An unknown action hides that step's trigger issues.
4. defaultStart = the nonzero villager split, with rally on the busiest node when the civ starts with a villager producer.
5. Cross-step issues sort after all field and cross-field issues of every step.
6. A bad start field also hides the start no-rally rule (the ticket's gating rule). Unlike validate.ts, cross-field and cross-step rules are now gated.

## On merge
REPO.md `schemaLibrary: zod`. CONTEXT.md Key surfaces: schema.ts (checkBuildOrder, checkSimInputs, buildOrderCatalog) and text-to-build.ts (textToBuildOrder).

## Out-of-scope findings
- The raw unitsByProducer map in step-options included siege-tower under siege-workshop, though it is not producible there. `names` uses the final producers' units. The existing unitsByProducer output is unchanged.

## Status
needs_review
