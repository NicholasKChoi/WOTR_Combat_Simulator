# SGS-208 ticket author, re-spec 1 (report 3)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-208-repeat-a-build-or-move-step.md
Mode: re-spec from reports/SGS-208-spec-gate-2.md. Read at origin/main d80751be. Risk high, so spec-gate re-runs; no self spec-check.
ticket-lint (with --spec, --graph): exit 0, no errors or warnings.

## Summary

"Repeat a build or move step: schema, expansion, simulator copies, OpenAPI 2.7.0". Component aoe4-build-order, M12, ~150 business-logic LOC, no dependencies. Covers M12.1/M12.3 server half: `repeat` field and bound, tier-2 rule, tier-3 expanded cap, `repeat.ts` expansion, `simulateBuildOrder` expanding first, `StepTiming.source`/`copy`, OpenAPI 2.7.0, docs. Diagram: the existing read/act/record flowchart of `simulateBuildOrder` (unchanged).

## Gaps folded in

1. **SIM_INPUT_BOUNDS enumerations**: the Existing tests rule now covers every test that enumerates `SIM_INPUT_BOUNDS` (examples: `schema.test.ts` "keeps the request bounds"; `acceptance/aoe4-simulate-api-contract.spec.ts` "bounds match SIM_INPUT_BOUNDS"). `repeat`'s position in the object is the implementer's choice and the row list follows it; `locations.repeat` is the `repeat` property of every `BuildStep` branch. A git grep found no other test enumerating the bounds (`aoe4-builds-api-contract.spec.ts` and `auto-run.test.ts` read only `durationSeconds`). New criterion "OpenAPI examples and bounds (respec 1)".
2. **OpenAPI**: Scope now names the simulate 200 response examples (`buildOrder`, `goldRunOut`). The contract spec checks each one against the live response for its request example, and those requests carry no repeat, so `source` = `step` and `copy` = 1. Scope also names each description the change makes untrue: `StepTiming.step`, `BuildOrderNote.step`, `step-stuck` `step`, `SimulationResult.steps`, the `warnings` "step-stuck by step" order, `SimulateRequest.buildOrder` and `BuildOrder.steps` 200-step text. New criterion "OpenAPI descriptions (respec 1)".
3. **Expanded-cap suppression**: the cap is skipped under the same condition as `crossStepProblems`, the `failed('steps')` check (an issue under `steps` with no scope). A tier-2 `cross-field` issue and a `start` issue do not suppress it. `expandedStepCount` counts every step's `repeat`. New criterion with two `schema.test.ts` rows: repeat on research plus an expansion over 200 gives both issues, cap first. A `start` issue plus an expansion over 200 still gives the cap.
4. **Shipped-build criterion**: now split out as "Unrepeated orders (respec 1)". For every `listBuilds()` build, the steps length equals the written count, `source === step` and `copy === 1`. Existing shipped-build and simulator tests pass with only the two fields added to the literals they build. The `expandRepeats` no-repeat case now says the returned `order` deep-equals the input order.
5. **Docs**: Scope names, in the format doc, the `build` and `move` table rows, the optional-keys sentences, the `invalid` rule lists, the tier list and issue order, the request sentence, and the Outputs `steps`, `notes` and `warnings` bullets. In `docs/aoe4-build-order.md` it names the bounds table (a new `repeat` row; the steps row now counts expanded steps) and the more-than-200 sentence. It also dropped a wrong claim from the first draft: that doc has no Outputs `steps` description and no step-stuck message row. New criterion "Docs (respec 1)".

Non-blocking gate notes also applied:
- The step-table-model line now says that only "labels every field a row can render" fails without the label. The test that pins the label count changes under the existing-tests rule.
- The not-reached criterion is now two cases with separate orders.

## Why the first draft missed these

The first draft searched the tests only by `StepTiming` keys, the optional-field lists and `info.version`, and the docs only by 200-step and "per step" wording. It did not search for every reader of the new `SIM_INPUT_BOUNDS` key, the response examples, or the `step` descriptions on the other result types.

## Open questions

none

## Overlap

None new. The OpenAPI 2.7.0 bump is the same as in SGS-209, as the ticket already states. SGS-210 and SGS-211 depend on this ticket and are untouched.
