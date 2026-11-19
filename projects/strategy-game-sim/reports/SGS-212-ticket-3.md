# SGS-212 ticket re-spec (3)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-212-rename-ui-saved-builds.md

Re-spec 1. All three gaps from reports/SGS-212-spec-gate-2.md are folded in.

## Summary

SGS-212 "Rename one of My builds from the save row, with the shared name form and library updates". Component aoe4-build-order, M12, standard risk, about 220 business-logic LOC, depends on SGS-209 (integrated). The diff touches only Scope and criteria:

1. Submit text: the rename form's submit button text is now `Save name`. Scope says it is never `Rename`, so it cannot share an accessible name with the `rename-build` button. This follows Save as copy's `Save copy` pattern. A new criterion (respec 1) requires an acceptance test to find the submit by role and name.
2. canSubmit: the rename form's `canSubmit` is the Rename button's enabled rule (no save or load in flight, not locked, has a loaded revision). It does not reuse Save as copy's `canSave`. A new criterion (respec 1) requires a test that fails if the submit is disabled for an unconvertible or stale-run build with a valid changed name.
3. Existing tests: `acceptance/aoe4-save-status.spec.ts` (its `LINK_ROW` full-row `toEqual`) is moved out of the "keep working" list. It is now listed as a test whose row order changes, with this rule: wherever Save a new version is shown, Rename comes right after it, and rows without Save a new version keep their ids. A new criterion (respec 1) covers it.

A `## Re-spec 1 - 2026-11-18` section is appended. There is no branch work yet.

Verified at origin/main: `LINK_ROW` (save-status spec lines 21, 59, 169), `canSave`/`canSubmit` and the `Save copy` submit in `save-build.tsx`, and the design's C10/C11 and "Rename: page" table, which have no submit text.

## Lint

`ticket-lint.py --graph --spec origin/main` gave exit 0 with no errors and no warnings. The ticket is standard risk, so the spec-gate checklist self-check was skipped (spec-gate runs).

## Diagrams

None. The ticket keeps its "no diagram required" line (single component, not a control loop).

## Open questions

none

## Overlap

None found beyond the original ticket.
