# SGS-156 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md (lint clean)

Summary: Bug, lane (Milestone none), component aoe4-build-order, Priority high, Risk high (REPO.md criticalPaths `runInstant`, `orderNeed`, `nextWake` change behavior; PROJECT.md trigger on order of operations; adjacent A2, A3). About 180 business-logic lines, no dependencies, under the 400 cap, no design needed. Scope transcribes the owner's due house, house reserve, order, no-deadlock, explicit `build house` unchanged, doc section and tests, and the fixture with its no-supply-capped-TC 9:30-15:00 outcome. Cause section grounds it in `planAutoHouse` (lead ignores gather time), `startAutoHouses` (last in `runInstant`, no hold), the step handlers and `orderNeed`, and the tests/doc that pinned the old contract.

Diagram: one Mermaid flowchart of `runInstant` in read/act/record phases.

Judgment calls to check:
- Kept the post-production auto-house pass in addition to the new pre-step pass, so a house made due by a same-instant payment is not delayed to a later wake.
- Read "explicit `build house` steps unchanged" as: not held by the house reserve and still counted in headroom.
- No changelog file exists on `main` (grepped docs, README, tree). Scope 7 puts the shift in the PR description. If the owner wants a changelog file, that is a separate decision.

Open question (owner, in the ticket): hold or release the house cost when a house is due and affordable but no builders are available. Recommended release. It is the only gap the backlog spec did not cover; the ticket can proceed on the recommendation if you prefer not to wait.

Overlap with open tickets: none found (SGS-153..155 do not touch house planning).
