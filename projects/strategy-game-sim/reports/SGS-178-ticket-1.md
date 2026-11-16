# SGS-178 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-178-remove-unreferenced-named-build-version.md

Summary: Chore, aoe4-build-order, risk low, about 2 lines. Grep at origin/main (code, tests, acceptance/, docs, ARCHITECTURE.md, openapi) found only the definition of `NAMED_BUILD_VERSION`, and the named-build shapes have no version field. End state: remove it. Using it would add a field to a stored and public shape, which is a design decision. Criteria: export gone (typecheck proves it), pre-existing tests unchanged, no other line edited.

Diagrams: none (one-line statement). Open questions: none. Lint: passed.
Overlap: SGS-176 (doc comments on every lib export) adds a comment above this constant if it merges first. SGS-178 deletes that comment too, and the ticket says so. No dependency needed. No scratch checkout made.
