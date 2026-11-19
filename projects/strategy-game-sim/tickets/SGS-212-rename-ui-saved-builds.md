# SGS-212: Rename one of My builds from the save row, with the shared name form and library updates

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M12
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none of A1 to A3 guards behavior this ticket changes (their paths match only by directory); S3 is unchanged (the rename costs one write-budget slot server-side, already done in the rename API)
- **Unverified assumptions**: none
- **LOC estimate**: 220 (`name-form.tsx` ~80, `save-build.tsx` rename flow ~70, `build-library.ts` ~20, page `recordRenamed` and `withRereadMyBuilds` ~20, `build-input.tsx` prop ~5, CSS ~10)
- **Depends on**: SGS-209
- **On merge**: none
- **Source**: design/M12.md C10, C11, C12, D17 and Behavior rules "Rename: page"; MILESTONES.md M12.2, M12.3; reports/M12-planner-5.md outline E; owner decision Q146 (re-read stored name always wins)

## Context

The API can rename a named build in place (`renameNamedBuild` in `components/apps/aoe4-build-order/named-build-client.ts`, integrated), but the page has no way to use it: a build can only be copied under a new name. M12.2 wants a Rename button for one of My builds that keeps the id (so `?n=<id>` links keep working), shows the new name everywhere the build is named, and reports a stale or conflicting rename. The Save as copy name form in `save-build.tsx` is the only name form today; Rename shares it instead of copying its markup (`npm run lint:dup` is a gate).

## Scope

Follow design/M12.md C10, C11, C12 and the "Rename: page" rules table for every rule and test id; this lists where the work lands.

