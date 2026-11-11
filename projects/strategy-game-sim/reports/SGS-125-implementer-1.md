# SGS-125 implementer report 1

- Ticket: SGS-125, save panel rewrite: Save as copy and Save a new version
- Branch: `sgs-125-save-panel` (from main 4489f09)
- Tip SHA: be351ae
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-125-save-panel
- Status: **needs_review**

## Files touched

- `components/apps/aoe4-build-order/save-build.tsx`: rewritten. It has two buttons, Save a new version (`save-build`) and Save as copy (`save-build-copy`). It also has the copy name form, the link panel, the unstored warning and the error line. A conflict sets the lock, and abort/unmount guards are in place.
- `components/apps/aoe4-build-order/build-input.tsx`: passes `entry`, `editSecret`, `edited`, `onCreated` and `onUpdated` through. `onSaved` and `entries` are removed.
- `components/apps/aoe4-build-order/build-library.ts`: adds `savedMineEntry`. `entryWithText` is no longer exported, because only `pin-name` used it and `pin-name` is gone.
- `components/apps/aoe4-build-order/build-library.test.ts`: adds the `savedMineEntry` tests.
- `components/apps/aoe4-build-order/save-build.test.ts`: rewritten for the two buttons, 17 tests.
- `components/apps/aoe4-build-order/save-build-client.ts`: removes `postSavedBuild` and `isSaveBuildResponse`. `saveFailureMessage` stays.
- `components/apps/aoe4-build-order/save-build-client.test.ts`: removes the `postSavedBuild` tests.
- `components/apps/aoe4-build-order/pin-name.ts` and `pin-name.test.ts`: deleted. They named the snapshot save, which no longer exists.
- `components/apps/aoe4-build-order/workbench.module.css`: adds `.copyForm`, `.copyNameField` and `.saveNotice`, sharing the link-panel rules.
- `pages/apps/aoe4-build-order.tsx`:
  - adds a secrets map, read from My builds on mount and on `storage` events;
  - `recordCreated` adds the build to My builds and selects it only when the settled input is unchanged;
  - `recordUpdated` updates the loaded revision;
  - `withRereadMyBuilds` handles another tab's writes.
- `docs/aoe4-build-order.md`: rewrites the "Saving a build and opening it by link" section and updates the run bar and save-button mentions.
- `acceptance/helpers.ts`: `holdRequests` now releases with `route.fallback()` instead of `route.continue()` (see Deviations). Its comment changed to match.
- `acceptance/aoe4-my-builds.spec.ts`:
  - adds a per-test client fixture through `uniqueClient` and `x-forwarded-for`;
  - adds the named save flow tests;
  - the two existing busy loops now check Save as copy.
- `acceptance/aoe4-save-open.spec.ts`: snapshot-save tests are deleted or moved, and unused helpers are removed (lists below).

## Tests

Unit, `npm test`: 72 files, 2340 passed, 13 skipped (the same skips as before), 0 failed.

`save-build.test.ts` (17 tests) encodes these rules:
- Save as copy renders for every entry kind.
- Save a new version renders only for a `mine` entry whose secret is known. It is absent for a mine build without the secret, for shared, link and template entries, and when no entry is selected.
- Both buttons are disabled while the status is loading, running, updating, invalid, rejected or failed, and while a saved build loads.
- Save a new version is also disabled when the build is unedited.
- While busy, both buttons carry `aria-busy`.

`build-library.test.ts`, new tests for `savedMineEntry`:
- The entry key is `named:<id>`, and `loaded` keeps the saved text, duration and revision.
- The typed text is kept as typed, not reformatted, so `isEdited` against the saved input is false and one extra character makes it true.

Acceptance runs (the specs the ticket names):
- Five specs together (my-builds, save-open, auto-run, small-screen, build-order-pin-compare), 4 workers: **148 passed**, 0 failed.
- `aoe4-my-builds.spec.ts` with `--repeat-each=2`: 146 passed, 0 flaky.

New acceptance tests in `aoe4-my-builds.spec.ts`. Each one uses its own client.

