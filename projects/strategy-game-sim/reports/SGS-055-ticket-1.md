# SGS-055 ticket report

File: .claude/code-factory/projects/strategy-game-sim/tickets/SGS-055-aoe4-m3-playwright-flow.md

Title: Add the M3 end-to-end Playwright flow for the AoE4 page. Component aoe4-build-order. Risk standard (plan said medium; test-only, no strongModelTrigger, over ~100 test lines). ~120 lines of test code. On merge: none (the outline does not call for one). Depends on SGS-039, 040, 045, 046, 047, 048.

Scenarios: (1) flow test: pasted build with no reaction, edit count 3 -> 5 in step-field-count, text syncs, run, node-depleted warning for sheep (from SGS-039 default 3000) in simulation-warnings, timeline with a flagged not-reached @25:00 row, pin first run then compare table and pinned:food paths, unpin; (2) ENG 1TC at 3600 s: gold depletes (asserted from response), reaction row data-reaction, no "gold ran out" warning (reaction moves villagers, so info); (3) step-table-unavailable. Depletion warning is by default sheep amount, no gold reaction involved, as asked. Moves openPage/runSimulation into acceptance/helpers.ts.

Checked: helper grep gives 2 on main (both in aoe4-build-order.spec.ts); m3-flow file count 0. Mutation criteria cannot be run until dependencies merge (stated in the ticket). SGS-046 and 047 did not exist; used design ids.

Open questions (designer): final L/M ids and commit behavior of step-field-count; the ~3305 s gold run-out estimate from SGS-039 must stay under 3600 s.
