# SGS-154 ticket author report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md

Title: SGS-154: Re-add AoE4 simulate-API acceptance coverage without pinned values
Type Chore, Priority low, Risk low, Milestone none, Component aoe4-build-order, Depends on none, On merge none. LOC: 0 business logic, about 200 test lines, one ticket (no split).

Summary: eight test items in existing `acceptance/aoe4-simulate-api-*.spec.ts` files (edges result shape, markers at a truncated horizon, veterancy conversion, knight/longbow held warning, spear/longbow men-at-arms timing, triggers infinite-node run, depletion engine, spend/population auto-house). Each is written as a rule over the response or between runs, with instants and step indexes derived from the response or build JSON.

Dropped (engine-tunable or no longer meaningful): pinned English timelines and banks, house-lead-time series and digests (house-rule and house-gate specs cover house planning), pre-depletion-engine comparison, the contract buildOrder 200-body example (schema validation of examples and real 200s already covered), the 1200 s gold test, the one-unit-ahead spend sum.

Diagrams: none required. Open questions: none. Overlap with other tickets: none found. Lint passes.

Verification note: I did not run the proposed tests; the deleted originals were read at `27e8840^`.
