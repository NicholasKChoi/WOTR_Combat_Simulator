# SGS-072 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-072-aoe4-pin-persistence-label` (local only, not pushed to origin), tip `9e4c4e05f279ae287baae07ff0f4723a26a795fe`, base `origin/main` `c7ca461106bb42e48cb7b3913791b34ee105cb7f`. Full diff reviewed (`git diff origin/main...HEAD`), 10 files.

The production code meets the contract. I found no correctness, invariant, concurrency or lifecycle problem. All three blocking findings are wording problems: two acceptance test names claim more than their assertions check, and one doc sentence the diff adds says something the code does not do.

## Blocking findings

1. `acceptance/aoe4-build-order-pin-compare.spec.ts:542` - test - The title is "a Pin or Unpin before the restore lands wins over the restore", but the body only clicks Pin before releasing the restore. No Unpin is made before the restore lands. A test title that claims a check its assertions do not make is always blocking. Direction: add the Unpin case. On a page with no pin, Unpin is disabled, so the only way to Unpin before the restore lands is: reload with a stored pin and the restore gated, Run, Pin, Unpin, then release. Assert that `pinned-label` has count 0 and that `localStorage` holds no `aoe4-build-order.pinned-run` key. I ran exactly this probe against the tip and it passes, so this only changes the test. Alternatively, rename the test to say Pin only and add the Unpin case as its own test.

2. `acceptance/aoe4-build-order-pin-compare.spec.ts:342` - test - "the label names the prebuilt, marks an edit, and is fixed when pinned" does not cover criterion 4's "or after a Run": the label must not change when a later Run has a different name. Mutation: `pinnedName={pin ? (run?.name ?? pin.name) : null}` in `pages/apps/aoe4-build-order.tsx` (the label shows the current run's name instead of the pin's). All 32 pin-compare tests and my probes still passed. The reason is that every pin in the spec is made from the run whose name it carries, and no test checks the label after a later Run with a different name (the race test's Run at 600 s has the same name as the pin). Direction: in this test, after pinning `<BUILDS[1].name> (edited)`, run `DEFAULT_PASTE` (named `BUILDS[0].name`) and assert the label still reads `Pinned: <BUILDS[1].name> (edited), 20:00`.

3. `docs/aoe4-build-order.md:887-888` - contract - The new sentence says "Pin this run" is "enabled while a result is shown whose text and duration differ from the pin's". Read normally, that means both must differ. The code (`alreadyPinned` at `pages/apps/aoe4-build-order.tsx:190`) enables Pin when either one differs, and also when there is no pin. Example: with a pin of (default text, 1200) and a shown run of (default text, 600), the doc says disabled but the button is enabled. Direction: "enabled while a result is shown, unless its text and duration both equal the pinned run's".

## Spec gaps

None.

## Acceptance criteria

None are ticked, because the verdict is REQUEST CHANGES. Status against the tip:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Reload restores the pin with one POST | pass | spec :315; restore effect page :101-129; spec 1 checks for hydration console warnings |
| 2 | Stored JSON shape, replace, Unpin removes it, reload shows no pin | pass | spec :431; `writeStoredPin` called with exactly the 4 fields at page :198 |
| 3 | `pinName` rules and browser labels | pass | pin-name.ts; unit rows; spec :342; my probe: a pasted second build gives the second build's name |
| 4 | Name fixed at Run; restored pin shows its stored name | pass in code, **test gap** | code: `pinnedName={pin?.name}` and `run.name` set only at the 200 (page :177). My probe passed: changing the select after a Run and before Pin still gives the name from the Run. Blocking finding 2: nothing covers "after a Run" |
| 5 | build-input greps; key grep | pass | `git grep "setSelected\|useState"` in build-input.tsx finds 0 lines; `PIN_STORAGE_KEY = '...'` finds 1 |
| 6 | Pin disabled rules | pass | spec :381 and mutation M1. The test's last step (Unpin, then enabled) does not tell the cases apart, see notes |
| 7 | Stale notice | pass | spec :407 and mutation M2 |
| 8 | Bad storage, non-converting text, 400 and 500 | pass | spec :450, :466, :476, unit rows, mutation M3 |
| 9 | Storage getter throws | pass | spec :492; `browserStorage()` try/catch; unit test with a throwing storage |
| 10 | (respec 1) ComparePanel props exactly; Pin/Unpin before the restore wins | code pass, **test fails the title** | props are exactly `{current, pinned, pinnedName, alreadyPinned, onPin, onUnpin}`; tsc is clean. Unpin covered only by my probe (blocking finding 1) |
| 11 | Run during a delayed restore keeps its result | pass | spec :513 |
| 12 | No storage access during the static render; build passes | pass | storage is read only in `useEffect` or click handlers; `npx next build` OK; `/apps/aoe4-build-order` is SSG |
| 13 | `pinnedMarkers` lines kept | pass | results.tsx :36, :46, :56 |
| 14 | Docs | fail (finding 3) | `survives later runs` has 0 hits; persistence, label, stale and Pin rules are described, but the Pin sentence is wrong |
| 15 | tsc, lint:dup, unit, acceptance | pass | see Commands |
| 16 | No invariant regressions | pass | see below |

