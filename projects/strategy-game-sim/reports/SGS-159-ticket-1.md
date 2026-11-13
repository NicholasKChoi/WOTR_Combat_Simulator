# SGS-159 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-159-docs-m9-save-panel-check-rows.md

Summary: Docs, aoe4-build-order, Milestone none, Priority low, Risk low, 0 LOC, no dependencies, On merge none. The doc is `projects/strategy-game-sim/design/M9.md`. It is a factory state file and is not in the repo tree at `origin/main`. Two Criteria-map rows are fixed.

- M9.9: replace the single Tab walk (save-build then link controls) with two states. With the link not shown, `save-build` is a stop. With the link shown, `save-build` is disabled and not a stop. I verified this against `save-build.tsx` (`canSaveVersion`, `showVersion`, `linkVisible`) and `acceptance/aoe4-split-tab-order.spec.ts`, which already asserts both states.
- M9.12 (b)/(c): clearing the copy name so `save-copy-name-error` shows is a required step. The reason is that the content must exceed the bar height. The ticket tells the implementer to leave out the pixel figures. This matches `openCappedState` in `acceptance/aoe4-split-scroll.spec.ts`.

The ticket also tells the implementer to grep `design/M9.md` for other repeats of either claim. My grep showed `save-build` at the C1 order list (about line 86) and at the behavior rules for Escape and the copy form. I did not check those for the wrong claim.

Diagrams: none (one-line statement used). Open questions: none. Overlap with open tickets: none checked beyond the BACKLOG.md items, which the manager removes once this merges.

Lint: `ticket-lint.py` prints one error, `type: Type is 'Docs'; must be exactly Feature, Bug, or Chore`. The header is valid per the template and your instruction, so the linter is out of date with the template. I left the ticket as is and made no engine change. File a gh issue on NicholasKChoi/code-factory for the linter to accept Docs. It reports no other errors.

Base used: `origin/main` after `git fetch origin`.