- New `components/apps/aoe4-build-order/name-form.tsx`: `NameForm` and `validBuildName` (moved from `validName` in `save-build.tsx`), per C10. Props per C10 (`testIdPrefix`, `label`, `submitText`, `initialName`, `unchangedName`, `canSubmit`, `onSubmit` with the trimmed name, `onCancel`). The form owns its draft, focuses and selects the input on mount, submits on Enter only when the submit button would be enabled, and closes on Escape anywhere in the form. Save as copy moves onto it and keeps its test ids (`save-copy-form`, `-name`, `-name-error`, `-submit`, `-cancel`), its label text `Name of the copy`, role `group` and its accessible group name `Save as copy`.
- `components/apps/aoe4-build-order/save-build.tsx` (`SaveBuild`, `Saver`, `saveStatusText`), per C11:
  - `Saver` gains `'rename'`; `saveStatusText` returns `Renamed` for it.
  - `rename-build` button (text `Rename`) shown exactly when Save a new version is shown; enabled when no save and no load is in flight, not `locked`, and `entry.loaded?.revision` is a number; not tied to `status`, `conversion` or `edited`. Row order: Save a new version, Rename, Save as copy, status, link, Copy link.
  - Rename form (`rename-*` ids, group name `Rename`, input accessible name `New name`, submit button text `Save name`) prefilled with the entry's name and disabled-with-no-error while the trimmed name equals it. The submit text is never `Rename`, so the submit and the `rename-build` button never share an accessible name. The form's `canSubmit` (C10's outside conditions) is the Rename button's enabled rule (no save or load in flight, not `locked`, a loaded revision); it does not reuse Save as copy's `canSave`, so a stale run, an unconvertible text or an edited build does not block the submit. One form at a time: opening one closes the other; choosing another entry closes either.
  - Submit closes the form, sends through the existing `send` path with `renameNamedBuild(id, editSecret, revision, name)`, and on success calls `remember({ id, name, editSecret, revision: response.revision, updatedAt: response.updatedAt })`, `showSuccess` with `by: 'rename'`, and `onRenamed(response, name)`. The failure paths follow the page rules table: 412 sets `lock` (same as Save a new version), other failures show `save-build-error` and leave Rename enabled, an unwritable storage shows `my-builds-unavailable`, a response arriving after the settled input changed shows no link, status or error but still renames list and storage.
  - Focus: Escape or Cancel on the rename form returns focus to Rename; Escape on the link after a rename returns focus to Rename (`hideLink` picks the button by `saved.by`), falling back to Save as copy when Rename is disabled.
- `components/apps/aoe4-build-order/build-input.tsx`: `BuildInputProps` gains `onRenamed` and passes it to `SaveBuild`.
- `components/apps/aoe4-build-order/build-library.ts`, per C12: new `withRenamedEntry(list, id, name, revision)`; `withLoadedEntry` for a `mine` entry takes the loaded entry's `name` as well as `loaded` (D17).
- `pages/apps/aoe4-build-order.tsx`: page-local `recordRenamed` (renames the list entry via `withRenamedEntry`, and calls `replaceBuildQuery` when that entry is selected, as `recordUpdated` does); passed as `onRenamed`. `withRereadMyBuilds`: the selected `mine` entry keeps this tab's `loaded` and always takes the re-read entry's `name` when the re-read list has it; no comparison of revisions (owner decision, so a stale re-read name can replace this tab's newer name; that is accepted).
- Styling: `workbench.module.css` (the save row and form classes) so the row does not wrap at 1200 px with Rename added and the link shown.
- Existing tests (rule): a test of the changed behavior gets the new expected value; any other test keeps its assertions. Examples found: `acceptance/aoe4-my-builds.spec.ts` "an id in My builds opens under My builds with its stored name" asserts the stored name beats the server name and is rewritten to the server-name rule (retitled to say so); the `withLoadedEntry` rows in `build-library.test.ts` that cover a `mine` entry; `save-build.test.ts` rows that pin the save-row order and the `saveStatusText` table; `acceptance/aoe4-save-status.spec.ts`, which pins the whole row's test ids for one of My builds with a secret (its `LINK_ROW` constant), is a test of the changed row order. Row-order rule for every such test: wherever Save a new version is shown, the row lists Rename (`rename-build`) right after it; a row without Save a new version keeps its expected ids. Specs that only read named children of the save row (examples: `aoe4-split-scroll.spec.ts`, `aoe4-my-builds.spec.ts`) keep working through the unchanged `save-copy-*` ids. The implementer lists every test it edits.
- New tests: unit rows in `build-library.test.ts` (`withRenamedEntry`; `withLoadedEntry` name rule) and `save-build.test.ts` (`saveStatusText` for `rename`; the row order with Rename shown and hidden); a unit file for `name-form.tsx` (`validBuildName` bounds, `NameForm` unchanged-name and invalid-name states, Enter and Escape) following the nearest component tests; new `acceptance/aoe4-rename-build.spec.ts` (flows in the criteria).
- Docs: `docs/aoe4-build-order-ui.md` (the save section: "two save buttons", the save row order sentence, the status sentence, the Tab order sentence at the run bar, the `?n=` sentence "one of My builds keeps its stored name" which becomes untrue under D17, and a Rename description with form, keyboard and conflict behavior); `ARCHITECTURE.md` (add a row for `name-form.tsx`; the save-panel rows if any name the buttons).

**Out of scope:** the rename API and client (already integrated); repeat-step tickets; renaming `shared`, `link` or template entries; renaming a pin (a pin keeps the name it was pinned with); a revision comparison in `withRereadMyBuilds`; changing `?b=` links.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Rename is shown exactly for the selected entry that shows Save a new version (one of My builds with an edit secret in this browser), and is not shown for templates, opened links and shared builds. It is disabled while a save or load is in flight, while locked by a conflict, and when the entry has no loaded revision; it is not disabled by a stale run, an unconvertible text or an edited build. A unit test over the panel states covers shown, hidden and each disabled case.
- [ ] Clicking Rename opens a form prefilled with the entry's name, focused with its text selected; opening it closes the Save as copy form and the reverse; choosing another entry closes either. The form's submit is disabled with no error when the trimmed name equals the current name, and disabled with the 1-to-100-character message and `aria-invalid` when the trimmed name is empty or over 100 characters; Enter submits only when submit is enabled; Escape and Cancel close the form without a request and return focus to Rename.
- [ ] (respec 1) The rename form's submit reads `Save name`, and an acceptance test locates it by role and that name (a test fails if the submit is named `Rename`). The submit is enabled for a valid changed name exactly when the Rename button is enabled: a rename submits for a build whose run is stale, whose text does not convert, or that is edited; a unit or acceptance test fails if the submit is disabled for an unconvertible or stale-run build with a valid changed name.
- [ ] (respec 1) Every test that pins the full save-row order for one of My builds with a secret expects Rename right after Save a new version; `acceptance/aoe4-save-status.spec.ts` passes with that order, and its rows without Save a new version keep their expected ids.
- [ ] A successful rename sends the trimmed name with the entry's stored secret and loaded revision, closes the form while the request runs, then shows the new name in the select option, the run name and compare labels, and the stored My builds list; the status reads `Renamed` and the link shows; the address and id are unchanged. A test fails if the rename request is sent with the old revision on a second consecutive rename (the second rename uses the revision the first returned and does not conflict).
- [ ] After a rename, reloading `?n=<id>` opens the build under My builds with the new name and runs it (acceptance, against the real route).
- [ ] A rename answered after the settled input changed shows no link, status or error, but the list entry and stored entry are renamed. A rename of an edited build is allowed and leaves the build edited, and a later Save a new version sends the renamed revision and the new name.
- [ ] A rename that gets 412 (the API changed the build first) shows the conflict message, disables Save a new version and Rename until the build is chosen again, and leaves the name unchanged everywhere. A failure of any other kind (forbidden, not found, 429, 5xx, network) shows its message, leaves the name unchanged and Rename enabled. A test fails if a 412 leaves Rename enabled.
- [ ] When the browser cannot store the list, the rename still applies in this tab and `my-builds-unavailable` is shown.
- [ ] Choosing or opening one of My builds shows the server's name: a stored entry with an out-of-date name loads under the name the server returns, in the option, the status and the compare labels. A `build-library.test.ts` row fails if `withLoadedEntry` keeps the listed name for a `mine` entry, and the rewritten acceptance test asserts the server name.
- [ ] When another tab of this browser writes My builds, the selected `mine` entry keeps this tab's `loaded` text, duration and revision and takes the re-read entry's name whenever the re-read list holds it, whichever name is newer. A test of `withRereadMyBuilds` (exported for the test if it is not already, or covered through the page in acceptance) fails if the selected entry keeps its own name when the re-read name differs.
- [ ] `withRenamedEntry` renames only the entry with the matching key, keeps its position, advances `loaded.revision` when `loaded` is set and leaves a null `loaded` null, leaves every other entry untouched, and returns the list unchanged when no entry matches (unit rows for each).
- [ ] Save as copy behaves as before on the shared form: same test ids, label, prefill, validation, Enter and Escape and focus return, and the existing specs for it pass with their assertions unchanged. A `validBuildName` unit test covers the 1 and 100 boundaries on the trimmed length, rejecting empty, whitespace-only and 101 characters.
- [ ] At viewport widths 1200, 1280 and 1800 the save row does not wrap with Rename shown and the link visible (acceptance checks the row's items share one line at each width).
- [ ] `npm run lint:dup` and the typecheck pass, and a name form is not duplicated in `save-build.tsx`; no doc under `docs/` still says that one of My builds keeps its stored name on `?n=`, or that the run bar has two save buttons.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-18

- Underspecified: the rename form's submit text (pointed at a design table that has none), the form's `canSubmit` rule, and `aoe4-save-status.spec.ts` was wrongly listed as unaffected though it pins the full row order.
- Changed: Scope fixes the submit text as `Save name` (never `Rename`) and sets `canSubmit` to the Rename button's enabled rule; the existing-tests rule now names the save-status spec as a changed-order test with the "Rename right after Save a new version" rule; two `(respec 1)` criteria cover both.
- No branch work exists yet; nothing to keep or discard.

## Rework 1 - 2026-11-19 (review)

Bounced by review (reports/SGS-212-review-6.md) at branch tip 125c2f42477f9446f55bf5517fbf5738975ff958. No earlier gate had passed this tip. The rename flow code is correct; the findings are test coverage and one missing attribute.

Findings:
- `components/apps/aoe4-build-order/save-build.test.ts:67`: the row "the text does not convert" sets only `status: 'invalid'` while its text still converts; adding `conversion.ok &&` to `canRename` (`save-build.tsx:113`) fails nothing.
- `acceptance/aoe4-rename-build.spec.ts:80-85`: the unconvertible check does not wait for the 500 ms pause before the conversion updates.
- `acceptance/aoe4-rename-build.spec.ts:262`: nothing checks that Rename is disabled while a save is in flight; removing `!saving &&` from `canRename` fails nothing.
- `components/apps/aoe4-build-order/save-build.tsx:270-279`: the Rename button lacks `aria-busy`, which Save a new version (:263), Save as copy (:287) and the other load-disabled controls carry.

### Required fixes

- [x] `save-build.test.ts:67`: give the row a conversion that really fails, and assert first that it fails. Check by mutation that adding `conversion.ok &&` to `canRename` now fails it, then undo.
- [x] `acceptance/aoe4-rename-build.spec.ts:80-85`: after the fill, wait for `auto-run-status` to have `data-status="invalid"` before asserting the submit state.
- [x] `acceptance/aoe4-rename-build.spec.ts:262`: in the late-answer test, assert Rename is disabled while the PATCH is held. Check by mutation that removing `!saving &&` from `canRename` fails it, then undo.
- [x] `save-build.tsx:270-279`: add `aria-busy={busy ? 'true' : undefined}` to the Rename button, as the other buttons have, and extend the unit test "marks both buttons busy" to cover it.

## Rework 2 - 2026-11-19 (review, text)

Bounced by review (reports/SGS-212-review-8.md) at branch tip e5f987df51ee5a1f400a14a701fec7829cc0502d. Every other check passed; the only finding is a test title.

Findings:
- `acceptance/aoe4-rename-build.spec.ts:356`: the title says "choosing the build again shows the server name when the stored name is out of date", but the test reloads with `?n=` (the opening path, not `chooseEntry`); the choose path is covered by `aoe4-my-builds.spec.ts:450`. (text)

### Required fixes

- [x] `acceptance/aoe4-rename-build.spec.ts:356`: replace the test title with exactly `'opening ?n= shows the server name when the stored name is out of date'`. Change nothing else. (text)
