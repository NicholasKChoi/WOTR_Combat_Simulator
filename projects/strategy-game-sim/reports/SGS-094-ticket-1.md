# SGS-094 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-094-aoe4-deer-pack-2450.md
Branch: sgs-094-aoe4-deer-pack-2450. Component aoe4-build-order. Bug, medium priority, no dependencies, Risk standard.

Summary: set base.json gatherNodes.deer.amount to 2450 with a new source label (2026-11-04, deer pack), fix every pin found on origin/main (data.test.ts, schema.test.ts, simulate-depletion.test.ts, simulate-triggers.test.ts, acceptance triggers spec DEFAULTS, openapi.json lines ~706 and ~1705). Docs have no 1750 figure; the ticket still tells the implementer to grep.

Prebuilt builds: grep of data/aoe4-build-order/builds and its README finds no deer reference, so no pin should shift. The ticket still requires running every build-pinned test, reporting before/after deer amount and depletedAt per build, and re-pinning only when the build sends villagers to deer; any other shift is reported, not re-pinned.

Risk reasoning: standard, not high (no criticalPaths symbol or bound changes, engine reads data unchanged); not low (default run results for deer change and public OpenAPI examples change).

Checked: the grep criterion matches the pre-change code on origin/main (6 files) and holds after the stated edits. No diagram. No open questions. No overlap with other tickets (SGS-093 already integrated).
Note: the main working checkout is on another branch where line numbers differ; I used origin/main.
