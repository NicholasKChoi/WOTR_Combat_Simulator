# SGS-212 review (6)

Verdict: **REQUEST CHANGES**

- Branch `sgs-212-rename-ui-saved-builds`, tip `125c2f42477f9446f55bf5517fbf5738975ff958`, base `origin/main`. Full review (first review of this branch, not delta mode).
- Scratch: `worktrees/review-sgs-212-rename-ui-saved-builds` (removed after this report).

## Blocking findings

1. `components/apps/aoe4-build-order/save-build.test.ts:67` - test - The row `'the text does not convert'` passes `status: 'invalid'` but keeps the module-level `conversion`, which converts (line 15, and line 46 asserts `conversion.ok` is true). Its name says the text does not convert, but the assertion never tests that case. I checked this by mutation: adding `conversion.ok &&` to `canRename` at `save-build.tsx:113` leaves all 38 tests in the file passing. Why it matters: the respec-1 criterion asks for a test that fails when an unconvertible build disables Rename or its submit, and this unit row looks like that test but cannot fail. Direction: add `conversion?: TextToBuildResult` to `Panel` and pass it through `render` (default stays the module `conversion`). Give this row `conversion: textToBuildOrder('start -> sheep\nat 8 vils fly capital-town-center', buildOrderCatalog(ENGLISH))` together with `status: 'invalid'`, and first assert that this conversion is not ok, so the row cannot pass on a text that converts. Production break it must fail on: `save-build.tsx:113` with `conversion.ok &&` added. Before the break, Rename has no `disabled=""` (enabled); after it, Rename is disabled.

2. `acceptance/aoe4-rename-build.spec.ts:80-85` - test - After `textarea.fill(UNCONVERTIBLE_TEXT)`, the test never waits for the settled conversion to fail. `conversion` is computed from the *settled* text after the 500 ms pause (`auto-run.ts:7`, `settledFields` at `auto-run.ts:80-84`). `save-build-copy` disabled is already true once status leaves `current`, so the following `toBeEnabled` checks on Rename and `rename-submit` can pass while the conversion still holds the earlier, convertible `EDIT_TEXT`. Under the break `conversion.ok &&` in `canRename`, the test fails only if click plus fill take more than 500 ms. A test that "may not" fail cannot fail. Direction: right after line 80, add `await expect(byId(page, 'auto-run-status')).toHaveAttribute('data-status', 'invalid')`. Status `invalid` is set only when the settled conversion fails (`auto-run.ts:190`). Precondition: before the fill, status is `current` with a convertible text, as asserted at line 76. Production break: `save-build.tsx:113` with `conversion.ok &&` added. With the wait in place, the Rename `toBeEnabled` at line 82 goes from enabled to disabled under the break and fails.

3. `acceptance/aoe4-rename-build.spec.ts:262` (and criterion 1) - test - No test covers "Rename is disabled while a save is in flight". The unit table (`save-build.test.ts:63-72`) covers busy, no revision and the enabled cases. It cannot cover `saving` or `locked`, which are internal state that `renderToStaticMarkup` cannot set. `locked` is covered by the 412 acceptance test (line 307), but `saving` is covered nowhere. Removing `!saving &&` from `canRename` at `save-build.tsx:113` fails no test, and the implementer's mutation list has no such break. The design's submit-starts rule (M12 "Rename: page", "saving is true, so Save a new version, Rename and Save as copy are disabled until it answers") and criterion 1 ("disabled while a save ... is in flight") are therefore unpinned. Direction: in the late-answer test, while the PATCH is still held, add `await expect(renameButton(page)).toBeDisabled()` right after `await expect(renameForm(page)).toHaveCount(0)` at line 262. Precondition: Rename was enabled just before, since line 259 clicked it. Before the break it reads disabled. After the break (`!saving &&` removed) it reads enabled and the assertion fails.

