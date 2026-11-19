# SGS-209 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-209-rename-api-patch-named-builds.md

Summary: Feature, aoe4-build-order, M12 (M12.2, M12.3), risk standard, ~110 business-logic lines, Depends on none. Adds PATCH
named-builds/{id} (`renameNamedBuild`) per design C8: check order, body rules, name-only write, 200/412/405 behavior, plus the
`renameNamedBuild` client (C9), `patchNamedBuild` acceptance helper, OpenAPI PATCH path with 2.7.0 bump and updated 405 Allow
and examples, format doc and lib README fixes, and switching the two existing PATCH-as-disallowed tests to POST (planner rows 2 and 9
as stated). On merge adds the CONTEXT.md Key surfaces `renameNamedBuild` line.

Diagrams: none (single-component line).
Open questions: none.
Overlap: A (repeat) makes the identical `info.version` 2.7.0 bump; no dependency, second to land rebases. No scratch checkout used.
Criteria commands: none name a runnable command; ticket-lint passed with no output (no errors or warnings).
Notes: openapi.json has PATCH-405 example messages on the get, update and delete operations ("use GET or PUT or DELETE") that Scope
covers; ARCHITECTURE.md route-logic row names no methods, so Scope says check only.