## Invariants touched

- S1 holds. The new imports in the page and components are only `components/apps/aoe4-build-order/*` and `lib/aoe4-build-order/*`.
- S3 holds. The restore sends the stored text through `textToBuildOrder(stored.text, catalog)`, which has the length cap, and the route checks `SIM_INPUT_BOUNDS` on `durationSeconds`. `readStoredPin` rejects non-finite durations. An out-of-bounds duration gets a 400 from the route, which clears the stored pin.
- A3 holds. `alreadyPinned` compares the run snapshot's text and duration, never the live text. Nothing in the simulation path changes.
- S2 is unaffected (no new page).

## Contract checks (design C8, C11, C13, Compare and pin rules)

- C13 is exact: the key, `StoredPin` v1, and the three functions with the specified signatures. On invalid JSON, a wrong version, wrong types, a missing field or a non-finite duration, `readStoredPin` removes the key and returns null. Extra fields are dropped from the returned object. No function throws: there is an outer try/catch around `getItem` and `removeItem`, and write and clear each have their own try/catch, which covers quota errors and private mode. There is no length cap on the name.
- C11: `ComparePanel` props are exact. `pinned-label` renders `Pinned: {name}, {formatMinSec(pinned.durationSeconds)}` only when `pinned !== null && pinnedName !== null`, next to the buttons, so it shows without a current result. Pin is disabled when `current === null || alreadyPinned`.
- C8: `results-stale` is a `role="status"` alert inside `Results`, inside `panel-results`, with the exact text. `BuildInput` takes `selected` and `onSelectedChange`; the select uses `value={selected}`.
- Run ordering step 5: the snapshot `{text: runText, durationSeconds: Number(duration), name: pinName(builds, runText, selected)}` is built from values in the click's closure. Every failure path (client rejection, non-ok response, network error) clears `run` along with `result`.
- Restore race: the restore only calls `setPin` and `clearStoredPin`. It never touches `result`, `run`, `issues`, `tab` or the text. It checks `pinTouched` and `cancelled` before clearing on a 400 and again after `response.json()`, so a user Pin or Unpin keeps their stored value even when the restore answers 400 (my probe P2).
- Strict Mode: `reactStrictMode` is not set, and it defaults to off for the pages router (Next 16 docs, `config-shared.js` default `null`). If it were turned on, the `cancelled` cleanup flag would stop the second run from being applied, but two restore POSTs would be sent, and spec 1's `toHaveLength(1)` would then fail. That would be the right signal. No action needed.
- Hydration: `selected` starts from props, and all storage access happens after mount. Spec 1's console check found no hydration warnings.
- Out of scope: nothing auto-selects a tab after restore (confirmed by my probe P3), there is no storage listener, and no route, OpenAPI or engine change.

## Linter

`npx tsc --noEmit` is clean. `npm run lint:dup` reports 0 clones. There is no ESLint config in the repo (REPO.md).

## Bot reconciliation

`reviewBot.cli` is empty, so no bot was run. `rulesFile` is empty.

## Conventions against nearby code

