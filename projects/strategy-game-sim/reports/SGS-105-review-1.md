# SGS-105 review 1

Branch `sgs-105-save-and-open-by-link` at 66a9a18 (not on origin, reviewed by SHA), base main 5b29e9e. Full review.

**Verdict: REQUEST CHANGES**

The code matches the contract. These were all checked and hold: the hold and interim render, the URL baseline, the late-save guard, the first-`b` rule, the abort on unmount, the error tables, the wiring and the bundle. The blocking findings are four doc sentences the code contradicts (all text fixes) and one helper copied into three modules.

## Blocking findings

1. `docs/aoe4-build-order.md:869` and `:920-921` - contract (text) - The docs say Results opens after a `?b=` load "on a narrow screen". On main, which does not have SGS-104, the tabs show at every width, and the code selects Results at any width. A probe at 1280x720 after a `?b=` load read `tab-results` `aria-selected="true"`. The ticket wants a sentence that holds with and without SGS-104 (ticket "Parallel work"). This one is false today. Direction: make these replacements.
   - At :869, replace "(except that opening a `?b=` link selects Results on a narrow screen after its first successful run)" with "(except that after opening a `?b=` link, Results is selected after its first successful run when the page shows the Build and Results tabs)".
   - At :920-921, replace "On a narrow screen Results opens after the first successful run." with "When the page shows the Build and Results tabs, Results is selected after the first successful run."
2. `docs/aoe4-build-order.md:905-907` - contract (text) - The docs say a save uses "the name the pin would use". `savedBuildName` (`components/apps/aoe4-build-order/pin-name.ts`) and `pinName` give different names for an opened build. The pin uses the option label `<name> (<id>)`, or `<name> (<id>) (edited)` after an edit. The save stores `<name>`, or `<name> (edited)` after an edit. The parenthesis that follows ("keeps its stored name") contradicts the main clause. Direction: replace "with the name the pin would use (an unchanged opened build keeps its stored name, an edited one gets ` (edited)` once, and the name is cut to fit the name cap)" with "with the name of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label".
3. `docs/aoe4-build-order.md:875` - contract (text) - "On load the default build settles and runs once." is false with `?b=`: the page holds the run, then runs the opened build. Scope "Docs" says to fix every statement the change makes untrue. Direction: replace it with "On load the default build settles and runs once; with a `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)."
4. `docs/aoe4-build-order.md:1020-1021` - contract (text) - The pin-label rule names "the prebuilt build's name when its text equals one exactly". `pinName` now searches page-state `builds`, and that list includes the opened build's option. For an unchanged opened build the pin label reads `Pinned: <name> (<id>), <m:ss>`, not a prebuilt name. Direction: replace "the prebuilt build's name when its text equals one exactly" with "the name of the select option whose text it equals exactly (for an opened build, `<name> (<id>)`)".
5. `pages/apps/aoe4-build-order.tsx:63` and `components/apps/aoe4-build-order/save-build.tsx:23` - convention - Each file defines its own copy of `sameInput`. The two are identical to the private `sameInput` at `components/apps/aoe4-build-order/auto-run.ts:80`. The repo's review checklist treats a helper copied from another module as blocking, and `lint:dup` misses it only because it is one line long. Direction: export `sameInput` from `auto-run.ts` (that module owns `LiveInput`), then import it in the page and in `save-build.tsx` and delete both local copies.

## Spec gaps

None that need NEEDS_SPEC. Finding 1 comes from the ticket's own Scope "Docs" wording ("on a narrow screen opens Results"), which assumed SGS-104. The replacement text keeps what the ticket intends and is true with or without SGS-104.

## Acceptance criteria

The acceptance spec `acceptance/aoe4-save-open.spec.ts` is not written yet; the acceptance-test gate writes it next. I checked the browser cases with a throwaway probe spec, now deleted, and by reading the code.