**Save as copy**
- From a template opened with `?utm=1`:
  - Save a new version is absent;
  - the form has role group, the prefill `<name> (copy)` is focused and selected, and the button labels are right;
  - the POST carries the typed name and duration 1200;
  - the new build is selected, unedited and listed under My builds;
  - the link matches `?n=<22 chars>` and is focused;
  - the URL has `n` and `utm=1` and no `b`;
  - the stored entry has revision 1 and a 43-character secret;
  - no snapshot POST is sent.
- Name rules: an empty name, a blank name and 101 characters each disable submit and show the error with `aria-invalid` and `aria-describedby`; 100 characters is accepted.
- A 100-character name is posted unchanged.
- Enter submits a padded name trimmed, with no simulate POST and no page load.
- Escape returns focus to Save as copy. Tab order is name, submit, cancel.
- (Moved) Enter in the duration field runs the build and never saves. Enter and Space on Save as copy open the form.
- The open form follows the input: an invalid build disables submit while the form and the typed name stay; after a restore, the POST steps equal the restored text; choosing another entry closes the form.
- A failed copy (503) closes the form and shows the error with `role="alert"`, and the next open prefills the entry name again.

**Save as copy needs a current result** (moved from save-open, 5 rows)
- Rows: unknown unit id, duration below the minimum, simulate pending (`holdNextSimulate`), failed run, rejected run.
- Each row checks that the button is disabled at reduced opacity, that a forced click opens no form, and that after a restore it is enabled again at opacity 1, with no POST.

**Reopening and new versions**
- After a reload, the build is listed. Choosing it fetches `/named-builds/<id>`. Save a new version is disabled until the build is edited.
- Save a new version:
  - sends `Authorization: Bearer <stored secret>` and `If-Match: "1"`, with the stored name;
  - afterwards the build is unedited and the button disabled, the stored revision is 2 with the response's `updatedAt`, the URL is exactly `?n=<id>`, and the link shows;
  - the next save sends `If-Match: "2"`;
  - the secret is absent from `page.url()`, `page.content()` and every console and pageerror message;
  - no snapshot POST is sent.
- In a fresh context with another client, the `?n=` link opens as `<name> (shared)` under Opened links, with no Save a new version. A copy made there gets a new id and a stored secret, and the original is unchanged according to a GET.
- With two tabs, the second tab's PUT gets 412:
  - it shows the conflict text, and Save a new version stays disabled while Save as copy stays enabled;
  - the server keeps the first tab's steps;
  - choosing the build again loads the latest version, and an edit re-enables Save a new version.
- A copy saved in one tab appears under My builds in the other tab, and that tab's selection and text are unchanged.

**Save failures** (11 rows)
- PUT rows: 403, 404, 400 with an issue, 413, 429 with Retry-After 90, 503, 500, abort.
- POST rows: 400 with an issue, 429 with Retry-After 5, 503.
- Each row:
  - checks the exact message;
  - checks that the text, the selected option and the raw localStorage are unchanged;
  - checks that Save as copy is enabled;
  - then a real save clears the message, and after a restub a settled edit clears the message again.

**Storage unavailable** (an init script makes `Storage.prototype.setItem` throw)
- The copy saves, the build is selected and the link and warning show. A PUT with the secret from the create response succeeds. After a reload, the build is not listed.
- A late create held with `holdRequests(page, NAMED_BUILDS_PATH, 'POST')` still shows the warning, with no link and the template still edited. The next settled change clears the warning.

**In flight and late answers**
- While a create is held:
  - both buttons are disabled;
  - forced clicks send no PUT and no second POST;
  - leaving through `a[href="/"]` fails the request, with no console error and no pageerror.
- A create released after a settled edit is stored with revision 1 and listed, but nothing is selected, no link shows and the URL has no `n`.
- A create released with no edit selects the build and shows the link.
- A new version released after a settled edit (`holdRequests(page, namedBuildUrl('*'), 'PUT')`) stores revision 2 and keeps the text. The build is still edited and Save a new version enabled; restoring the text makes it unedited.
- A late 503 or 412 (a stub registered before the hold) shows no message. Save a new version stays enabled after a 503 and locked after a 412.
- A held PUT stays unanswered until it is released.

**Link panel**
- Escape after a copy focuses Save as copy.
- Escape after a version save focuses Save as copy, because Save a new version is disabled at that point (see Deviations).
- (Moved) Edits during a paused clock:
  - a text edit, a duration edit and a build selection each drop the link only once the pause ends;
  - text and duration edits keep `n`, and a selection change drops it.