- The empty `catch {}` blocks in pin-storage.ts follow the page's existing `errorMessages` (`pages/apps/aoe4-build-order.tsx:70`) and `pages/apps/combat-simulator.js:19`.
- The unit tests match their siblings: `it.each` tables and a builder at the top, as in `components/apps/aoe4-build-order/compare.test.ts:5-25`.
- The new acceptance tests reuse the file's own `runOk`, `pin`, `openPage` and `showTab` and use loops for the table-like cases (:450, :476), as the file's existing tests do (:125).
- No departures a maintainer would flag. Non-blocking: the restore effect repeats the Run's `fetch('/api/aoe4-build-order/simulate', {method, headers, body})` block (page :111-115 vs :161-165). jscpd does not flag it, but a small shared `postSimulate(request)` in the page would keep the URL and headers in one place.

## Mutations (on a shared `next dev` on port 4111; specs: pin-compare plus my probe file)

| id | mutation | result |
|----|----------|--------|
| M1 | `alreadyPinned` compares the live `text` instead of `run.text` | killed (spec :381) |
| M2 | `stale` ignores the duration | killed (spec :407) |
| M3 | restore clears the stored pin on any non-ok response | killed (500 test :477) |
| M5 | `pinnedName` shows the current run's name | **survived all 32 tests** (blocking finding 2) |
| M6 | restore calls `setTab('results')` | survived the branch's specs; killed only by my probe P3 (note below) |

## Probes (throwaway spec, deleted; all passed against the tip, `--repeat-each=3 --workers=4`)

- P1: Pin then Unpin before the gated restore lands. The restore is dropped and the key stays absent.
- P2: The restore answers 400 after the user pinned. The user's stored pin (600 s) is kept.
- P3: A restore that lands with no Run leaves `tab-build` selected and `panel-results` hidden, enables `tab-results`, keeps the text the user edited before it landed, and shows the label with no charts.
- P4: After restoring (default, 1200), running (default, 1200) leaves Pin disabled.
- P5: Changing the select after a Run and before Pin: the label and stored name come from the Run; `results-stale` is shown.
- P6: Pasting the second prebuilt's text while the first is selected gives the second prebuilt's name.

## Load runs

- New describe (15 tests), `--repeat-each=10 --workers=4`, run at the same time as the full suite against one shared server: 150 of 150 passed.
- The full suite running alongside it: 677 passed and 1 timed out: `acceptance/aoe4-step-table.spec.ts:191` ("move buttons are disabled at the ends..."). That file is not touched by this diff. Alone, `--repeat-each=5`, it passed 5 of 5. This is load sensitivity in an untouched test, not caused by this diff.
- `ACCEPTANCE_PORT=4111 npm run acceptance` (own server, Node 24.22.2): 678 passed. This includes the existing `pin-run` clicks in `aoe4-build-order-m3-flow.spec.ts` and `aoe4-build-order.spec.ts`.

## Commands

`npx tsc --noEmit` OK. `npm run lint:dup` 0 clones. `npm test` 44 files, 1307 passed, 10 skipped. `npx next build` OK. `npm run acceptance` 678 passed.

## Non-blocking notes

- Spec :381, last step: Pin is already enabled after `runOk(1200)` while pinned at 600, so "Unpin, then `pin-run` enabled" does not tell the cases apart. To test the Unpin half of criterion 6, Unpin while `alreadyPinned` is true (right after a Pin) and assert Pin becomes enabled.
- Spec :315: assert `tab-build` `aria-selected="true"` before `showTab(page, 'results')`. That would catch M6 ("the restore selects no tab" is in the ticket's Scope 4 and Out of scope).
- Spec :476: for the 500 case, `expectNoPin` runs right after the response and passes immediately, so it would not catch a pin set late. The code's `!response.ok` return makes that impossible today, so this is low value.
- The pages router has Strict Mode off; see the contract notes.
- The branch is not on origin. The manager or the PR step pushes it.

## Coverage

Reviewed: `pages/apps/aoe4-build-order.tsx`, `components/apps/aoe4-build-order/{pin-storage,pin-name,build-input,compare-panel,results}.tsx?`, both new unit tests, the new acceptance describe, and `docs/aoe4-build-order.md` (pin paragraph and the tab paragraph at :812-817, still accurate). Checked `docs/` and `README.md` for "Pin this run", "pinned run" and "survives": no other stale hits. REPO.md review checklist: did "Every diff" (build, plus the page loaded through the dev server via Playwright user flows) and "AoE4 build order" (no helper or constant copied from another lib module; docs sentence check gave finding 3; no chart change). I did not do a manual visual check at 1280 px, because there is no chart change.