4. `components/apps/aoe4-build-order/save-build.tsx:270-279` - convention - The Rename button is the only save-row button without `aria-busy={busy ? 'true' : undefined}`. Its siblings Save a new version (`save-build.tsx:263`) and Save as copy (`save-build.tsx:287`) both carry it. Every control the page disables during a build load carries `aria-busy="true"`: the select, duration, textarea, Save as copy and the step table (`acceptance/aoe4-save-open.spec.ts:144-147`, `acceptance/aoe4-my-builds.spec.ts:66-69`). Rename is disabled during the same load (`!busy` in `canRename`) but does not say it is busy, so assistive tech reports it differently from the two buttons next to it. Direction: add `aria-busy={busy ? 'true' : undefined}` to the Rename button. Extend `save-build.test.ts:97-101` "marks both buttons busy while a saved build loads" with `expect(button(html, 'rename-build')).toContain('aria-busy="true"')` and retitle it "marks the save buttons busy while a saved build loads".

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Rename shown/hidden; disabled cases; not disabled by stale/unconvertible/edited; unit test covers each case | **fail** | Shown and hidden: `save-build.test.ts:49-61`, acceptance line 65. Busy and no revision: unit rows. Locked: acceptance line 307. Save in flight: covered by no test (finding 3). The unconvertible unit row does not use an unconvertible conversion (finding 1). The code itself is right: `save-build.tsx:113`. |
| 2 | Form opens prefilled, focused and selected; one form at a time; choosing another entry closes it; unchanged and invalid states; Enter; Escape/Cancel return focus | pass | `name-form.tsx`, `save-build.tsx:211-224`, acceptance lines 101-206, `name-form.test.ts` |
| 3 | (respec 1) Submit reads `Save name`, located by role; submit enabled exactly when Rename is enabled | **fail** | The name part passes (acceptance lines 28, 110-111). The enabled-for-unconvertible coverage cannot fail at the unit level (finding 1) and only fails by timing at the acceptance level (finding 2). The stale-run part passes (line 88: the held simulate keeps the run stale). The code is right (`canSubmit={canRename}`, `save-build.tsx:332`). |
| 4 | (respec 1) Full save-row order pins expect Rename after Save a new version; rows without it unchanged | pass | `aoe4-save-status.spec.ts:21` and items index at line 195; `save-build.test.ts:107,118`; `aoe4-save-status.spec.ts:54` unchanged. I did not run it (acceptance-test runs it). The implementer reports 97 passed. |
| 5 | Successful rename: trimmed name, secret, revision; form closes; new name everywhere; `Renamed`; link; address unchanged; second rename uses the new revision | pass | `submitRename`/`writeMine`, `recordRenamed`; acceptance lines 210-232 (`if-match` `"1"` then `"2"`). The run name and compare labels come from `runName(entries, ...)` at page line 156, so they follow the list. |
| 6 | Reload `?n=<id>` shows the new name and runs | pass | acceptance lines 234-241, against the real route |
| 7 | Late answer renames list and storage without link, status or error; edited build stays edited; later Save a new version sends the renamed revision and name | pass | acceptance lines 243-274; `withRenamedEntry` keeps `loaded.text` |
| 8 | 412 shows conflict, disables both, keeps name; other failures keep name and leave Rename enabled | pass | `writeMine` `setLock`; acceptance lines 296-332 (fails if a 412 leaves Rename enabled) |
| 9 | Storage unwritable: rename applies and `my-builds-unavailable` shows | pass | `showSuccess` `!persisted`; acceptance lines 285-292 |
| 10 | Choosing or opening a My build shows the server name; `withLoadedEntry` row; rewritten acceptance test | pass | `build-library.ts:103`; `build-library.test.ts` rows; `aoe4-my-builds.spec.ts:302-311`; acceptance line 354 |
| 11 | Re-read keeps this tab's `loaded` and takes the re-read name | pass | page `withRereadMyBuilds` line 121; acceptance lines 336-352 |
| 12 | `withRenamedEntry` unit rows | pass | `build-library.test.ts` `describe('withRenamedEntry')`, which covers each named case |
| 13 | Save as copy unchanged on the shared form; `validBuildName` bounds | pass (by reading) | Ids, label, group name, prefill (`copyName`), `canSubmit={canSave}`, Escape, focus return and `openForm` refocus all keep their old behavior. No existing save-copy spec is edited. `name-form.test.ts:6-17` covers 0, whitespace, 1, 100 and 101. I did not run the existing specs. |
| 14 | Row does not wrap at 1200/1280/1800 with Rename and link | pass | acceptance lines 367-393 (one evaluate under `expect.poll`); my UI inspection (below) |
| 15 | `lint:dup` and typecheck pass; no duplicated name form; no stale doc sentences | pass | I ran `npx tsc --noEmit && npm run lint:dup`: exit 0, 0 clones. A grep of `docs/` for "keeps its stored name" and "two save buttons" found nothing. |
| 16 | No INVARIANTS.md regressions | pass | see below |

## Invariants touched

- A1, A2, A3 (paths match by directory only): hold. The diff changes no simulation, data or game numbers.
- S1: holds. `name-form.tsx` imports only `lib/aoe4-build-order/saved-builds`, which belongs to the same app.
- S2, S3: not affected. The rename is a single request through the existing `send` path, and the name is capped at 100 on the client and the server.

## Contract checks

