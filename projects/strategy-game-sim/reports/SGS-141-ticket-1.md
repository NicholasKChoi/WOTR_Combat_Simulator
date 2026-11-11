# SGS-141 ticket report 1

File: `projects/strategy-game-sim/tickets/SGS-141-split-tab-order-spec-and-final-docs-pass.md` (ticket-lint clean).

Summary: "Add the split-layout Tab-order spec and close the M9 docs gaps". Component aoe4-build-order, Task, risk low, 0 business-logic lines (one acceptance spec of about 60 lines plus doc edits). Depends on SGS-130, 131, 132, 133, 137, 138, 139, 140 (128 and 134 to 136 and 129 are covered transitively). Covers M9.9: the Tab-order spec (design M9.9 row and "Tab order" rule: order across run bar, save row, Build column, Results column; key-results caret before chart handles; handle before caret; no positive tabindex) and a final docs pass. The docs scope has a table of what each dependency ticket already owns, so this ticket only fills gaps, adds the Tab-order sentence to the "Page" section, checks ARCHITECTURE.md, and verifies the M9.9 Playwright coverage topics.

Diagrams: none (single-component, no control loop).

Open questions: none.

Checks run: the end-state stale-name grep (docs and ARCHITECTURE.md) matches today's stale statements at origin/main, as the criterion says. No mutation criterion beyond the spec's order probe (not run; the spec does not exist yet).

Overlap: none. SGS-139 was not yet on disk; its scope is taken from design C8 and outline L, named in the ticket. The Tab-order spec depends on the save-flow helpers SGS-132 leaves in `acceptance/helpers.ts`; the ticket says reuse, not copy, because of the acceptance jscpd gate.

Notes for the manager: no graph row added (as instructed). The spec's `save-build` stop is conditional (shown only for a build with an edit secret); the ticket leaves the choice to the implementer.
