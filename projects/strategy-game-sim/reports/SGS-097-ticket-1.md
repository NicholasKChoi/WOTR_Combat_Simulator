# SGS-097 ticket author report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-097-docs-and-issue-messages.md

Title: Clarify OpenAPI issue wording and truncate long object keys in issue labels. Component aoe4-build-order, Type Task, Priority low, Risk standard, Depends on none, size about 15 business-logic lines plus OpenAPI JSON and doc wording. Milestone: none. Diagrams: none required (single-component, outside the core loop).

## Item verification against origin/main 9274372

1. M4.md step-table rows: still apply, but only in `design/M4.md` (state dir). `docs/aoe4-build-order.md` does not repeat them: it already says an English order needs `start.rally`; no doc or README contains "civ default" or "Add the pair". So no code-repo change; the replacement wording for both cells is in the ticket's On merge field. Not in Scope.
2. OpenAPI wording: applies. `BuildOrderIssue.message.description` says "naming the step and the offending id, kind or property"; the simulate 400 description does not list the two request-level messages (they appear only in examples). Same loose wording in docs/aoe4-build-order.md Validation ("A message names the step or line"), included.
3. Long key in path: applies, with one correction to the premise. An issue has no separate `path` field; the path is only the prefix of `message` (`checkSimInputs` joins `['inputs', ...found.path]`). A second site has the same flaw: `startVillagersSchema` builds `start.villagers.<node>` from the raw key. Decision in the ticket: truncate both with `shortText` (same 40 chars plus `...`). Response shape is unchanged; only message text for keys over 40 chars. Flagged in Risk and why standard rather than high.

## Overlap
No overlap found with open tickets by name; the ticket touches `schema.ts` and `schema.test.ts` (quoted-ids table SGS-091 added), so any open PR editing that table would conflict mechanically. I did not check open PRs.

## Checks run
Ran the one search criterion (`git grep "naming the step and"`) against origin/main: matches only the openapi.json description, as Scope implies. No mutation criterion applies to existing code (the test table is new; the mutation is described as reverting the new `shortText` calls). I did not work in a worktree.

## Open questions
None.
