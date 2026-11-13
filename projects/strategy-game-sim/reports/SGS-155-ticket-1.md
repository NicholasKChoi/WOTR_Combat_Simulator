# SGS-155 ticket-1 (re-spec 1)

File: .claude/code-factory/projects/strategy-game-sim/tickets/SGS-155-aoe4-data-freshness-workflow.md. Lint passes.

Folded in both gaps and the notes:
- Tests live in lib/aoe4-build-order/ as .ts importing the .mjs; vitest include unchanged; criterion that they appear in npm test output.
- New side-effect-free shared module (repo, kinds, civ, filterEnglish, getJson with injectable fetch) imported by refresh-snapshot.mjs and the new check-freshness.mjs; refresh keeps behavior and usage line. Criterion: neither script defines those constants; imports have no side effects.
- "Content differs" = per-kind deep equality, order counts, source ignored. Latest commit via commits/HEAD, content fetched at that sha (criterion tests it).
- On merge adds the REPO.md babysit comment. LOC estimate 110. Risk low.

Diagrams: none required. Open questions: none. Overlap: none.
