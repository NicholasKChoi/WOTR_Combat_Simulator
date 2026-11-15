# SGS-162 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-162-aoe4-my-builds-reread-availability-check.md

Summary: Chore, component aoe4-build-order, Milestone none, Priority low, Risk low, about 5 lines. In `pages/apps/aoe4-build-order.tsx` the `reread` storage listener checks only `storage === null`, while the mount effect also requires `myBuildsAvailable(storage)`. The ticket makes the listener apply the same rule. Two criteria: no update on an unavailable page, and the existing available-page behavior (My builds key, null key, unrelated key) is unchanged. Scope asks the implementer to check the Named builds sentence in `docs/aoe4-build-order.md` and edit it only if it reads as untrue.

Diagrams: none (single component).
Open questions: none. Dependencies: none. Lint: clean.
Sizing: well under 400 lines, no design needed.

Notes for the manager:
- Id collision: `reports/SGS-162-rca.md` and `reports/SGS-162-debugger-1.md` already exist for an unrelated debug item (flaky step-band acceptance spec, no fix ticket). Check TASK-GRAPH and the id counter; the new ticket is still SGS-162 as instructed.
- Chore is a slight stretch: on a page where storage reads work but writes fail, a storage event used to populate My builds and no longer will. It matches the mount-time behavior, so the ticket frames it as consistency.
- I did not run a scratch checkout; no criterion names a command.
