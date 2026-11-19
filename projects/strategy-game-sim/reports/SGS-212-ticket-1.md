# SGS-212 ticket report (1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-212-rename-ui-saved-builds.md

Summary: "Rename one of My builds from the save row, with the shared name form and library updates". Feature, M12 (M12.2, M12.3), component aoe4-build-order, Risk standard, ~220 LOC business logic, Depends on SGS-209 (integrated). Covers C10 (new name-form.tsx, Save as copy moves onto it keeping its ids), C11 (Rename button, one form at a time, focus, 412 lock, Renamed status), C12 (withRenamedEntry, withLoadedEntry takes the server name per D17, withRereadMyBuilds always takes the re-read name per owner decision Q146 B, no revision comparison), docs (UI doc save section, ARCHITECTURE name-form row), and the rewrite of the existing my-builds spec that asserted the stored name wins. Criteria cover shown/disabled states, form validation, success, reload of ?n=, stale-response and edited cases, 412 and other failures, storage failure, server-name load, re-read name, withRenamedEntry cases, Save as copy unchanged, row not wrapping at 1200/1280/1800, lint:dup.

Diagrams: none (single-component, "no diagram required").
Open questions: none. On merge: none. Unverified assumptions: none.
Overlap: none with open tickets. Note: ARCHITECTURE.md has no existing save-build row, so the ticket adds a name-form row only.
ticket-lint.py: clean (no errors or warnings).
No scratch checkout made; code read from origin/main via git show.
