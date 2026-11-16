# SGS-169 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-169-effect-not-simulated-debug-severity.md

Summary: Chore, aoe4-build-order, standalone (Milestone none), priority low, Risk standard (the API `Severity` enum gains a value, a public surface). About 40 business-logic lines. Depends on none. Adds `debug` after `info` in `lib/aoe4-build-order/model.ts`, emits both research notes at it in `research.ts` `researchNotes`, hides `debug` from the page in `components/apps/aoe4-build-order/messages.ts` `resultMessages`, and updates `docs/api/openapi.json`, `docs/aoe4-build-order.md` and the tests that pin `info`. Criteria cover the note severity over all techs, the `SEVERITIES`/OpenAPI agreement, the page hiding debug, the API still returning the notes, and unchanged timing and cost.

Diagrams: none (single-component, one-line sentence).

Open question (owner): does the page need any way to reveal `debug` messages, or hide them entirely? Scope assumes hidden entirely.

Notes:
- The ticket is typed Chore as instructed, but the change is visible to the owner (notes leave the info list) and to API clients (new severity value). Scope says so openly rather than claiming no visible change.
- Backlog line refs (`research.ts:105-123`, `research.test.ts:640-641`) were checked at origin/main; the test is now at about 646-654.
- No overlap found with open tickets. BACKLOG.md and the graph were not edited.
- Criteria name no search or computed commands, so no run-checks were needed. Lint passed.
- No scratch checkout was made.
