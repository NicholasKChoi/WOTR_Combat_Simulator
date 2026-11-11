# SGS-132: Put the save controls on one row with a live "Saved" status

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.3
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: a screen reader announces a replaced text in a `role="status"` `aria-live="polite"` `aria-atomic="true"` region that stays mounted (tests check the attributes and the text, not the announcement); Chromium wraps and un-wraps the flex row at the 1200px breakpoint as the CSS describes (checked by the Playwright spec at two widths, not by a fake)
- **LOC estimate**: ~130 (`save-build.tsx` restructure, `saveStatusText`, `onLinkKeyDown`, about 20 lines of CSS; tests and docs excluded)
- **Depends on**: SGS-128
- **On merge**: none
- **Source**: `design/M9.md` C1 and the "Save status and save row (M9.3)" behavior rules, criterion M9.3, owner decision 3A; `plans/M9-20261111.md` outline E

## Context

After a save, the page shows a link panel and nothing says the save worked or which version it stored; the save buttons, the link input and Copy link also wrap onto separate run-bar lines, so the sticky run bar is tall. This ticket puts the buttons, a live status and the link controls in one `save-panel` > `save-row`, and adds an always-mounted `save-status` that reads `Saved` or `Saved version <revision>` for as long as the link panel is shown, with no timer.

## Scope

Read the design's C1 and the behavior-rule table first; contract names (`save-panel`, `save-row`, `save-status`, `saveStatusText`, `SavedStatus`, `Saver`, `onLinkKeyDown`, `.savePanel`, `.saveRow`, `.saveStatus`) are the design's.

- `components/apps/aoe4-build-order/save-build.tsx`:
  - `SaveBuild` returns one `save-panel` element (today a fragment whose children are direct flex items of the run bar in `build-input.tsx`). The first child is `save-row`, holding in DOM order: `save-build` (when shown), `save-build-copy`, `save-status`, then `saved-build-link` and `copy-saved-link` (the last two only while the link is visible). `save-copy-form`, `copy-saved-link-hint`, `my-builds-unavailable` and `save-build-error` render below the row in that order. Every existing test id stays.
  - Export `Saver`, `SavedStatus` and `saveStatusText` per C1. The module's `Saved` state gains the revision: a create stores `1`, an update stores the response's `revision`.
  - `save-status` is always rendered with `role="status"`, `aria-live="polite"` and `aria-atomic="true"`; its text is `saveStatusText(saved, settled, saving)`. Its lifetime is the link panel's (owner decision 3A): it follows `linkVisible`, so the existing effect that clears `saved` when the settled input changes also ends it. There is no timer.
  - Escape handling: replace the `onKeyDown` on the `linkPanel` wrapper with one `onLinkKeyDown` attached to `saved-build-link` and `copy-saved-link` only. It keeps today's `hideLink` behavior (`preventDefault`, hide the link, empty the status, focus the saving button if enabled, else `save-build-copy`). Escape on `save-build`, `save-build-copy`, or with no link shown does nothing.
  - The `linkPanel` wrapper class and its `flex: 1 1 100%` row go away with the restructure; the link input and Copy link become row children.
