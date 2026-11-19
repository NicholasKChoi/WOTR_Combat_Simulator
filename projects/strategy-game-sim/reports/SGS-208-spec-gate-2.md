# SGS-208 spec gate (report 2)

Ticket: `tickets/SGS-208-repeat-a-build-or-move-step.md`. Risk high. Read at `origin/main` (fetched). No dependencies.
`ticket-lint.py` ran clean (exit 0, no errors or warnings).

## Verdict: NEEDS_SPEC

The design agrees with the ticket (C1, C2, C4), the code seams exist as described, and the hotspots have failing-test criteria. Four gaps remain. Each one makes an implementer either break the ticket's own rule "every other test keeps its assertions" or guess.

## Gaps

1. **Existing tests - tests that enumerate `SIM_INPUT_BOUNDS` are not covered by the Scope rule.** Adding `SIM_INPUT_BOUNDS.repeat` breaks two tests the ticket does not name, and the "Existing tests, by rule" bullet covers only the key lists of `StepTiming` and of the optional step fields.
   - `lib/aoe4-build-order/schema.test.ts` (around line 959, the bounds test) pins a closed `rows` list and `expect(listed).toEqual(rows)`. It fails the moment `repeat` is added, and also depends on where in the object `repeat` sits.
   - `acceptance/aoe4-simulate-api-contract.spec.ts` ("bounds match SIM_INPUT_BOUNDS") has `locations: Record<keyof typeof SIM_INPUT_BOUNDS, ...>`. A missing `repeat` key is a type error. Its per-bound loop requires a non-empty location list that is `integer` 1..200 in the OpenAPI document.
   - Why an implementer guesses: the ticket says any other assertion keeps its expected value, which contradicts these two edits. It does not say where `repeat` goes in the object or which OpenAPI schemas `locations.repeat` points at.
   - Fix: extend the rule to "every test that enumerates `SIM_INPUT_BOUNDS` gains `repeat` (integer, 1..200)". State that `locations.repeat` is the `repeat` property of the `BuildStep` branches that declare it, and that `repeat` is appended after `count`/`instance`, or wherever the implementer chooses, with the row list matching.

2. **OpenAPI scope omits two things the change makes untrue.**
   - `StepTiming` gets `source` and `copy` in `required`, but the response examples in `docs/api/openapi.json` that carry `StepTiming` entries (at base: the `steps` arrays near lines 695-710 and 1732-1774) lack them. The contract spec "every example validates against its schema" fails unless they gain both fields. Scope does not name the examples.
   - The `step` descriptions become wrong. `StepTiming.step` reads "0-based index into buildOrder.steps", and `BuildOrderNote.step` ("0-based index of the research step"), `step-stuck.step` ("0-based index of the waiting step") and the `warnings` description ("step-stuck by step") also point at submitted steps. Scope names only "descriptions that state a 200-step limit or 'one StepTiming per step'".
   - Fix: add to the OpenAPI bullet "every `StepTiming` in the response examples gains `source` and `copy` (valid under the schema)", and "descriptions of `StepTiming.step`, `BuildOrderNote.step` and `step-stuck.step` say the index is into `steps` of the result (the expanded order), not `buildOrder.steps`".

3. **Expanded cap: which other issues suppress it is ambiguous.** The ticket says the cap issue is not reported "when a field issue exists elsewhere in the order". The existing tier-3 guard `failed('steps')` in `withCrossChecks` ignores tier-2 issues (`scope: 'cross-field'`) and does not look at `start` issues.
   - An order with `repeat` on a `research` step (tier-2 `invalid`) that also expands past 200 could yield either one issue or two. The same holds for a `start` field issue.
   - Why an implementer guesses: both readings fit the text, and the criteria test only "a field issue on another step".
   - Fix: state the rule, for example "same condition as `crossStepProblems`: skipped when any step has a field issue (the `failed('steps')` condition); a tier-2 `invalid` issue or a `start` issue does not suppress it". Add a `schema.test.ts` row for the `repeat`-on-research plus over-200 case showing the expected issue list.

4. **Criterion "a shipped build's result is unchanged apart from the two fields" has no baseline.** A test written after the change has nothing to compare the old result to.
   - Fix: replace it with a checkable property. For every shipped build, `result.steps.length` equals the written step count and `source === step` and `copy === 1` hold for every entry. The existing shipped-build assertions (floors, `data.acceptance.test.ts`) pass with only the two fields added to the literals they build.
   - Also clarify "an equal result object" in the `expandRepeats` no-repeat case. It reads as the expanded order deep-equalling the input order. If it means the simulation result, say so.

5. **Docs made untrue or incomplete, not named in Scope.**
   - `docs/aoe4-build-order-format.md`: the step table rows for `build` and `move` (add `repeat?`, valid only on those two); the `invalid` rule list (the new `repeat` rule); the Outputs `notes` bullet (`step` now indexes the expanded order).
   - `docs/aoe4-build-order.md`: the bounds table has a row for every `SIM_INPUT_BOUNDS` entry except the new one. Add `repeat` (int, 1..200, once), or the table is stale. Scope names only "the 200-step cap sentences".
   - Fix: name these statements in Scope, as is done for the others.

## Checks that passed

- Grounded scope: `schema.ts` (`common`, `crossFieldProblems`, `withCrossChecks`, `rankOf`, `OPTIONAL_STEP_FIELDS`), `simulate.ts` (`createEngine`, `runRefs`, final `waitingOn` loop, `stepStuckWarning`, `researchNotes`), `model.ts` `StepTiming`, and `step-table-model.ts` `FIELD_LABELS` all exist as described.
- A `['steps']` path sorts at rank 4 (`ORDER_KEYS.indexOf('steps') + 1`). `toOrderIssue` gives label `steps` with no step or line, so the C1 message `steps: <n> steps after repeats, more than 200` composes correctly.
- Interim-state claim holds: `saved-builds.ts` `roundTripIssues` returns the "reopening it as text would change the build" 400 while `formatAction` does not print `repeat`.
- Written >200 steps: the existing array issue has scope undefined, so `failed('steps')` stops the expanded-cap check.
- Contracts match design C1, C2 and C4. The message wording of the two quoted texts has a design source.
- Risk `high` is right (`simulateBuildOrder` is a criticalPath symbol and its behavior changes).
- Hotspots: expand-first and every later use (equivalence, `waitingOn` loop, notes index, stuck copy `n` and message), the expanded count versus written count, issue location on the submitted index, and no mutation of the input each have a named failing-test criterion. No irreversible action.
- No throwaway work against SGS-209, SGS-210 or SGS-211 (the OpenAPI version bump is identical to SGS-209's, which the ticket states).
- Unverified assumptions: none is right (no external service). Invariants A3 and S3 are named. Input validation: one `count('repeat')` field, within the zod threshold. On merge `none` is correct.

## Notes (non-blocking)

- The ticket says the "has no label beyond those fields" test fails once `repeat` is in `OPTIONAL_STEP_FIELDS` without a label. Only "labels every field a row can render" fails then. The 19-count test fails once the label is added and needs updating to 20, which Scope's rule already covers.
- The "not reached and waiting copies" criterion combines two orders (a waiting copy with `earlier-step` followers, and a cursor copy never armed with `trigger`). Say it is two cases so the implementer does not look for one order that shows both.