- (Moved) An edit and an undo inside the pause keep the link and `n`.
- (Moved) With clipboard permission, Copy link reads Copied and the clipboard holds the link. Copied resets on the next save.
- (Moved) When writeText rejects, or there is no clipboard, the page shows the hint and the link is focused and selected.

**Layout** (moved)
- At 390 px, with the copy form open and then with the link shown:
  - there is no horizontal scroll;
  - the editor top is at or below the run-bar bottom;
  - at 768 and 1280 the run bar is at most 40% of the viewport height.

## Pre-existing tests edited, moved or deleted

`acceptance/aoe4-save-open.spec.ts`, deleted because they pin snapshot-only behavior. The ticket says such tests are deleted.
- `saving a build and opening it by link › save, copy and open the link in a fresh context` (snapshot `?b=` round trip).
- `… › an unchanged opened build re-saves to the same id and an edit saves as edited` (content-addressed snapshot ids and the `(edited)` name).
- `… › an edited build round trips through a fresh context`.
- `… › the same content gives the same link`.
- `after a save › a save response that lands after the settled input changed shows no link and puts no b in the URL`. Replaced by the late-create tests in my-builds.
- `after a save › a late save for a changed build selection shows no link and puts no b in the URL`. Same replacement.
- `save errors` describe (snapshot POST failure rows). Replaced by the `save failures` rows.
- `opening a link › a snapshot save keeps the other query keys and adds the new b`. Its point, that other query keys survive, is checked in the first Save as copy test (`utm=1`).

`acceptance/aoe4-save-open.spec.ts`, moved to `aoe4-my-builds.spec.ts` with named-build expectations. The ticket says tests whose point also holds for the named saves move.
- `Enter in the duration field runs the build and never saves, Enter and Space on Save save` → `Enter in the duration field runs the build and never saves; Enter and Space on Save as copy open the form`.
- `Escape in the link input hides the panel and returns focus to Save` → the two `link panel › Escape …` tests.
- `Save is enabled only while the shown result is current` describe, including `a current result enables Save at full opacity` → `Save as copy needs a current result` (the opacity check is folded into each row).
- `after a save` edit rows → `link panel › a text edit / a duration edit / a build selection drops the link only once the pause ends …` (`b` → `n`).
- `an edit and an undo inside the pause keeps the link and b` → `… keeps the link and n`.
- `a save error disappears when the settled input changes` → the last step of every `save failures` row.
- The `Copy` describe → the `link panel` clipboard tests.
- `layout with the link shown` → `layout of the save panel` (now with the form open as well).

`acceptance/aoe4-save-open.spec.ts`, edited:
- `a first b wins over a later one, …`: the `saveThroughUi(page)` line after the edit is dropped. The test still checks that a later `b` loads nothing and that the edit survives.
- `the load holds the first run, …`: `saveButton` → `save-build-copy` in both locator loops.
- `a saved build whose text no longer converts …`: `saveButton` → `save-build-copy`.

`acceptance/aoe4-save-open.spec.ts`, helpers and imports deleted as unused:
- helpers: `saveButton` (old), `link`, `copyButton` (old copy-link), `saveError`, `opacity`, `isBuildsPost`, `isBuildsUrl`, `isSimulateUrl`, `hasQuery`, `freshPage`, `clickSave`, `saveThroughUi`, `openPausedPage`, `settle`, `expectLinkId`;
- constants: `ID_LINK`, `VALID_B`, `UNKNOWN_ID`;
- imports: `expectValid`, `SIMULATE_PATH`, and the types `Browser`, `Locator`, `Response`.
- The stale comment on `afterFrames` ("the paused page clock …") is removed, because no paused clock is left in this spec.

`acceptance/aoe4-my-builds.spec.ts`, edited:
- The fixture gains `client`/`extraHTTPHeaders`; the ticket requires its own client per test.
- The local `NAMED_PATH` is replaced by the shared `NAMED_BUILDS_PATH`.
- The two busy loops (the `?n=` load hold and `the page is busy while the response is held`) check `save-build-copy`, because `save-build` is not rendered for a template or shared entry.

Unit tests:
- `save-build.test.ts`: rewritten, because the component's props and buttons changed.
- `save-build-client.test.ts`: the `postSavedBuild` describe is removed along with the function.
- `pin-name.test.ts`: deleted along with `pin-name.ts`.

