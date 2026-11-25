# SGS-218 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-218-fight-api-spec-pinned-schemas.md

Summary: Bug, standalone, Priority low, Risk low, component wotr-combat-simulator, 1 LOC, no dependencies. Add `RenameNamedBuildRequest` to `AOE4_SCHEMA_NAMES` in `acceptance/fight-api-spec-surface.spec.ts`. Confirmed at origin/main that `docs/api/openapi.json` defines it (components.schemas) and references it from the rename operation, and that the pinned list lacks it. The only other whole-set pin found is this one test. Criteria: the test passes (fails at base naming the schema), the exact-set check is unchanged, and the rest of the spec and openapi.json are untouched.

Diagrams: none. Open questions: none. Overlap with other tickets: none. Docs line points at `docs/api/openapi.json`.
I did not run the acceptance test; the root cause was established by reading the code and comparing schema key sets.
Lint: ticket-lint with --graph and --spec printed no errors or warnings.
