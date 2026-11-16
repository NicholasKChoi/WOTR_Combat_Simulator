# SGS-182 implementer report 1

- Branch: sgs-182-save-load-auto-run-specs-to-desktop-viewports, tip 9aaf8047e7855837ad258bf46fbc2e0eb5e54bdb (base origin/main f731e4a, includes SGS-179)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-182-save-load-auto-run-specs-to-desktop-viewports
- Status: needs_review

## Files touched (acceptance/ only, 4 files, +96 -186)
- aoe4-save-open.spec.ts: "opens as text" case drops `setViewportSize(PHONE)` and the `tab-build` assert; describe "the tab after a load at 390 px" (4 cases) deleted; `showTab` calls/import, `PHONE`, unused `openPage` import removed. `ABSENT_ID`, `apiSave`, `afterFrames`, `VALID_A`, `openSavedBuild`, `client` are still used and kept.
- aoe4-save-status.spec.ts: `VIEWPORTS` loop became one describe "save status at 1280x800" (two cases, unchanged bodies, dedented); `NARROW`/`VIEWPORTS` removed; deleted "at 1199 px the row keeps DOM order" and the "at 390x844" describe; describe renamed "at the minimum supported width" and its case uses `MIN_SUPPORTED_VIEWPORT`.
- aoe4-my-builds.spec.ts: layout case rewritten (see below); `showTab` call/import and `PHONE` removed.
- aoe4-auto-run.spec.ts: first-load and invalid-edit describes flattened to plain cases at the default viewport, tab asserts dropped (invalid-edit still waits on `results-last-good` before reading opacity); scroll case rewritten; all other `showTab` calls and the `showTab`/`TABS_VIEWPORT`/`settledScrollY` imports removed.

## Tests deleted or rewritten
Deleted: the four "tab after a load at 390 px" cases; "at 1199 px the row keeps DOM order"; "at 390x844 wraps in DOM order" (status). The 390 row of the status `VIEWPORTS` loop is gone (two cases now run once).
Rewritten: save-open "opens as text" (default viewport, no tab assert); my-builds "layout of the save panel" (now "at the minimum supported viewport ..."): at `MIN_SUPPORTED_VIEWPORT`, with the copy form open and again with the link panel shown, one `expect.poll` reads `scrollWidth`, editor top vs run bar bottom, and run bar height share (<= 40%) in a single evaluate per read; then 1280x720 run bar <= 40%. Form and link are asserted visible afterwards. auto-run "the page never scrolls by itself": default viewport; asserts window scroll > 0 after `scrollInstantly(400)` and `build-column` scrollTop > 0 after `scrollBy 400`; after a valid then an invalid duration edit, window scrollY and column scrollTop (read together after two frames in one evaluate) equal the before values.
Edited but behavior unchanged: first-load, invalid-edit-dims-charts, status cases, and all other `showTab` removals.

## Pre-existing tests edited
All edits are in the four named files and fall under the ticket Scope (tab steps and narrow rows removed); no assertion value was changed outside that.

## Doc claims
None added. The only new test title text: "at the minimum supported viewport neither the open copy form nor the link panel widens the page or lets the run bar cover the editor" (matches the assertions in `aoe4-my-builds.spec.ts` "layout of the save panel"), "at the minimum supported width" describe (holds one case at `MIN_SUPPORTED_VIEWPORT`).

## Pinned outputs
None.

## Mutation checks
- my-builds layout, `m.editorTop < m.runBarBottom` -> `+ 100000`: failed on `editorUnderBar` (expected false, received true). Undone.
- `m.scrollWidth > MIN_SUPPORTED_VIEWPORT.width` -> `> 0`: failed on `sideways` (expected false, received true). Undone.
- 1280x720 bound `<= 0.4` -> `<= 0.01`: failed with received 0.311. Undone.
- auto-run scroll case: reset `build-column` scrollTop to 0 inside the valid-edit action: failed on `column` (expected 400, received 0). Undone.
- The window scrollY and `> 0` preconditions are asserted directly; window-side mutation not run separately (same `toEqual` covers it). Status/save-open edits are deletions and tab-step removals with no new assertion logic.
- Note: an accidental interactive `git checkout -p` was started during mutation and exited without changing anything; the tree was verified intact before commit.

## Results
- `npx tsc --noEmit`: pass. `npm run lint:dup`: 0 clones. `npm test`: 84 files passed, 2623 tests passed, 15 skipped.
- Acceptance per file on unchanged page code (the ticket's explicit requirement): aoe4-auto-run + aoe4-save-status 33 passed; aoe4-save-open 10 passed; aoe4-my-builds 76 passed.
- Scroll range: the default viewport scrolls both the window and `build-column` (window > 0 and column 400 after the 400 px requests); no re-spec needed.
- Codegen: none set. `next build` not run (no non-acceptance file changed).
- grep of the four files for `showTab|TABS_VIEWPORT|PHONE|NARROW|tab-build|tab-results`: no hits.

## Invariant check
None apply (acceptance specs only).

## Unverified assumptions added
None.

## Out-of-scope findings
- `acceptance/helpers.ts` `settledScrollY` now has no importer (grep across `acceptance/`); the scroll case reads window and column together in a local evaluate instead. The later helpers-cleanup ticket can remove it with `TABS_VIEWPORT`/`showTab`.
