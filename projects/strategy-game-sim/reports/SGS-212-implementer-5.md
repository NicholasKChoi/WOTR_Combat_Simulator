# SGS-212 implementer report (5)

Status: needs_review

- Ticket: SGS-212, branch `sgs-212-rename-ui-saved-builds`, base `origin/main` (SGS-209 and the repeat work are in the base).
- Tip: `125c2f42477f9446f55bf5517fbf5738975ff958`
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-212-rename-ui-saved-builds`
- Fresh checkout (no pre-existing branch), so no own-commit check applied. Respec 1 was already in the ticket; no branch work existed.

## Files touched

- `components/apps/aoe4-build-order/name-form.tsx` (new): `NameForm` and `validBuildName`. The form owns its draft, focuses and selects on mount, Enter submits only when submit is enabled, Escape anywhere in the form cancels. Group name derives from the test id prefix (`Save as copy` / `Rename`). Optional `inputRef` prop so SaveBuild can re-focus the input when its button is clicked while the form is open.
- `components/apps/aoe4-build-order/save-build.tsx`: Save as copy moved onto `NameForm`; `Saver` gains `'rename'`; `saveStatusText` returns `Renamed`; `rename-build` button right after Save a new version; one `form` state (`copy` or `rename`, keyed to the entry) so only one form is open; `canRename` (not busy, not saving, not locked, loaded revision a number) is both the button's enabled rule and the rename form's `canSubmit`; `submitRename`; `writeMine` shared by `saveVersion` and `submitRename` (needed to clear `lint:dup`: the two flows had a 10-line clone); `hideLink` picks Rename by `saved.by`.
- `components/apps/aoe4-build-order/build-input.tsx`: `onRenamed` prop passed to SaveBuild.
- `components/apps/aoe4-build-order/build-library.ts`: `withRenamedEntry`; `withLoadedEntry` takes the loaded `name` for a `mine` entry.
- `pages/apps/aoe4-build-order.tsx`: `recordRenamed`; `withRereadMyBuilds` keeps the selected entry's `loaded` and takes the re-read name.
- `components/apps/aoe4-build-order/page-help.tsx`: help sentence mentions Rename.
- `docs/aoe4-build-order-ui.md`, `ARCHITECTURE.md`: docs (below).
- Tests: `name-form.test.ts` (new), `save-build.test.ts`, `build-library.test.ts`, `acceptance/aoe4-rename-build.spec.ts` (new), and edits to three existing specs (below).
- `workbench.module.css`: not changed. The row already holds Rename plus the link on one line at 1200, 1280 and 1800 (acceptance checks it); the link field shrinks as before.

## Tests run

- `npx vitest run components/apps/aoe4-build-order/`: 35 files, all pass. Full `npm test`: 94 files passed, 1 skipped; 3017 passed, 15 skipped (pre-existing skips).
- Unit invariants: `validBuildName` bounds on the trimmed length (0, whitespace, 1, 100, 101, padded); NameForm unchanged-name state (disabled, no error, no `aria-invalid`/`is-invalid`), invalid states (message, `aria-invalid`, `aria-describedby`, `is-invalid`, `invalid-feedback`, disabled), `canSubmit` false disables, texts and test ids, group names; SaveBuild Rename shown only with Save a new version, enabled/disabled table (current, unedited, stale run, unconvertible, busy, no revision), row order with and without Rename, button text, no form rendered until opened; `saveStatusText` for `rename` (idle, in flight, text edited since); `withRenamedEntry` (only matching key, position, `loaded.revision` advanced, text/duration kept, null `loaded` stays null, no match unchanged, no mutation, other entries by identity); `withLoadedEntry` server name for `mine`.
- Acceptance spec added: `acceptance/aoe4-rename-build.spec.ts`. Single-file command: `npx playwright test acceptance/aoe4-rename-build.spec.ts --reporter=line` (through run.sh, after `link-node-modules.sh`). Result: 29 passed. Run together with `aoe4-split-scroll`, `aoe4-my-builds-unreadable`, `aoe4-save-open`: 66 passed.
- Edited existing specs ran: `aoe4-save-status.spec.ts`, `aoe4-split-tab-order.spec.ts`, `aoe4-my-builds.spec.ts`: 97 passed after the edits below (one failed first on the stale-name assertion, fixed).
- Enter and Escape are covered in acceptance only: the unit environment has no DOM (only `renderToStaticMarkup`), so key handling cannot be driven there.

## Pre-existing tests edited

- `acceptance/aoe4-my-builds.spec.ts` "an id in My builds opens under My builds with its stored name": retitled "...with the name the server returns"; now expects `Name on the server` in the option and the My builds group (rule: test of the changed behavior, D17).
- `acceptance/aoe4-my-builds.spec.ts` "the page is busy while the response is held, then shows the fetched text and runs once": line 450 expects `CHOSEN_NAME` (the server name the stub returns) instead of `OLDER.name` (same rule; not named in the ticket's examples, found by running it).
- `acceptance/aoe4-save-status.spec.ts`: `LINK_ROW` gains `rename-build` after `save-build`; the layout test's destructuring and the `items[1]` index follow the new row (items[2] is Save as copy). Rule: full save-row order.
- `acceptance/aoe4-split-tab-order.spec.ts` both tests: `rename-build` added between `save-build` and `save-build-copy` (first), and before `save-build-copy` (second, where Rename is enabled after a copy); first test retitled. Rule: Tab order of the save row.
- `components/apps/aoe4-build-order/build-library.test.ts` "list merges": the test "gives the same list whichever of the My builds read and a load result lands first" no longer holds (see Out-of-scope) and was split into two tests: read-first now expects the server name; load-first still expects the loaded text. The "keeps My builds in stored order" table now carries the expected names per row (`B on the server` read-first, `B stored` load-first). Rule: `withLoadedEntry` rows for a `mine` entry.
- `components/apps/aoe4-build-order/save-build.test.ts`: `render` passes `onRenamed`; the row-order test expects `rename-build`; "for %s renders..." also asserts Rename shown exactly when Save a new version is; `saveStatusText` table gained three rows. Existing assertions otherwise unchanged.

## Doc claims

All in `docs/aoe4-build-order-ui.md` unless noted:
- "with the save buttons, Save a new version, Rename and Save as copy" and "within the save row the order is the buttons (Save a new version, Rename, Save as copy), the status, the link, then Copy link": `save-build.tsx` render order, pinned by `save-build.test.ts` row-order test and `aoe4-save-status.spec.ts`.
- "The run bar has three save buttons ... Rename (`rename-build`) only for one of My builds whose edit secret this browser holds": `showVersion` in `save-build.tsx`.
- The Rename paragraph (form ids, `New name` label, 1 to 100 rule, Save name disabled while invalid or unchanged, never named `Rename`, Enter/Escape/Cancel, one form at a time, enabled rule, edited build stays edited): `name-form.tsx`, `canRename` in `save-build.tsx`, covered by `aoe4-rename-build.spec.ts`.
- "The form closes when the rename starts ... `?n=<id>` opens the build under its new name ... a later rename or Save a new version uses the revision the rename returned ... answered after the settled input changed still renames the list and the stored entry but shows no link, status or error ... same conflict message as Save a new version and both stay disabled until the build is chosen again ... A pin keeps the name it was pinned with": `submitRename`/`writeMine`/`recordRenamed`, the acceptance tests for reload, twice-in-a-row, late answer and 412. The pin sentence is unchanged behavior (pin stores its own name; I did not touch pin code).
- "`Renamed` after a rename. It is empty while a save is in flight ...": `saveStatusText`.
- "the selected build keeps the text this tab loaded but takes the stored name, whichever name is newer": `withRereadMyBuilds`, acceptance "takes the name another tab stored".
- "`?n=<id>` ... one of My builds takes the name the server returns (so a stale stored name is replaced)": `withLoadedEntry`, `aoe4-my-builds.spec.ts` test.
- "returns focus to the button that saved (Save a new version, Rename or Save as copy), or to Save as copy when that button is disabled": `hideLink`.
- `ARCHITECTURE.md` new row "AoE4 name form": `name-form.tsx` exports `NameForm` and `validBuildName`; `save-build.tsx` renders it for Save as copy and Rename; "no other module defines a name form" holds (grep: no other `invalid-feedback` name form).
- `page-help.tsx`: "Rename changes its name."
- Code comments added: `writeMine` (sends a write to one of My builds and records its answer), `withRereadMyBuilds` (takes the re-read name whichever is newer).

## Pinned outputs

None (no engine-pinning criterion).

## Mutation checks

Unit (each break made in the production file, the named test(s) failed on their own assertion, break undone each time):
- `build-library.ts` `withRenamedEntry`: dropped `name` (renames only / null loaded tests failed); dropped `revision` (renames-only and keeps-text tests); null `loaded` forced non-null (null-stays-null); key match widened (no-match and renames-only); `Object.assign` mutating the entry (no-mutation test); copies of untouched template (identity `toBe(template)`) and of untouched mine entry (`toBe(second)`).
- `withLoadedEntry` drop of `name` (three tests: read-first, stored order read-first, listed mine entry); `withMyBuilds` `loaded` dropped (load-first loaded test) and taking listed name whole (load-first stored order row); return `list` instead of appending (append test and load-first loaded test).
- `save-build.tsx`: Rename always shown / never shown (shown, hidden rows, row order), `!busy` removed (busy row), revision check removed (no-revision row), tied to `edited` (unedited row), tied to status and conversion (stale and invalid rows), label changed (button text test), forms always rendered (no-form test), button order swapped (row-order test), `saveStatusText` returns `Saved` (rename row), in-flight check skipped for rename (in-flight row), sameInput skipped for rename (text-edited row).
- `name-form.tsx`: bounds `>= 0`, `>= 2`, `< MAX`, `<= MAX + 1`, no trim (each failed its boundary rows and the NameForm invalid rows); unchanged check removed or untrimmed (unchanged test); `canSubmit` ignored (outside-conditions test); `valid` ignored (invalid rows); group names, label, `aria-describedby`, `aria-invalid`, Cancel text, submit text, error message text, error test id, `is-invalid` and `invalid-feedback` classes (each its own assertion; the `is-invalid` and error-id assertions were added after the first mutation pass showed them unchecked). Equivalent mutation: `value={name}` to `value={initialName}` cannot be seen in a static render; the prefill assertion fails on `value=""`.
Acceptance (`aoe4-rename-build.spec.ts`, each break run with `-g` on the named tests, failed on its own test, undone):
- Rename shown for template (`show`), required edited (`edited-req`), disabled when edited (`not-edited`), tied to conversion and to `status === 'current'` (stale and unconvertible tests), submit using `canSave` (both submit-enabled tests), prefill removed, selection removed, submit text `Rename`, input label changed, unchanged name removed, Enter guard weakened and Enter handler dead, Escape handler dead, Cancel dead, focus returned to Save as copy, one-form rule, form kept open on choosing another My build, untrimmed name, request with `revision + 1`, second rename revision not advanced (rename twice and edited-then-save tests), status text, stored name wrong, list rename skipped, request body name wrong (reload test), Escape on link focusing Save as copy, storage failure not reported, 412 lock removed, lock on every failure (all five other-failure rows), name stored on failure, range message text, `aria-invalid`, `aria-describedby`, submit ignoring validity, re-read name ignored, `withLoadedEntry` name dropped, row `min-width: 500px` (all three widths).
- Survivors, judged equivalent: dropping `focus()` before `select()` in `NameForm` (Chromium's `select()` focuses; kept for other browsers); `if (current)` in `showSuccess` forced true (late answer still shows no link or status because render also gates on `sameInput`; the `current` guard only keeps `setError(null)`); removing `replaceBuildQuery` in `recordRenamed` (the address is already `?n=<id>`).
- Existing specs edited: swapping Rename after Save as copy failed `aoe4-save-status` "reads Saved after a copy..." and both `aoe4-split-tab-order` tests; dropping the server name from `withLoadedEntry` failed both edited `aoe4-my-builds` tests.

## Codegen, build, lint

- Codegen: none set. `npx next build`: passes. `npx tsc --noEmit && npm run lint:dup`: exit 0 after extracting `writeMine` (the first lint run found a 10-line clone between `saveVersion` and `submitRename`).

## Invariant check

A1 to A3: untouched (no engine, data or game numbers). S3: the rename is one request through the existing `send` path with its abort controller; no new loop or unbounded input; name length is capped at 100 on the client and server.

## Unverified assumptions added

None.

## Out-of-scope findings

- `withMyBuilds` (not in this ticket's scope) still keeps the stored name over the loaded one when the My builds read lands after a load, so the old guarantee "same list whichever of the read and the load lands first" no longer holds for the name (read-first gives the server name, load-first the stored name). Evidence: the split `build-library.test.ts` "list merges" tests. Under D17 the stale label after a failed storage write could survive when the read lands second. The ticket pins only `withLoadedEntry` and `withRereadMyBuilds`; a follow-up could have `withMyBuilds` keep a listed `mine` entry's name too.
- Acceptance suite not run in full (acceptance-test's job); only the specs named above.
