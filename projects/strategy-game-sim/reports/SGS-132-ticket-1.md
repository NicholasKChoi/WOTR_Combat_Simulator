# SGS-132 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-132-save-panel-live-status.md (lint clean)

Summary: "Put the save controls on one row with a live Saved status". Component aoe4-build-order, Risk standard, about 130 business-logic lines, depends on SGS-128. It restructures `save-build.tsx` from a fragment into `save-panel` > `save-row`, adds the always-mounted `save-status` (`saveStatusText`, `SavedStatus`, `Saver`; revision stored on create and update), narrows Escape to `onLinkKeyDown` on the link input and Copy link, and adds `.savePanel`, `.saveRow` and `.saveStatus` CSS with nowrap from 1200px. Status lifetime follows `linkVisible` with no timer (owner decision 3A). Criteria cover the `saveStatusText` table, DOM order and attributes, status text after copy and version saves, empty while in flight and on failure, clearing on input or select change or Escape, `persisted: false`, Escape scope, row alignment at 1280x800 and wrap at 390x844, docs, and the gates. Tests: extend `save-build.test.ts`; new `acceptance/aoe4-save-status.spec.ts`. Docs: `docs/aoe4-build-order.md` (Page paragraph; "Saving a build and opening it by link").

Diagrams: none (single component, no core loop).

Open questions: none.

Findings and overlaps:
- The design (C1 and the M9.3 test row) says to use "the named-builds route stub from `acceptance/helpers.ts`". No such stub exists at origin/main: `stubNamed`, `reply`, `saveCopy` and `editedCopy` are local to `acceptance/aoe4-my-builds.spec.ts`. The ticket tells the implementer to move whatever the new spec shares into `helpers.ts` (or use what SGS-128 left there), because the acceptance jscpd gate rejects clones. This could overlap SGS-128's folds in `helpers.ts`, so it may need a rebase.
- `workbench.module.css` has no 1200px media query at base (only 767.98px); the ticket says to add one.
- Where `auto-run-status` sits in the wrapped run bar once `save-panel` takes its own row is not specified by the design; the ticket leaves it to the implementer and requires it stay visible. F (run-bar cap) will interact with the taller bar.
- No overlap with other open tickets for code this one would change and another deletes.
- Cited code was read at origin/main, and SGS-128's code is not yet integrated, so its helper names were taken from its ticket.
