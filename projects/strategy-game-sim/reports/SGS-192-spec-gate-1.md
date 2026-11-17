# SGS-192 spec gate 1

Ticket: `tickets/SGS-192-record-what-a-waiting-step-waits-for.md`. Code read at origin/main (87f0cd7); SGS-190 and SGS-189 have no branch, so SGS-190's end state is taken from its ticket (SGS-190 is `needs_spec` in TASK-GRAPH; if its re-spec changes check 4/5 or `held`, re-check the busy rows here). No scratch checkout was made.

## Verdict: NEEDS_SPEC

## Gaps

1. **Scope / Tests, existing-test rule** - Two existing tests pin closed lists that the ticket's new names break, and Scope's rule ("fixture and shape edits only") does not cover them. The implementer would either fail the "no changed assertion" criterion or guess.
   - `lib/aoe4-build-order/data.acceptance.test.ts` "model.ts exports exactly the 26 documented types and the shared lists" matches every `export type|interface` in `model.ts` and `toEqual`s a sorted list. Adding `StepWaitDetail`, `StepWaitEntry` and `BreakdownReason` fails it. The "26" in its title is also a stale pin.
   - `acceptance/fight-api-spec-surface.spec.ts` "has exactly the pinned fight and AoE4 schema names and no others" compares `Object.keys(schemas)` with `AOE4_SCHEMA_NAMES`. The new OpenAPI schemas `StepWaitDetail` and `StepWaitEntry` fail it. This spec is not in the ticket's named acceptance run.
   - Proposed fix: add to Scope the rule "a test that pins the set of `model.ts` type exports or of OpenAPI schema names takes the new names and nothing else; the title count is dropped or made to derive from the list". Name both files as examples. Add `fight-api-spec-surface.spec.ts` to the acceptance run. In the contract spec, put `StepWaitEntry` (closed, every property described) in `RESPONSE_SCHEMAS` and say each `StepWaitDetail` variant carries a description. That spec's "every oneOf variant has a description" convention requires it for the new schemas.

2. **Acceptance criteria, busy-building sample** - "`produce scout from capital-town-center x1` at 10 s then `produce villager` waits 10 s" has no source for 10 s. The design's acceptance sample for the same order says step 2 waited 23 s under `prerequisite`. The parenthesis ("pins the seconds the engine returns once the order is set") contradicts the stated 10. The implementer must either follow a guessed number or contradict the design. Proposed fix: state the property instead. The step waits under `prerequisite`, `waitDetails` is exactly one `building-busy` entry for `capital-town-center` with `every: false`, and its seconds equal `waitBreakdown.prerequisite` and `waitSeconds`. The test first asserts that those seconds are above 0.

3. **Acceptance criteria, `constructing`** - "the engine compiles with no `as Engine` cast for it (the typecheck proves it)" is false: a leftover `(state as Engine).constructing` still compiles once the field is on `EngineState`, so the typecheck cannot fail on it. Proposed fix: keep the test that gives `ageWait` an `EngineState`-typed value with `constructing` set. Drop the typecheck claim, or require that `Engine` no longer declares `constructing` (reviewer reads the diff).

4. **Docs** - `lib/aoe4-build-order/README.md` lists each module (line ~50 `simulate.ts`, ~52 `engine-common.ts`, ~64 `landmarks.ts`) and says (~154) a new step action needs "an entry in `stepHandlers`". A new `wait-detail.ts` module and the new rule that every handler failure names its `detail` make that README incomplete. It is not in Scope. Proposed fix: add to Scope a README entry for `wait-detail.ts` and a clause in the new-step-action line that the handler's `started: false` returns carry `detail`.

## Notes (non-blocking)

- The browser-safety criterion ("a unit test fails if it value-imports from any module outside ...") is a source scan. It is a test, and `data.acceptance.test.ts` already does the same kind of scan, so it can stay. Prefer a check on the module's import lines over a grep of the whole file.
- SGS-191 also edits `model.ts`, `docs/api/openapi.json`, the contract spec's `Record<keyof ...>` literals and the same exports-list test. Whichever lands second must rebase on those lines. This is not a dependency problem, but the two PRs touch the same assertions.
- The docs wait-reasons table (`docs/aoe4-build-order-format.md` ~line 465) says "An action with no handler always reports `prerequisite`". The ticket makes that path emit a `null` detail, so B-W9 holds only while every `BuildStep` action has a handler. It does today: produce, rally, pause, build, research and move are all registered. The doc rewrite can say so in one clause.
- Checks that passed on reading the code:
  - Every named symbol exists (`accrueWait`, `Engine.constructing`, `canAffordHeld`, `heldNeed`, `RESOURCE_TOLERANCE`, `AGE_NAMES`, `isLandmark`, `researchTarget`, `researchHandler`, and the `started: false` returns at simulate.ts 397/400/404/490/493/497/507/536 and research.ts 48/52/56).
  - `waitBreakdown` is retyped with the same values.
  - Risk `high` matches the template (public API field, handler rewrite).
  - Invariants A1 to A3 are named and not contradicted.
  - Diagram is present. On merge is `none`. Open questions are none, and PROJECT.md Decisions is empty.
  - `wait-detail.ts` is browser-safe in the stated sense (`engine-common.ts` and `landmarks.ts` have only type imports beyond `model.ts`, `effects.ts` and `./data` types).
  - No input-validation trigger and no overlap with another open ticket beyond the declared SGS-190 dependency.
- `step-annotation.test.ts` line 19 builds `waitBreakdown: []` and `step-annotations.test.ts` `timing()` builds a full `StepTiming`. The second needs the two fields because `tsc` will demand them, which Scope already allows.
