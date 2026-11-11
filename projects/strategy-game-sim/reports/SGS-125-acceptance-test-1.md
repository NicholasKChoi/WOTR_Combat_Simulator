# SGS-125 acceptance-test 1

Verdict: PASS. Branch sgs-125-save-panel, tip 731699d (was ac5b1e6). Harness ran (Playwright, Chromium, real next dev, live routes).

## Tests written

The implementer's `acceptance/aoe4-my-builds.spec.ts` already covers every acceptance criterion observable through the browser (copy flow, name rules, copy form under input changes, form after failure, reopen after reload, save a new version, ?n= in another context, 412 from a second tab, failure table, storage unavailable and late create, in flight and late answers, late version, late failures, cross-tab list, link panel, 390 px layout). I wrote no new test file. I fixed one test that could not fail:

- `reopening and new versions > after a reload the copy is under My builds...` (line 876): the "Save a new version is disabled while unedited" assertion passed even with `&& edited` removed from the production code, because the button is also disabled while the chosen build's run is pending. The choose now goes through `waitForRun`, so the assertion is made at status `current`. With the break it now fails at line 881.

## Run results

- `aoe4-my-builds.spec.ts`: 73 passed.
- `aoe4-save-open`, `aoe4-auto-run`, `aoe4-small-screen`, `aoe4-build-order-pin-compare`: 75 passed.
- `npx tsc --noEmit` and `npm run lint:dup`: clean.
- Unit tests were not run (suite gate's).
- Greps for `recordSave|savedBuildName|pinName|postSavedBuild|isSaveBuildResponse|holdNextNamedSave` and `-w "Save build"` find nothing; `pin-name.*` is gone.

## Mutation checks (each undone with `git checkout -- components pages`; `git diff --exit-code` clean)

| Break | Test | Failing assertion |
|---|---|---|
| `save-build.tsx:151` `form.name.trim()` to `form.name` | Enter submits a padded name trimmed | spec:707 name `"  Padded name  "` |
| `save-build.tsx:179` drop `setLock` on conflict | second tab 412; late 412 | spec:955 and 1151 `toBeDisabled` |
| `aoe4-build-order.tsx:304` drop `sameInput` guard in `recordCreated` | late create warns; create released after settled edit | spec:1060 and 1100 |
| `save-build.tsx:112` drop `&& edited` | reload-then-edit (after my fix) | spec:881 `toBeDisabled` |
| `aoe4-build-order.tsx` `recordUpdated` `revision: 1` | Save a new version sends the secret... | spec:910 second save got 412 |
| `aoe4-build-order.tsx` `recordUpdated` `loaded.text: ""` | new version released after a settled edit | spec:1131 `data-edited` |
| `save-build.tsx` `SAVED_NAME_MAX_CHARS + 1` | name rules | spec:680 101-char submit enabled |
| `save-build.tsx:73` drop abort on unmount | create held, leaving aborts | spec:1088 no `requestfailed` |
| `save-build.tsx:139` unstored warning `settledNow.current` to `null` | late create still warns | spec:1060 text |
| `save-build.tsx:154` drop `setForm(null)` on submit | failed copy closes the form | spec:784 form count 1 |
| `aoe4-build-order.tsx:221` remove `storage` listener | copy saved in one tab | spec:978 option list |

The `:304` break's first failing test failed on the warning text rather than the exact "warning without link" assertion, but the failure traces to the broken late-create path (a selection happens that should not).

## Failures

None.

## Notes and gaps

- spec-gap (minor): the criterion says `git grep -nE "function hold[A-Za-z]*" -- acceptance` matches only `acceptance/helpers.ts`. It also matches `holdCopy` and `holdVersion` (`aoe4-my-builds.spec.ts:598,607`), which the rework 1 criterion requires as file-local wrappers over `holdRequests`. The two criteria conflict literally; the wrappers call `holdRequests`, so no second hold gate exists. Not a defect.
- Not observable in this harness: the "repeat click sends no second request" guard (`abort.current !== null`). The buttons are disabled while in flight, so a force click is a no-op at the DOM level, and breaking the guard alone cannot be detected. Unit-level `save-build.test.ts` covers disabled state.
- Criteria not expressible by acceptance specs: `npm test` full suite and `build-library.test.ts`, `save-build.test.ts`, `save-build-client.test.ts` row content (implementer's unit tests; not re-run here).
- Test-ticket scope note: the 4 CSS/390 px assertions pass at 390 px only.

Commit: 731699d (test file only). No processes left running.
