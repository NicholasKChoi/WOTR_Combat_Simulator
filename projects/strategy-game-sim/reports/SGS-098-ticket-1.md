# SGS-098 ticket author report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-098-delete-failing-aoe4-acceptance-tests.md

Reproduction: worktree on origin/main 9328355 (unchanged in effect since SGS-095 report), `npm ci`, playwright chromium, full `npx playwright test`: 734 passed, 28 failed. Same count as SGS-095. All failures are in 11 AoE4 specs: contract (1), depletion-engine (6), edges (1), house-lead-time (4), house-warnings (1), markers (1), spear-longbow-build (3), spend-population (2), timelines (4), triggers (2), veterancy-conversion (3). Exact titles are in the ticket.

Whole-file deletions (every test listed): house-lead-time, timelines, veterancy-conversion. Partial: the other 8 files. Spear-longbow keeps one passing test; its 1200/3600 s `for` loop is deleted whole since both rows fail. Helpers `finalCount`, `INFINITE_NODES`, `buildOrderFrom` stay used by surviving specs (checked after a trial deletion).

Risk low, LOC 0 business logic, no dependencies, On merge none, no open questions, no diagram (single-component, no control loop). No overlap with other tickets seen.

Backlog follow-up line (for the manager): "AoE4 acceptance coverage removed by SGS-098: pinned timelines and bank values (prebuilt English build, house lead time, spend/population, depletion-engine vs pre-depletion engine), veterancy-conversion counts, contract 200-body example, edges result-shape, markers truncated horizon, triggers infinite-node timings, house-warnings knight/longbow held warning, spear/longbow men-at-arms timing and 1200 s gold. Behaviors are uncovered at acceptance level (unit pins are current)."

Worktree ticket-SGS-098 removed; nothing left running (Playwright started and stopped its own server).
