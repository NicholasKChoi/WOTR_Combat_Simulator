# SGS-182 review 1

Verdict: APPROVE. Tip 9aaf8047e7855837ad258bf46fbc2e0eb5e54bdb, base origin/main.

## Blocking findings
None.

## Acceptance criteria
1. Pass. The diff removes every `showTab` call and import, the `TABS_VIEWPORT` import and the `PHONE` and `NARROW` constants. A grep of the four files for `showTab|TABS_VIEWPORT|PHONE|NARROW|tab-build|tab-results|VIEWPORTS` has no hits. The only viewports set are 1280x800, `MIN_SUPPORTED_VIEWPORT` and 1280x720. `tsc --noUnusedLocals` flags only `isNamedPath` in my-builds, which is also imported at base (pre-existing, not introduced). `tsc --noEmit` passes.
2. Pass. "opens as text" no longer sets a viewport or asserts `tab-build`. The invalid status, issues, text, load error, disabled copy button and no-POST assertions remain.
3. Pass. The four "tab after a load" cases are gone. The remaining cases changed only by tab-step removal. `ABSENT_ID`, `apiSave`, `afterFrames`, `VALID_A`, `openSavedBuild` and `client` are still used (grep counts above 1); the now-unused `openPage` import was removed.
4. Pass. The status cases run once under a 1280x800 describe, and the 390 row, `VIEWPORTS`, "1199" and "390x844" cases are deleted. The one-line cases hold at 1280x800 and `MIN_SUPPORTED_VIEWPORT`. The describe is renamed "at the minimum supported width".
5. Pass. The layout case sets no viewport below 1200 wide. With the copy form open and again with the link panel shown, one poll reads `scrollWidth`, `editorTop < runBarBottom` and run bar share <= 0.4 at `MIN_SUPPORTED_VIEWPORT`. A second poll checks the share at 1280x720. The form and link are asserted visible afterwards. The implementer's mutation checks show each assertion fails when its condition is broken.
6. Pass. The scroll case runs at the default viewport. It asserts window scroll > 0 and `build-column` scrollTop > 0 before relying on either. It compares window and column scroll (two frames settled) after a valid and an invalid edit. The column mutation check failed as expected.
7. Pass. First-load and invalid-edit run at the default viewport with the request-count, body, status, hydration, issues, last-good and dimming asserts kept. The invalid-edit case still waits on `results-last-good` before reading opacity.
8. Partial (read only). `npm run lint:dup` reports 0 clones (I ran it). I did not run `npm test` or the acceptance specs (not permitted); I rely on the implementer's recorded results. The implementer's report lists the deleted and rewritten tests.
9. Pass. No invariants apply (acceptance specs only).

## Invariants touched
None.

## Checks run
- `npx tsc --noEmit`: pass.
- `npm run lint:dup`: 0 clones.
- Bot: REPO.md `reviewBot` has no CLI or rulesFile; skipped.
- UI inspection: not applicable (the diff changes no UI).

## Non-blocking notes
- `settledScrollY` in `acceptance/helpers.ts` now has no importer. The implementer flagged it for the later helpers-cleanup ticket; helpers.ts is out of scope here.
- The auto-run scroll case defines a local `settledScroll` evaluate in place of the shared helper. This is justified because the helper reads only the window scroll.

## Coverage
All four changed spec files were read in the full diff. I did not run the acceptance specs or `npm test`.