- `components/apps/aoe4-build-order/workbench.module.css`: add `.savePanel` (`flex: 1 1 100%`, so it takes its own run-bar row), `.saveRow` (wrapping flex row aligned to the end, with a gap; no wrap from 1200px up), and `.saveStatus`; the link input in the row shrinks to a small minimum width from 1200px up. Remove or rewrite `.linkPanel` and `.linkInput` where the restructure leaves them unused. The 1200px breakpoint is the split-layout width (`SPLIT_MIN_WIDTH` in `acceptance/helpers.ts`, and the page's layout switch); the CSS module has no 1200px query today, so add a `min-width: 1200px` media query.
- `components/apps/aoe4-build-order/build-input.tsx`: `SaveBuild`'s props do not change. `auto-run-status` stays in the run bar after the save panel; its position within the wrapped bar is the implementer's, but it must stay visible and keep its test id.
- Tests:
  - `save-build.test.ts` (extend): a table over `saveStatusText`, and `renderToStaticMarkup` cases for the child order of `save-row` and the always-present empty `save-status` with its three attributes. Follow the file's `createElement` and `render(panel)` pattern; `.jscpd.tests.json` (SGS-128) scans this file at 5 lines, so cases that differ only in input are rows of one `it.each`.
  - New `acceptance/aoe4-save-status.spec.ts`. The M8 flows (copy and version saves against the real named-builds routes, and `stubNamed`/`reply` for failures) live as local helpers in `acceptance/aoe4-my-builds.spec.ts` (`saveCopy`, `editedCopy`, `stubNamed`, `reply` are examples); there is no shared named-builds stub in `acceptance/helpers.ts` at the base. When the new spec needs the same helper, move it to `acceptance/helpers.ts` (or use what SGS-128 left there) and import it from both specs; do not copy it, because the acceptance jscpd gate fails on a clone.
- Docs: `docs/aoe4-build-order.md`: the "Page" paragraph's sentence about what the run bar holds (select, duration, toggle, run status, the save buttons) and the "Saving a build and opening it by link" section's statements that the link and Copy link sit "in the run bar" and that "Escape in the link panel" hides the link, plus the sentence that the link and error go away on the first settled change (the status joins them). The doc also needs the status rule and the one-row layout described; the implementer writes it against the code. No measured values in the doc.
- Existing tests: a test of the changed behavior (Escape scope, link placement) gets the new expectation; any other test keeps its expectation. The implementer lists every test it edits.

**Out of scope:** the run-bar height cap and scroll anchoring (a later ticket on the split layout); the Tab-order spec; `SaveBuild` props, the named-build client and the my-builds storage; changing which saves are allowed; a timer or auto-dismiss for the status.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `saveStatusText` returns `Saved` for a create (`by: 'copy'`) and `Saved version <revision>` for an update (`by: 'version'`), using the stored revision; it returns an empty string while saving, when `saved` is null (a failed save clears it), and when the settled input differs from the saved input. A test fails if the settled-input check or the saving check is removed
- [ ] The rendered `save-panel` contains `save-row` as its first child; `save-row` children are in the order `save-build`, `save-build-copy`, `save-status`, then `saved-build-link` and `copy-saved-link` when the link is shown; `save-copy-form`, `copy-saved-link-hint`, `my-builds-unavailable` and `save-build-error` are outside the row. With no save, `save-status` is present, empty, and has `role="status"`, `aria-live="polite"` and `aria-atomic="true"`
- [ ] After a copy is saved in the browser, `save-status` reads `Saved` in the same render that shows the link; after a version save it reads `Saved version <revision>` with the revision from the response (a second save shows the new text, not the old). Checked at 1280x800 and 390x844
- [ ] The status is empty while a save is in flight, and stays empty when the save fails with an error reply, a network error or an abort (the error shows in `save-build-error`); a failed save after a successful one leaves no stale `Saved`
- [ ] The status is empty after the settled input changes, after the build select changes, and after Escape hides the link; it never clears on a timer (a test waits past a few seconds with no input change and the status is still shown)
- [ ] When the browser cannot store My builds (`persisted: false`), the status still shows and `my-builds-unavailable` shows below the row
- [ ] Escape with focus on `saved-build-link` or on `copy-saved-link` hides the link, empties the status and focuses the saving button when enabled, else `save-build-copy`; Escape with focus on `save-build-copy` or `save-build` leaves the link and status shown. A test fails if the handler is attached to `save-row` or `save-panel` instead
- [ ] At 1280x800 the tops of `save-build`, `save-build-copy`, `saved-build-link` and `copy-saved-link` agree within 2px, with all rects read in one `page.evaluate`; the row does not wrap. At 390x844 the row wraps in DOM order and `save-status` sits on the buttons' line or the line directly below them, with nothing between
- [ ] `auto-run-status`, `run-bar` and every `save-*` test id from before still exist and behave as before; the existing acceptance specs that use them pass
- [ ] `docs/aoe4-build-order.md` describes the status, the one-row layout and the Escape scope, and none of the statements Scope lists is left untrue
- [ ] `npm run lint:dup` (both configs), `npx tsc --noEmit` and `npm test` pass, and the new spec passes under `npm run acceptance` for the files it touches
- [ ] No INVARIANTS.md regressions

## Open questions

none