## Doc claims (docs/aoe4-build-order.md)

- "Save as copy (`save-build-copy`) is shown for every entry … and Save a new version (`save-build`) only for one of My builds whose edit secret this browser holds." Backed by `save-build.tsx:showVersion` (`entry?.kind === 'mine' && editSecret !== null`).
- "Both are enabled only while … status `current`, the input converts, and no save and no build load is in flight; Save a new version also needs the build to be edited." Backed by `save-build.tsx:canSave` and `canSaveVersion`.
- "prefilled as `<name> (copy)`, cut to fit the name cap, … or `Custom build` when no entry is selected." Backed by `save-build.tsx:openForm` → `build-library.ts:copyName`.
- "The trimmed name must be 1 to 100 characters; otherwise the field shows `Enter a name of 1 to 100 characters.`" Backed by `save-build.tsx:validName`, the error div, and `SAVED_NAME_MAX_CHARS`.
- "Enter in the name or Save copy saves; Escape or Cancel … closes the form and returns focus to Save as copy." Backed by `onNameKey`, `closeForm` and the form's `onKeyDown`.
- "The form closes when the save starts, and choosing another entry closes it." Backed by `submitCopy` (`setForm(null)`) and `formOpen` (`form.key === entry?.key`).
- "It becomes the newest of My builds and is selected, and the address gets `n=<id>`; when the settled input changed while the save was in flight, the new build is only added to My builds." Backed by `pages/apps/aoe4-build-order.tsx:recordCreated`.
- "Save a new version replaces the selected build … keeping its name, and the build is no longer edited." Backed by `saveVersion` (`{ ...conversion.order, name }`) and `recordUpdated` (sets `loaded`).
- The conflict text, and "Save a new version stays disabled until the build is chosen again". Backed by `saveVersion` → `setLock` and `locked` (key plus loaded revision).
- "The page keeps it only in this browser's My builds list, which holds the newest 50 builds: the 51st save evicts the oldest …". Backed by `remember` → `my-builds-storage.ts:upsertMyBuild` (cap 50, existing code). The secrets map in the page is filled only from `readMyBuilds` and from create responses.
- "The secret is sent only as the update's `Authorization` header, never in the address." Backed by `named-build-client.ts:updateNamedBuild` and `replaceBuildQuery`, which takes the entry and id only. Checked by the version test.
- The unstored warning text. Backed by `save-build.tsx:UNSTORED_TEXT` and `showSuccess`.
- "A save in another tab updates this tab's My builds." Backed by the page's `storage` listener and `withRereadMyBuilds`.
- "Escape in the link panel hides it and returns focus to the button that saved, or to Save as copy when that button is disabled." Backed by `save-build.tsx:hideLink`.
- "A save answered after the settled input changed shows no link and no error." Backed by `showSuccess`/`showFailure` (`current`) and `linkVisible`/`errorVisible`.
- "Opening the link anywhere but the browser that made it opens the build read-only, as a shared build; Save as copy still works there." Backed by `loadInitialEntry` (mine vs shared) and `showVersion`.
- "The page no longer creates `?b=` links. Links made by an earlier version … and by the `saveBuild` route still open." `postSavedBuild` is removed. The `?b=` load path and the builds route are unchanged, and the save-open load tests pass.
- The failure message list. Backed by `named-build-client.ts` (conflict, forbidden, not found) and `save-build-client.ts:saveFailureMessage`.

The comments that remain are in `save-build.tsx:send`, `aoe4-build-order.tsx:withRereadMyBuilds` and `helpers.ts:holdRequests`, and each states what that code does.

## Pinned outputs

None. The ticket gives every message verbatim; no value was pinned from engine output.

## Mutation checks

Every break was undone automatically by the script, which printed `reverted: True`. The tree is clean at commit.

Unit:
- `save-build.tsx` `showVersion` → `editSecret !== null`. Failed: the four `for a shared build / old link / template / no entry …` rows, `expected true to be false`.
- `canSaveVersion`, `edited` dropped. Failed: `when current and unedited …`, `expected false to be true`.
- `canSave`, `!busy` dropped. Failed: `when current while a saved build loads …`.
- The copy button's `disabled={!canSave}` → `false`. Failed: the 7 non-current rows.
- The copy button's `aria-busy` dropped. Failed: `marks both buttons busy while a saved build loads`.
- `build-library.ts:savedMineEntry` `text` → `text.trim()`. Failed: `isEdited against the saved input is false`.
- `savedMineEntry` key → `entryKey.link(id)`. Failed: `savedMineEntry keys by the id and keeps the saved input as loaded`.

