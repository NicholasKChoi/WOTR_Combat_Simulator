# SGS-212 spec gate (2)

Verdict: NEEDS_SPEC

ticket-lint.py: clean (no errors, no warnings). Code read at origin/main via git show; no scratch checkout. SGS-209 is integrated, so `renameNamedBuild` exists in `named-build-client.ts` at the base.

## Gaps

1. Testable criteria / Contracts - the Rename form's submit text has no source. Scope says "submit text per the design's page rules", but the design's "Rename: page" table (design/M12.md) and C10/C11 never give it. Only the group name `Rename` and the input name `New name` are stated. An implementer would guess, and a guess of `Rename` makes the submit collide by accessible name with the `rename-build` button for role-based locators in the new acceptance spec. Fix: state the required text in the ticket (for example `Save name`, any text other than `Rename`), or add it to design C11 first. Also say whether a test asserts it.

2. Testable criteria - the Rename form's `canSubmit` (the "outside conditions" prop in C10) is unspecified. Save as copy uses `canSave && nameOk`, which includes `status === 'current'` and `conversion.ok`. Rename is explicitly not tied to `status`, `conversion` or `edited`, so reusing `canSave` would block renaming an unconvertible or stale-run build. The rules for the form's submit are not in the design or the ticket. An implementer would guess between "same as the Rename button's enabled rule" and the Save as copy rule. Fix: add one sentence to the Rename form bullet, for example "`canSubmit` for rename is the Rename button's enabled rule (`!busy && !saving && !locked && loaded revision is a number`), and a criterion that Rename submits for an invalid-text or stale-run build".

3. Existing tests - the Scope claim that the specs reading the save row "keep working through the unchanged `save-copy-*` ids" is false for `acceptance/aoe4-save-status.spec.ts`. It pins the whole row with `toEqual` on `rowIds` against `LINK_ROW = ['save-build', 'save-build-copy', 'save-status', 'saved-build-link', 'copy-saved-link']` (lines 21, 59, 169) for one of My builds with a secret, which now also holds `rename-build` between the first two. This falls under the "test of the changed behavior gets the new expected value" rule, but the sentence tells the implementer the spec is unaffected. Fix: drop `aoe4-save-status.spec.ts` from the "keep working" list and name it among the examples whose row order changes (state the rule: the row lists Rename after Save a new version wherever Save a new version is shown). `aoe4-split-tab-order.spec.ts` uses ordered subsequences and is not affected.

## Notes (non-blocking)

- The existing-tests rule and "implementer lists every test it edits" are fine as written; other acceptance specs that depend on the stored name beating the server name (`aoe4-my-builds.spec.ts` lines 385 and 483 area) should be re-read by the implementer under D17.
- `withRereadMyBuilds` is not exported today; the ticket allows exporting it or covering it through the page, which is fine.
- Items 3 (open questions), 4, 5, 6, 7, 8, 9, 10, 11 (docs lines 13, 294, 301, 331 to 348 all named), 12, 14, 15 and 16 (risk is standard) checked with no gap. Scope's `withLoadedEntry`, `withRereadMyBuilds`, `Saver`, `saveStatusText`, `hideLink`, `validName` references match the base code.