- C10: `NameForm` props match the design, plus one optional `inputRef`. It is not in C10, but `openForm` uses it to refocus an open form, which is existing behavior. Acceptable; see notes.
- C11: `Saver`, `saveStatusText`, Rename shown/enabled rule, row order and one-form rule match.
- C12: `withRenamedEntry`, `recordRenamed` (with `replaceBuildQuery`), the `withLoadedEntry` name rule, the `withRereadMyBuilds` name rule and `remember` after a rename all match.
- CONTEXT.md Key surfaces: no renamed surface. `withLoadedEntry` keeps its signature.
- Out of scope: nothing implemented from the ticket's out-of-scope list. No change under `golang/`, and no pin name change.
- Existing tests edited (rule: a test of the changed behavior gets the new expected value). Each edit matches the rule:
  - `aoe4-my-builds.spec.ts`: both edits are the server-name rule.
  - `aoe4-save-status.spec.ts`: row order.
  - `aoe4-split-tab-order.spec.ts`: row order in Tab order.
  - `build-library.test.ts`: the "list merges" test for `mine` names is split, and the order-independence equality is dropped because D17 makes it untrue.
  - `save-build.test.ts`: row order and props.
- Doc claims: I checked each claim against the code: the UI doc save section, the Tab order sentence, the `?n=` sentence, the re-read sentence, the status sentence, the Escape focus sentence, the ARCHITECTURE row, the `page-help.tsx` sentence and the comments on `writeMine` and `withRereadMyBuilds`. All hold.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. No ESLint config exists in this repo. `npx next build` passes. Unit tests for the three changed test files: 111 passed.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so this section was skipped. No bot findings.

## UI inspection

The task checkout was served with `npx next dev` on port 3871 and inspected with `.review-inspect/inspect.cjs` in the scratch checkout. Named-build POST and PATCH were stubbed with `page.route`, so nothing was written to the task checkout's store. The build name was 50 characters. Each width (1200, 1280, 1800) was checked in five states: after Save as copy (Rename and link shown), rename form open and unchanged, rename form with an empty name (invalid), rename in flight (PATCH held), and after rename.

- Content overflow on a clipping element in the save panel: none, in every state and width.
- Overlapping sibling boxes in `save-row`, `rename-form` and `save-copy-form`: none.
- Mid-word wraps in save-panel text: none.
- The save row stays on one line, and the document has no horizontal overflow, in every state and width.
- Computed style of Rename enabled vs disabled (while saving): opacity 1 vs 0.5 at all widths, so the two states look different.
- Screenshots read: `1200-renamed.png`, `1200-rename-form-invalid.png`, `1800-rename-form-unchanged.png`. They show the row in order (Save a new version, Rename, Save as copy, status, link, Copy link). The form sits below the row with the input text selected, the invalid state shows a red border with the range message and Save name disabled, and status `Renamed` appears with the link. Rename looks filled in two shots because the mouse was still hovering it after the click.
- The server was stopped (`serve.sh stop 3871`: port free).

## Non-blocking notes

- `withMyBuilds` still keeps the stored name when the My builds read lands after a load. The implementer reported this. On the page, the read runs in a mount effect (page line 202-208) before any `?n=` or choose fetch can resolve, so I found no reachable path that shows a stale name today. A follow-up could make `withMyBuilds` take a listed `mine` entry's loaded name, which would restore the order-independence the old "list merges" test asserted.
- `docs/aoe4-build-order-ui.md:25` (choosing one of My builds) does not say that the chosen build takes the server's name. The `?n=` sentence at line 369 says it only for opening. A clause there would make D17 complete in the doc. This is optional because no sentence is untrue.
- `NameForm` has an `inputRef` prop that C10 does not list. It is reasonable, but the design's C10 prop list is now incomplete.
- The commit subject uses a `feat:` prefix that recent `main` commits do not use. Squash merge takes the PR title, so this does not matter unless the PR title copies it.
- The `writeMine` comment ("Sends a write ... Resolves to the response only on success.") mostly describes what the code does; it could be cut to the last sentence.

## Coverage

Files reviewed in full:

- Production: `name-form.tsx`, `save-build.tsx` (whole file), `build-library.ts` diff, `build-input.tsx` diff, `pages/apps/aoe4-build-order.tsx` (lines 76-330), `page-help.tsx` diff.
- Docs: `docs/aoe4-build-order-ui.md` diff and surrounding sections, `ARCHITECTURE.md` diff.
- Tests: `name-form.test.ts`, `save-build.test.ts` (changed parts plus the setup), `build-library.test.ts` diff, `acceptance/aoe4-rename-build.spec.ts` (whole), and the diffs of the three edited specs.
- Supporting reads: `auto-run.ts` (conversion timing), `named-build-client.ts`, `acceptance/helpers.ts`, and `workbench.module.css` (save row).

Repo review checklist: I applied "Every diff" and "AoE4 build order".

- `next build` passes.
- I loaded the page at 1200, 1280 and 1800 for each touched UI state.
- No helper is copied across modules: `validName` moved and was not copied.
- No Bootstrap utilities are mixed with module CSS on the new elements.
- The 390 px check was not done; it only checks the below-minimum rules, which this diff does not change.

Not reviewed or run:

- No acceptance specs were run, as this gate's rules require. I judged acceptance by reading the specs and the implementer's run and mutation record.
- The LSP tool was not available. I found callers of `withLoadedEntry`, `SaveBuild` and `BuildInput` by grep and reading.