| Criterion | Verdict | Evidence |
|---|---|---|
| Wiring greps | pass | `router.replace` appears only in the page (lines 168, 198). The clipboard call is only in save-build.tsx:89. The builds URL is only in the loader and the client. There are no server-module imports, and the loader and client import nothing from next or react. |
| Bundle | pass | `grep -rlF unit_workshop_ram_3_eng .next/static` lists 0 files; the string is found under `.next/server`. |
| Unchanged opened build re-saves to the same id | pass (code) | `savedBuildName` returns `buildName` (the stored name) when the text equals the opened option's text. `savedBuildOption` sets `buildName`. The edited case gives `<stored> (edited)`. Not run in a browser. |
| Unit tests (Scope 11) | pass | `npm test`: 62 files, 1857 passed, 10 skipped. Tables are present in pin-name, save-build-client, saved-build-loader and save-build tests. |
| Save, copy, open in a fresh context | pass (probe, partial) | Probe: the link is visible and focused, and its selection is 0..length. The fresh context shows the option `Probe Build (<id>)`, and the URL keeps `?b=<id>`. The probe did not check the single simulate POST or that the steps are equal. |
| Edited build round trips | unverified | Not probed. The code takes the request from the settled input. |
| Same content, same link | unverified | Not probed. The server is idempotent (SGS-103). |
| Save enabled only when current | pass (partial) | Probe: an invalid input gives `disabled` and opacity 0.5 at all four widths. The code gates on `status !== 'current'`. The running, failed and rejected rows were not probed. |
| (respec 1) Load does not drop `b`; late save | pass for the load part; late save unverified in the browser | Probe: the `replaceState` spy saw only `?b=<id>` URLs, and the URL still ends `?b=<id>`. The late-save probe failed on a test-setup problem, not on the app. In the code, save-build.tsx:73 drops a response whose input differs from `settledNow.current`, and the URL effect only clears `b`. |
| Edit after save hides the link and drops `b` (paused clock) | pass (probe) | The link and `b` stayed inside the pause. After the debounce, the link was gone and the URL had no query. |
| Edit and undo inside the pause keeps the link | pass (probe) | |
| Copy | pass for the rejection case (probe) | With a rejecting stub, the hint shows and the input is focused with 0..57 selected. The granted-permission `Copied` case was not probed. |
| Escape closes the panel | pass (probe) | |
| Save keeps the Enter rule | pass (probe) | Enter in duration sent no builds POST. Enter on a focused Save saved. |
| Save errors table | pass (probe) | All seven rows, then a later successful save cleared the error. |
| Missing or malformed id | pass (probe, partial) | With `abc` and `AAAAAAAAAAA`: the exact text shows, `b` is kept, and `tab-build` is selected at 390. `b` was removed after a settled edit. The 500 and aborted-GET rows were not probed (the code maps them to `LOAD_ERRORS`). |
| First `b` wins; back loads nothing | pass (probe) | `?b=<id>&b=AAAAAAAAAAA` loaded the saved build with no error. GET count was 1 after the back navigation. |
| Load holds the first run and disables editing | pass (probe, partial) | With the GET held: status `loading` and Save disabled. `aria-busy` and the table controls were checked in the code only. |
| A saved build that no longer converts | unverified | Not probed. The code gates the tab effect on `current`. |
| Tab after a load at 390 | pass (code); 1280 behavior noted in finding 1 | |
| Leaving during a load aborts it | unverified in the browser | The probe hung on a `page.route` handler that never resolved (a probe problem). In the code, the AbortController aborts in the effect cleanup, and `loadSavedBuild` handles `AbortError` quietly. |
| Layout with the link shown | pass (probe) | scrollWidth was 360 at 360 and 390 at 390. Run bar height: 265/1024 (26%) at 768, and 172/720 (24%) at 1280. |
| Test hygiene | unverified | The spec is not written yet. |
| Docs | fail | Findings 1-4. |
| tsc, lint:dup, test, next build | pass | `npm run acceptance` was not run in full. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **S1** (apps import nothing from each other): holds. The new files import only from the aoe4 app and from `lib/aoe4-build-order`.
- **S3** (bounded requests): holds. The GET runs once per page load, a malformed id sends no request, and a save sends one POST per click while saving is disabled.
- **A3** (deterministic timings): holds. The change adds no timing output.

## Bot reconciliation

`reviewBot.cli` is not configured, so there are no bot findings. There is no rulesFile.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones.

## Non-blocking notes

- `pages/apps/aoe4-build-order.tsx:168`: the URL effect calls `router.replace({ pathname, query: {} })`, which drops every query key, not only `b`. No other keys exist today. Keeping `router.query` minus `b` would be more robust.
- `pages/apps/aoe4-build-order.tsx:97`: `initialB.current` is written during render. This is safe because it is write-once and idempotent, but it is unusual. An initializer inside the `isReady` effect would be more conventional.
- `docs/aoe4-build-order.md:874`: "choosing a prebuilt build settle the input at once" now also applies to the opened build's option. Suggested text: "choosing a build in the select settles the input at once".
- Escape hides the link panel but leaves `b` in the URL. This matches the spec, which removes `b` only on a settled change.
- The saved-build-loader test for an aborted signal stubs fetch to reject whether or not the signal is aborted. It is weak, but it can still fail.

## Flows the acceptance gate must cover

Every criterion above in `aoe4-save-open.spec.ts`. Give these particular care, because the implementer's unit tests do not exercise them end to end:

- the late save (POST held by `page.route`, an edit settles, then release);
- the `history.replaceState` spy after a load;
- the paused-clock edit, and the edit-then-undo;
- the back navigation and the GET count;
- the abort on leave (`requestfailed` plus no console error), noting that a `page.route` handler that never resolves can hang `goto`, so hold with a promise released in teardown;
- the granted-permission `Copied` case;
- the running, failed and rejected rows of the Save-enabled table;
- the 500 and aborted-GET load rows;
- the saved build that no longer converts;
- the tab at 390.

## Coverage

Reviewed:

- pages/apps/aoe4-build-order.tsx
- components/apps/aoe4-build-order/{save-build.tsx, save-build-client.ts, saved-build-loader.ts, pin-name.ts, build-input.tsx, build-text-editor.tsx, step-table.tsx}
- the CSS module
- acceptance/helpers.ts
- every new or changed unit test
- docs/aoe4-build-order.md

Checks run:

- tsc, lint:dup, npm test, next build and the bundle grep;
- the probe at 360, 390, 768 and 1280.

Not covered:

- No role profile file exists under code-factory/references/profiles.
- REPO.md is not at the code repo root. I applied the review checklist as loaded earlier from the factory copy.
- No REVIEW.md exists.
- The project LESSONS.md is empty.
- The full `npm run acceptance` suite was not run.