Acceptance:
- `save-build.tsx` `setLock` on conflict removed. Failed: `a second tab that saved first …`, at `expect(saveButton(other)).toBeDisabled()`.
- `pages/apps/aoe4-build-order.tsx:recordCreated`, the `sameInput` guard removed. Failed: `a create released after a settled edit …`, at the My builds list assertion: the option gains ` (edited)` because the build got selected.
- `save-build.tsx:saveVersion`, stored revision → 1. Failed: `Save a new version sends the secret only as the header …`, at `[stored?.revision, stored?.updatedAt]`.
- `validName` cap → `+ 1`. Failed: `name rules …`, at `expect(copySubmit(page)).toBeDisabled()`.
- `showSuccess` `if (current)` → `if (true)`: the test **still passed**. That guard is redundant for the link, because `linkVisible` already hides a link whose input is not the settled one. The test that covers late creates is the `recordCreated` break above. I kept the guard, since it also keeps a stale success from resetting the Copied state; flagging it for review.

## Codegen, build, lint

- codegen: not set for this repo.
- build (`link-node-modules.sh . && npx next build`): passed. Both named-build routes and the page are built.
- lint (`npx tsc --noEmit && npm run lint:dup`): 0 type errors, 0 jscpd clones.
- Required greps:
  - `git grep -w "Save build" -- components docs acceptance`: no hits.
  - `recordSave|savedBuildName|pinName|postSavedBuild|isSaveBuildResponse` in pages, components, acceptance and docs: no hits.
  - `function hold*` in acceptance: only `helpers.ts`.
- `git diff --stat 4489f09`: 15 files, +1313/−688. No tool-made changes: no lockfile, no AGENTS.md, no formatting of untouched files.
- No processes are left running; the Playwright web server exits with each run.

## Deviations and spec gaps

1. **`holdRequests` releases with `route.fallback()`, not `route.continue()`.**
   - With `continue()`, a stub registered before the hold (a late 503 or 412) could never answer a released request.
   - With `fallback()`, a released request goes to any earlier route, or to the network when there is none, so existing callers behave the same.
   - All five specs pass.
2. **The PUT hold uses `holdRequests(page, namedBuildUrl('*'), 'PUT')`, not the literal `NAMED_BUILDS_PATH`.**
   - The helper's glob is `**${path}`, so `NAMED_BUILDS_PATH` alone does not match `/named-builds/<id>`.
   - The POST holds use `NAMED_BUILDS_PATH` as the ticket says.
3. **Escape after a version save focuses Save as copy.**
   - After a successful version save, the build is unedited, so Save a new version is disabled and cannot take focus.
   - Following the "the button that saved" rule literally is impossible here. The code falls back to Save as copy, and the docs and the test say so. The spec should state this.
4. `entryWithText` in `build-library.ts` is no longer exported, because its only importer, `pin-name.ts`, was deleted.

## Invariant check

- **A save never reaches the simulate route.**
  - Upheld: `createNamedBuild` and `updateNamedBuild` go to `/named-builds`.
  - The Enter-to-submit test asserts no simulate POST.
  - `recordCreated`'s `autoRun.flush` sends no POST when the request key is unchanged; the Enter test checks this.
- **`selected` is not in the simulate request.** Upheld: the auto-run request builder is unchanged, and `selected` only feeds `sameInput` and the link/error visibility.
- **The edit secret never appears in the URL, the page HTML or the console.** Upheld and asserted in the version test. The secret lives in React state and localStorage only.
- **Old `?b=` links and the `saveBuild` route keep working.** Upheld: the save-open load tests and the `?b=` tab tests pass.
- **A 412 never overwrites another tab's save.** Upheld: the two-tab test GETs the build and finds the first tab's steps.

## Out-of-scope findings

- None blocking.
- The `showSuccess` `current` guard is partly redundant (see Mutation checks). It is a candidate for simplification in review; no behavior depends on it beyond the Copied reset.
