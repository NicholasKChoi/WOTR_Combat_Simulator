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
  - `save-status` is always rendered with `role="status"`, `aria-live="polite"` and `aria-atomic="true"`; its text is `saveStatusText(saved, settled, saving)`, derived from `saved`, `settled` and `saving` only, with no separate status state, so the status is empty whenever the link is absent or a save is in flight, and non-empty whenever the link is shown and no save is in flight. During an in-flight second save (after a first save, Save as copy submitted again) the link stays shown and the status is empty; the link is not hidden while saving. `.saveStatus` resets the paragraph's default margin (as `.linkHint`, `.saveError` and `.saveNotice` do) so the empty status adds no height; an empty flex item still adds one `gap`, and the row's height with no save must not grow from it. Its lifetime is the link panel's (owner decision 3A): it follows `linkVisible`, so the existing effect that clears `saved` when the settled input changes also ends it. There is no timer.
  - Escape handling: replace the `onKeyDown` on the `linkPanel` wrapper with one `onLinkKeyDown` attached to `saved-build-link` and `copy-saved-link` only. It keeps today's `hideLink` behavior (`preventDefault`, hide the link, empty the status, focus the saving button if enabled, else `save-build-copy`). Escape on `save-build`, `save-build-copy`, or with no link shown does nothing.
  - The `linkPanel` wrapper class and its `flex: 1 1 100%` row go away with the restructure; the link input and Copy link become row children.
