# SGS-105 acceptance-test 1

Branch `sgs-105-save-and-open-by-link`, base tip 2b62126, new tip **7835b9b5ae910eb9d4c16c511cfb3c64a3095e12** (one commit, test file only, not pushed).

**Verdict: PASS.** `acceptance/aoe4-save-open.spec.ts`: 43 tests, 43 passed on the final tip (Playwright started its own `next dev`; no process left running). `npx tsc --noEmit` and `npm run lint:dup` (0 clones) are clean. No non-test file changed (`git diff --exit-code` clean after every mutation).

## Tests written (all pass)

Saving and opening
- save, copy and open in a fresh context: default build, 201 after pre-deleting the same content, body name/duration 1200, `SaveBuildResponse` schema, link regex, focused and fully selected, `?b=<id>` in the URL; fresh context shows `<name> (<id>)`, one simulate POST with the saved steps, 1200, editor text equal to the saved text.
- unchanged opened build re-saves to the same id (name = stored name, 200, link ends `?b=<id>`), and an edit saves as `<name> (edited)`.
- edited build round trips (text edit + duration 900) through a fresh context: duration 900, label `... (edited) (<id>)`, POST order equals the saved one.
- same content gives the same link (second save 200, same link and id).
- Enter in duration runs and never saves; Enter and Space on Save save.
- Escape in the link input hides the panel and focuses Save.

Save enabled table (5 rows plus the current row): unknown unit id, duration 59, pending simulate response (held), 500, 400; each asserts `disabled`, opacity < 1, no builds POST from a forced click, then restore and `waitForRun` and enabled at opacity 1.

After a save (paused clock): text, duration and select edits keep link and `b` until the pause ends, then drop both (no `?`), and a new save puts `b` back; edit then undo inside the pause keeps the link and `b`; a save error disappears on the settled change; late save (POST held, edit settles, release) shows no link and adds no `b`, for a text edit and for a build selection.

Copy: granted clipboard gives `Copied` and `readText` equals the link, then reverts to `Copy link` after a new save; rejecting `writeText` and missing `navigator.clipboard` give the hint, focus and full selection.

Save errors table (7 rows): 429 with 5, 90 and no Retry-After, 400 issue, 413, 503, aborted; each asserts exact text, no link, Save enabled, and a later success clears the error.

Opening: `history.replaceState`/`pushState` spy after a load (no URL without the `b`); first `b` wins plus later `b` change via `next.router.push` and `goBack` loads nothing (GET count 1, editor unchanged); load holds the first run (status `loading`, no simulate POST, select/duration/textarea/Save disabled with `aria-busy`, table fieldset and `step-add` disabled), then exactly one POST with the saved order and controls enabled; leaving during a load via client-side navigation gives `requestfailed` and no console or page error; load rows (malformed id with no GET, absent id with a 404, 500, aborted GET): message, default selected, one simulate POST, `b` kept until the first settled edit then removed; a saved build with unit `knigt` opens as text, issues shown, `invalid`, no POST, Save disabled, `tab-build` selected.

Tab at 390 px: successful load selects Results (panel visible); no `b` stays on Build; 404 fallback stays on Build; a later run does not switch back to Results.

Layout: with the link shown, scrollWidth <= 390 at 390 px, run bar <= 40% of height at 768x1024 and 1280x720.

Hygiene: each test has its own `uniqueClient` through a `client` fixture feeding `extraHTTPHeaders`; fresh contexts use their own header; `grep -n "request.post\|page.request.post"` finds nothing.

## Mutation checks (each undone with `git checkout --`, tree clean)

Mutations were applied in batches and the failing assertion read per test; masked results were rerun alone.

| Break (file) | Test(s) that failed, on the named assertion |
|---|---|
| remove the `sameInput(input, settledNow.current)` guard (`save-build.tsx:73`) | both late-save tests, `hasQuery` false after release |
| remove the URL effect's `router.replace` (`pages/apps/aoe4-build-order.tsx:168`) | the three edit-after-save rows, the 4 load rows, the late-save tests: `hasQuery` false |
| baseline off by one field on load (`:~134` `setUrlBaseline`) | replaceState spy test and fresh-context test: URL lost `?b=` |
| remove focus/select effect (`save-build.tsx:54-57`) | fresh-context test `toBeFocused` |
| remove `saveButton.current?.focus()` in Escape | Escape test `saveButton toBeFocused` |
| `type="submit"` on Save | Enter test, `buildsPosts` length 0 |
| catch sets `copied` | both hint tests, hint not found |
| drop `setError(null)` on success | all 7 error rows, error count 0 |
| `pin-name.ts` return `same.name` | unchanged re-save, name equals stored name |
| `hold` without `savedLoadInFlight` (`:98`) | load-holds test, simulate POSTs 0; leave test, status `loading` |
| last `b` instead of first (`:64`) | first-b test, `saved-build-error` count 0 |
| remove `setTab('results')` | successful load tab test, `aria-selected` true |
| remove `setAwaitingLoadTab(false)` | later-run tab test, tab-build selected |
| `Math.floor` for minutes (`save-build-client.ts:12`) | 429/90 row, "2 minutes" |
| duration hard-coded 1200 (`save-build.tsx:~66`) | round-trip test, duration 900 |
| link without origin | fresh-context and re-save tests, link regex |
| link with random suffix | same-link test, link equality |
| `writeText('x')` | Copy test, `readText` equals link |
| effect deps add `router.asPath` | first-b test, GET count 1 |
| remove `return () => controller.abort()` | leave test, `waitForEvent('requestfailed')` timeout names the event |
| editText with the default text on load | no-longer-converts test, status `invalid` |
| loader 500 and catch mapped to not-found | 500 and aborted rows, message |
| live `text` passed as settled | edit-after-save, undo, save-error rows, link missing |
| `.linkInput` min-width 600px | layout test, scrollWidth 627 |
| Save disabled never / always | the Save-enabled table rows, and the current-row test |
| fallback also sets `awaitingLoadTab` | fallback tab test, tab-build selected |

Not killable: removing the `status === 'loading'` guard from the URL effect (`pages/apps/aoe4-build-order.tsx:~162`) leaves every test passing, including the spy test. The loaded input is already `settled` in the interim render, so the guard is not observable through the boundary (equivalent mutant at this boundary, the implementation is still correct). The "a load with no `b` stays on Build" test asserts the initial state and cannot fail for a production break; it is kept because the ticket lists it.

## Failures in the final run

None. Two failures during authoring were spec bugs, fixed in the spec (a hidden textarea after a load selects Results, so editing needs `showTab('build')`; Playwright `toBeDisabled` does not read a `<fieldset disabled>`).

## Criteria not expressible in this harness

- "Leaving during a load aborts it" via `page.goto('/')`: with a held `page.route` the browser drops the request on a full navigation and Playwright emits no `requestfailed`, so that row cannot fail for a missing abort (the navigation aborts the fetch either way). There is no server-side delay hook in the app. I covered the abort with a client-side navigation (link to `/`), which only unmount cleanup can abort; that test fails with the abort removed. The held route is released by the `gate` fixture in teardown.
- The wiring greps, bundle grep, docs statements, unit tables and `npx next build` are not Playwright criteria; review 1 recorded the greps and the bundle check, and this run did not repeat them.
- The `getByTestId('step-table')` disabled check uses the `disabled` attribute (plus `step-add` toBeDisabled), because the fieldset itself is not a disableable control in Playwright.

## Out-of-scope notes

None new. Review 1's non-blocking notes (`router.replace` clearing the whole query, `initialB` written during render) still stand.
