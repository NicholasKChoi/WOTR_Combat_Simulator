# SGS-192 ticket re-spec 2 (Re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-192-record-what-a-waiting-step-waits-for.md
Verified against origin/main 87f0cd7. ticket-lint.py: clean.

## Summary

SGS-192, "Record what a waiting step waits for (`waitingFor`, `waitDetails`)", aoe4-build-order, Feature, M11, risk high, about 300 business-logic lines, depends on SGS-190. Every gap from spec-gate 1 is folded in:

1. Pinned name lists: Scope gains a rule. A test that pins the closed set of `model.ts` type exports or of OpenAPI schema names takes the new names and nothing else, and a count in its title is dropped or derived from the list. Examples: `data.acceptance.test.ts` "model.ts exports exactly the 26 documented types ..." and `fight-api-spec-surface.spec.ts` `AOE4_SCHEMA_NAMES`. Contract spec: `StepWaitEntry` joins `RESPONSE_SCHEMAS`. `StepWaitDetail` is a `oneOf`, so it goes in `SHARED_SCHEMAS` and the description loop, the way `SimWarning` does. `RESPONSE_SCHEMAS`' closed check reads the top-level `additionalProperties`, so a oneOf placed there would fail. A variant check like SimWarning's (closed, every property required, tagged by `kind`) covers its variants. `fight-api-spec-surface.spec.ts` is added to the acceptance run. A new criterion covers all of this. The "No timing changes" criterion now allows the name-list edits.
2. Busy sample: the unsourced 10 s is gone. The criterion is now a property. The step waited more than 0 s under `prerequisite` (asserted first). It has exactly one `building-busy` entry for `capital-town-center` with `every: false` and `instance: null`, and its seconds equal `waitBreakdown.prerequisite` and `waitSeconds`.
3. `constructing`: the typecheck claim is dropped. `Engine` no longer declares the field, and a test gives `ageWait` an `EngineState`-typed value. Scope notes that a leftover cast still compiles because `Engine extends EngineState`, so review reads the diff.
4. README: Scope and a criterion now cover `lib/aoe4-build-order/README.md`. The module list gains `wait-detail.ts`. The new-step-action line must say that failed starts carry a `detail`.

Notes folded in:
- The browser-safety test checks the module's import lines instead of grepping the whole file.
- Scope records the SGS-191 overlap: the same name lists, the same `Record<keyof ...>` literals and openapi.json.
- The format doc's "An action with no handler always reports it" gets a clause that every `BuildStep` action has a handler (B-W9).

Busy-building wording matches design/M11.md C7e and the B-B rules, and SGS-190's current ticket text: a busy wait is `waitingOn: 'prerequisite'`, the produce check is check 5 and the research check is check 4. If the SGS-190 re-spec renumbers those checks, the references in Scope need a matching touch.

Diagrams: the existing read/act/record flowchart for `offerStep` and `accrueWait` is unchanged.

Open questions: none.

Overlap: SGS-191 touches the same test pins and openapi.json. It is a rebase conflict, not a dependency.

Verified at origin/main:
- the exports test title and regex
- `AOE4_SCHEMA_NAMES` and "no others"
- the `RESPONSE_SCHEMAS` and `SHARED_SCHEMAS` contents, the closed-schema check, the SimWarning variant check and the description loop
- the README module list and the new-step-action line
- the format doc's no-handler sentence
- `Engine.constructing` and the casts in `startConstruction` and `completeConstruction`

No scratch checkout was made.