- `components/apps/aoe4-build-order/workbench.module.css`: add `.savePanel` (`flex: 1 1 100%`, so it takes its own run-bar row), `.saveRow` (wrapping flex row aligned to the end, with a gap; no wrap from 1200px up), and `.saveStatus`; the link input in the row shrinks to a small minimum width from 1200px up. Remove or rewrite `.linkPanel` and `.linkInput` where the restructure leaves them unused. The 1200px breakpoint is the split-layout width (`SPLIT_MIN_WIDTH` in `acceptance/helpers.ts`, and the page's layout switch); the CSS module has no 1200px query today, so add a `min-width: 1200px` media query.
- `components/apps/aoe4-build-order/build-input.tsx`: `SaveBuild`'s props do not change. `auto-run-status` stays in the run bar after the save panel; its position within the wrapped bar is the implementer's, but it must stay visible and keep its test id.
- Tests:
  - `save-build.test.ts` (extend): a table over `saveStatusText`, and `renderToStaticMarkup` cases for the no-save state only: `save-panel`'s first child is `save-row`, whose children are the shown buttons in order followed by the empty `save-status` with its three attributes. Static markup cannot show the link, the copy form, the hint, the storage notice or the error, since those are state; the new Playwright spec covers them. Follow the file's `createElement` and `render(panel)` pattern; `.jscpd.tests.json` (SGS-128) scans this file at 5 lines, so cases that differ only in input are rows of one `it.each`.
  - New `acceptance/aoe4-save-status.spec.ts`. The M8 flows (copy and version saves against the real named-builds routes, and `stubNamed`/`reply` for failures) live as local helpers in `acceptance/aoe4-my-builds.spec.ts` (`saveCopy`, `editedCopy`, `stubNamed`, `reply` are examples); there is no shared named-builds stub in `acceptance/helpers.ts` at the base. When the new spec needs the same helper, move it to `acceptance/helpers.ts` (or use what SGS-128 left there) and import it from both specs; do not copy it, because the acceptance jscpd gate fails on a clone. The spec covers the stateful layout: with the link shown, the DOM order inside `save-row`; and that `save-copy-form` (form open), `copy-saved-link-hint` (after a refused clipboard write), `my-builds-unavailable` (storage throwing) and `save-build-error` are not descendants of `save-row`. Geometry and line checks read all rects in one `page.evaluate` or under `expect.poll`.
- Docs: `docs/aoe4-build-order.md`: the "Page" paragraph's sentence about what the run bar holds (select, duration, toggle, run status, the save buttons) and the "Saving a build and opening it by link" section's statements that the link and Copy link sit "in the run bar" and that "Escape in the link panel" hides the link, plus the sentence that the link and error go away on the first settled change (the status joins them). The doc also needs the status rule and the one-row layout described; the implementer writes it against the code. No measured values in the doc.
- Existing tests: a test of the changed behavior (Escape scope, link placement) gets the new expectation; any other test keeps its expectation. The implementer lists every test it edits.

**Out of scope:** the run-bar height cap and scroll anchoring (a later ticket on the split layout); the Tab-order spec; `SaveBuild` props, the named-build client and the my-builds storage; changing which saves are allowed; a timer or auto-dismiss for the status.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `saveStatusText` returns `Saved` for a create (`by: 'copy'`) and `Saved version <revision>` for an update (`by: 'version'`), using the stored revision; it returns an empty string while saving, when `saved` is null (a failed save clears it), and when the settled input differs from the saved input. A test fails if the settled-input check or the saving check is removed
- [ ] (respec 1) Static render with no save (Vitest): `save-panel`'s first child is `save-row`, whose children are the shown save buttons in order (`save-build`, `save-build-copy`) then `save-status`; `save-status` is present, empty, and has `role="status"`, `aria-live="polite"` and `aria-atomic="true"`
- [ ] (respec 1) In the browser with the link shown, `save-row`'s children are in the order `save-build`, `save-build-copy`, `save-status`, `saved-build-link`, `copy-saved-link`; with the copy form open, after a refused clipboard write, with storage throwing, and after a failed save, `save-copy-form`, `copy-saved-link-hint`, `my-builds-unavailable` and `save-build-error` respectively are shown and are not descendants of `save-row`
- [ ] (respec 2) Whenever `saved-build-link` is visible and no save is in flight, `save-status` is non-empty, and whenever the link is absent, it is empty; during an in-flight second save the link stays shown and the status is empty (checked in one polled assertion or one `page.evaluate`). After a copy save it reads `Saved`; after a version save it reads `Saved version <revision>` with the revision from the response (a second save shows the new text, not the old). Checked at 1280x800 and 390x844
- [ ] (respec 1) The status is empty while a save is in flight, and stays empty when the save fails with an error reply (stubbed status) or a network error (`route.abort()`), with the error shown in `save-build-error`; a failed save after a successful one leaves no stale `Saved`
- [ ] The status is empty after the settled input changes, after the build select changes, and after Escape hides the link; it never clears on a timer (a test waits past a few seconds with no input change and the status is still shown)
- [ ] When the browser cannot store My builds (`persisted: false`), the status still shows and `my-builds-unavailable` shows below the row
- [ ] Escape with focus on `saved-build-link` or on `copy-saved-link` hides the link, empties the status and focuses the saving button when enabled, else `save-build-copy`; Escape with focus on `save-build-copy` or `save-build` leaves the link and status shown. A test fails if the handler is attached to `save-row` or `save-panel` instead
- [ ] (respec 1) At 1280x800 the tops of `save-build`, `save-build-copy`, `saved-build-link` and `copy-saved-link` agree within 2px; the row does not wrap; with no save, the empty `save-status` adds no height to `save-row` (row height is the buttons' height within 2px). At 390x844 the row wraps in DOM order and `save-status` sits on the buttons' line or the line directly below them, with nothing between. Every geometry check reads its rects in one `page.evaluate` or under `expect.poll`
- [ ] `auto-run-status`, `run-bar` and every `save-*` test id from before still exist and behave as before; the existing acceptance specs that use them pass
- [ ] `docs/aoe4-build-order.md` describes the status, the one-row layout and the Escape scope, and none of the statements Scope lists is left untrue
- [ ] `npm run lint:dup` (both configs), `npx tsc --noEmit` and `npm test` pass, and the new spec passes under `npm run acceptance` for the files it touches
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: criteria asked for an untestable abort path (the page aborts only on unmount), a render-boundary timing, and a stateful DOM layout that the static Vitest render cannot show.
- Changed: dropped the abort case (error reply and `route.abort()` network error remain); split the layout criterion into a static no-save Vitest case and a Playwright case for the link, form, hint, storage notice and error; restated the status timing as the link-visible/status-non-empty property, with the status derived from `saved`/`settled`/`saving` only; added the `.saveStatus` margin reset and a no-height-from-empty-status check; all geometry reads in one `page.evaluate` or `expect.poll`.
- No branch work exists yet; nothing to keep or discard.

## Re-spec 2 - 2026-11-11

- Underspecified: "link visible implies status non-empty" contradicted the empty status during an in-flight save, since the link stays shown while a second save is in flight.
- Changed: criterion 4 and the Scope `save-status` bullet now state the property as link visible and no save in flight implies non-empty, link absent implies empty, and say the link stays shown with an empty status during an in-flight second save (matches design C1).
- No branch work exists yet; nothing to keep or discard.
