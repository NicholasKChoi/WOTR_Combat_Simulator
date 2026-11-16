# SGS-173 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-173-move-storage-essay-out-of-architecture.md

Summary: Docs ticket, component aoe4-build-order, Milestone none, Risk low (CONTEXT.md names neither ARCHITECTURE.md nor a storage contract as authoritative), about 60 doc lines, no dependencies, On merge none. Scope: add a `## Storage` section to `docs/aoe4-build-order.md` directly after Route, move every behavior of the "AoE4 saved-build storage" row there, cut that row to one line (files and roles, keeping the `@vercel/blob` import boundary), and cut the "AoE4 route logic" row to files, short roles and placement rules. Criteria cover completeness of the move, no rule change, claims checked against the store code, no duplicate description, and docs-only.

Diagrams: none (single-component, no diagram).
Open questions: none. The placement (Storage next to Route) is stated by the backlog item. The route-logic trim ("past a few lines") is left to the implementer within the rule that no fact is lost.
Overlap: the BACKLOG item that splits `docs/aoe4-build-order.md` moves Route into a format doc. SGS-173 handles it with a rule (Storage goes after wherever Route is). No dependency was added. Whichever ticket merges second rebases around the other's doc edits.
Lint: ticket-lint.py passed with no output. No scratch checkout was made; I read origin/main via git show. Nothing was run besides reads, grep and lint.
