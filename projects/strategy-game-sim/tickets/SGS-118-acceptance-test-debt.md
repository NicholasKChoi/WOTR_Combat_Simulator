# SGS-118: Share one request-hold helper and make the weak acceptance specs able to fail

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.7, M8.8
- **Priority**: medium
- **Risk**: standard
  <!-- Test-only and one component, but it edits about eight specs and the shared acceptance helpers
       that every spec imports; a wrong helper breaks the whole acceptance run. -->
- **Invariants**: none
- **LOC estimate**: 250 (test lines only; no business logic: `acceptance/helpers.ts` plus about eight specs)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md Criteria map M8.7 and M8.8, M8.7 detail rows "acceptance" and "helpers"; plan outline G; spec gate SGS-118 round 1

## Context

Five acceptance specs each hand-roll a "hold the simulate POST" route, several specs list the four chart ids
by hand, and a handful of assertions cannot fail (found in the SGS-102 and SGS-108 reviews). M8 adds specs that
need holds of their own (the my-builds specs hold the named-build `POST`), so one generic hold helper must
exist first, and the weak assertions must be able to fail before the milestone relies on them.

## Scope

All edits are under `acceptance/`; nothing under `lib/`, `components/` or `pages/` changes. Read at
`origin/main`. Line positions are not given; name tests by their title.

**1. Two helpers in `acceptance/helpers.ts`.**
- `export async function holdRequests(page: Page, path: string, method: string, matches?: (request: Request) => boolean): Promise<() => void>`.
  It registers ``page.route(`**${path}`, handler)`` before it returns, so the caller can trigger the
  request straight away. `path` is a URL path or path glob (`SIMULATE_PATH`, or for example
  `/api/aoe4-build-order/named-builds`). A request whose `method()` equals `method` and for which `matches`
  returns true (every request when `matches` is omitted) is held: the handler awaits one gate promise, then
  calls `route.continue()` and swallows its rejection (the page may have aborted the request meanwhile, as
  today's local copies do with `.catch(() => {})`). Any other request on that path goes on at once with
  `route.fallback()`, so a route registered earlier still handles it. The returned function resolves the
  gate. Hold semantics are "every matching request until release": each matching request sent before
  `release()` waits, and after `release()` every held and every later matching request continues at once.
  The route stays registered; a caller that needs a fresh hold registers a new one (the newest route runs
  first) or calls ``page.unroute(`**${path}`)`` first.
- `export async function holdNextSimulate(page: Page, durationSeconds?: number): Promise<() => void>` (the
  design/M8.md M8.7 "helpers" signature). It is `holdRequests(page, SIMULATE_PATH, 'POST', filter)`, where
  `filter` is omitted when `durationSeconds` is undefined and otherwise keeps only requests whose body
  `inputs.durationSeconds` equals it. The body read is `bodyDuration` from
  `aoe4-build-order-pin-compare.spec.ts` (`r.postDataJSON()?.inputs?.durationSeconds`): move it to
  `helpers.ts` (exported, since pin-compare keeps using it in other tests) and delete the spec's copy.
- `holdRequests` is the generic hold for every M8 spec: a later spec that must hold another request (the
  named-build create `POST` in the my-builds specs) calls `holdRequests` with that path and method and adds
  no route of its own. This ticket adds no caller for a non-simulate path.

**2. Delete every local simulate hold and call `holdNextSimulate`.**
- `aoe4-build-order-pin-compare.spec.ts`: delete `holdSimulate`; each call becomes
  `holdNextSimulate(page, LOAD_DURATION)`.
- `aoe4-auto-run-contract.spec.ts`: delete the local `holdNextSimulate` and import the shared one. The status
  line test ("the status line reads computing on the first run, then updating ...") keeps its two holds; its
  `page.unroute` between them may stay or go, as long as the second hold still holds the `updating` run.
- `aoe4-step-annotations.spec.ts` and `aoe4-compact-view.spec.ts`: delete `holdSimulate`; call
  `holdNextSimulate(page)`.
- `aoe4-build-order-step-band.spec.ts`, describe "while a new result is pending": delete the nested
  `holdSimulate` (which also returned `hitOnce`). Each test calls `holdNextSimulate(page)`, then registers
  `const sent = page.waitForRequest(isSimulatePost)` before the edit that triggers the run, and awaits `sent`
  where it awaited `hitOnce`. Delete the two `page.unroute((url) => url.pathname === SIMULATE_PATH)` calls:
  they pass a new function, so they never removed the route, and a released hold passes every later POST.
- `aoe4-auto-run.spec.ts`: "a first invalid load state has no target" replaces its inline gate route with
  `holdNextSimulate(page)`; "a superseded request is aborted and its response never shows" replaces its
  inline route with `holdNextSimulate(page, 900)`.
- Routes that answer without holding (`route.fulfill`, `route.abort`, the pin-compare `routeRestore` answers,
  including the "a Pin made while the restore is in flight ..." handler that awaits a gate and then fulfils
  500) are not simulate holds and stay.

**3. The helper's behavior is pinned by assertions in existing tests.**
No new spec file. Two existing tests gain an explicit "not answered before release" check:
- No-duration hold: in `aoe4-auto-run-contract.spec.ts`, the status line test records every simulate response
  (`page.on('response', ...)` filtered with `isSimulatePost(r.request())`) from before `page.goto`. After it sees
  `data-status="running"` and before `release()`, it asserts no simulate response has arrived; after
  `release()` it sees `current`. It fails if the helper does not await the gate.
- Duration filter: in `aoe4-build-order-pin-compare.spec.ts`, "a run that finishes before the restore lands
  keeps its result; then only the pin appears" holds `LOAD_DURATION` and, while held, `runOk(page, { duration: 600 })`
  must complete (a POST for another duration resolves while the held one waits; it times out if the helper
  ignores the filter and holds every POST). Add: a response for a `LOAD_DURATION` simulate POST has not arrived
  when `runOk` returns (tracked as above with `bodyDuration(r.request()) === LOAD_DURATION`), and arrives after
  `release()`. It fails if the helper ignores `durationSeconds` in the other direction (holds nothing).

**4. Use `CHART_IDS` instead of hand-listed chart ids.**
`CHART_IDS` already exists in `acceptance/helpers.ts`. Replace the local arrays in
`aoe4-build-order-step-band.spec.ts` (`CHARTS`), `aoe4-compact-view.spec.ts` (`CHARTS`) and
`aoe4-results-split.spec.ts` (its local `CHART_IDS`) with the import, and the two-id loop in "a first invalid
load state has no target" of `aoe4-auto-run.spec.ts` with a loop over `CHART_IDS` (every chart is absent).
Do not change what `CHART_IDS` is defined as: a sibling ticket redefines it from the app's chart id list, and the
specs must work with either definition. `aoe4-results-split.spec.ts` asserts the results container's chart
children in `CHART_IDS` order, so that order is the default DOM order under both definitions. Lists of other
ids or deliberate subsets stay: `RESOURCE_CHARTS` in `helpers.ts`, the two-id loop in
`aoe4-chart-readability.spec.ts`, and the legend id list in `aoe4-narrow-layout.spec.ts`.

**5. Assertions that cannot fail (the M8.7 "acceptance" row).**
- `aoe4-auto-run.spec.ts`, "an invalid duration": for each row, assert `duration-error` is visible
  (`toBeVisible()`) in addition to its text. Bootstrap's `.invalid-feedback` is hidden unless the input has
  `is-invalid`, so a lost class now fails the test.
- `aoe4-auto-run.spec.ts`, "select keeps open step rows and opens the new rows that have options": before
  selecting the other build, assert from the data that the case is real: `expected` (the other build's open
  list) has at least one index that is `'true'` where `before` is false (a newly opened row with options) and
  at least one index where `before` is true and the other build's step has no optional field (a row kept open
  only because it was open). `BUILDS[2]` satisfies both with the shipped data today (index 0 is the kept row);
  keep it.
- `aoe4-step-annotations.spec.ts`: wherever a test asserts `toHaveAttribute('aria-describedby', 'auto-run-status')`
  on `results-last-good`, also assert in one `page.evaluate` that `document.getElementById` of the attribute's
  value is the element with `data-testid="auto-run-status"` and that its text equals the status message the
  test expects at that moment (`Updating the results.` in "deleting a row ...", and
  `The charts show the last valid build.` in "an invalid edit dims ..."). The `not.toHaveAttribute('aria-describedby', ...)` assertions on the settled side stay as they are.
- `aoe4-step-annotations.spec.ts`, "the charts dim from the edit until its result lands, and choosing the selected
  build does not dim them": its same-build half reads the opacity once, straight after `selectOption`, which
  passes before any re-render, and its edit half polls for 0.5 while the run may already have landed. Rewrite
  it:
  - same build: choose the already selected build inside `expectNoRun` (no simulate POST is sent), then
    assert `lastGoodOpacity` is 1;
  - real input: call `holdNextSimulate(page)`, then choose a different prebuilt build (`listBuilds()[1]`).
    Poll the opacity to 0.5 and see `data-status="updating"` while held, call `release()`, then see `current`
    and poll the opacity back to 1.
  Rename the test to say what it now checks, for example "the charts dim from a real input change until its
  held result lands; choosing the selected build sends no run and does not dim them". Drop its
  `not.toHaveAttribute('aria-describedby')` read at the dimmed moment (the status is `updating` there, so the
  attribute is set).
- `aoe4-step-annotations.spec.ts`, "the longest prebuilt step table fits the Build panel and the editor is not
  clipped": wait for `step-started` to be visible (first row) after `showView(page, 'table')` and before the
  layout measurement, so it cannot measure a table with no times yet. Keep each rect read in one
  `page.evaluate` under `expect.poll` (LESSONS).

**6. Spec import order (M8.8).**
The convention in the acceptance specs is the default `Array.prototype.sort` (code-point) order of the named
imports from `./helpers`: upper-case constants first, then functions. In `aoe4-auto-run.spec.ts`,
`TABS_VIEWPORT` sits between lower-case names; move it after `SIMULATE_PATH`. Every spec this ticket edits keeps
its `./helpers` import list in that order with the names it adds (`CHART_IDS`, `holdNextSimulate`,
`bodyDuration`, `isSimulatePost`) placed by the same rule, and drops names that become unused (for example
`SIMULATE_PATH` where only the deleted hold used it).

**Docs:** `docs/aoe4-build-order.md` and `ARCHITECTURE.md` name none of these helpers
(`git grep -n "holdSimulate\|holdNextSimulate\|holdRequests" -- docs ARCHITECTURE.md` finds nothing); no doc change.

**Out of scope:** any change to product code; `aoe4-save-open.spec.ts`, whose holds use the `gate` fixture and
whose Save tests the my-builds tickets rewrite (its holds are not migrated here); the definition of `CHART_IDS`
and `RESOURCE_CHARTS`; `aoe4-chart-readability.spec.ts` and `aoe4-narrow-layout.spec.ts`; the unit-test debt
(vitest `css`, auto-run history, loader abort, identity branch, house gate), which another ticket owns; the
SGS-103 route test gaps and `aoe4-builds-api.spec.ts` `toEqual`, which sit with the server-debt ticket;
chart-layout, split-scroll and legend specs; the step-annotations tests other tickets edit (badges, select
label, Waited); pinning the split-layout Tab order.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) `acceptance/helpers.ts` exports `holdRequests(page, path, method, matches?)` and `holdNextSimulate(page, durationSeconds?)`, each returning a release function, with the semantics in Scope 1: every matching request is held until release, later matching requests pass at once after it, and a non-matching request on the path goes to `route.fallback()`. `holdNextSimulate` calls `holdRequests` with `SIMULATE_PATH` and `'POST'`; `helpers.ts` contains no other `page.route` that awaits a gate.
- [ ] (respec 1) The contract status line test asserts no simulate response arrives between `data-status="running"` and `release()`. Mutation check: delete the gate `await` in `holdRequests` in a throwaway worktree; that test fails. The implementer records this in the report.
- [ ] (respec 1) The pin-compare test "a run that finishes before the restore lands ..." completes a 600 s run while the `LOAD_DURATION` POST is held and asserts the held POST has no response until `release()`. Mutation checks: make `holdNextSimulate` ignore `durationSeconds` (hold every POST), and separately make it hold nothing; the test fails under each. The implementer records both.
- [ ] (respec 1) No acceptance spec defines its own hold function: `git grep -nE "function hold[A-Za-z]*" -- acceptance` matches only `acceptance/helpers.ts`.
- [ ] (respec 1) No spec in Scope 2 holds the simulate route by hand: every match of `git grep -nE "await gate" -- 'acceptance/*.spec.ts'` is in `aoe4-save-open.spec.ts` or is the pin-compare restore handler that answers with `route.fulfill`.
- [ ] (respec 1) No spec declares an array literal of chart ids starting with the units chart: `git grep -nE "\[ *'chart-units-produced'" -- 'acceptance/*.spec.ts'` finds nothing. The step-band, compact-view and results-split specs and the auto-run "first invalid load state" loop use `CHART_IDS` from `./helpers`.
- [ ] The invalid-duration test asserts `duration-error` is visible. Mutation check: remove the `is-invalid` class from the duration input in `build-input.tsx` in a throwaway worktree; the test fails. The implementer records this in the report.
- [ ] (respec 1) The open-rows test asserts, before it acts, that `expected` has a newly opened row (`'true'` where `before` is false) and a kept row (`before` true where the other build's step has no optional field). Mutation check: point the other build at `BUILDS[0]`; the test fails on that assertion.
- [ ] (respec 1) Wherever a step-annotations test asserts `aria-describedby="auto-run-status"` on `results-last-good`, it also asserts in one `page.evaluate` that the id resolves to the `auto-run-status` element carrying the status text Scope 5 names for that test. Mutation check: change the status element's `id` in `build-input.tsx` to `auto-run-statuz` (the attribute still reads `auto-run-status`); every such test fails.
- [ ] (respec 1) The rewritten charts-dim test sends no simulate POST when the selected build is chosen again (opacity 1 afterwards), and for a different prebuilt build under `holdNextSimulate` shows opacity 0.5 and `updating` until `release()`, then `current` and opacity 1. Its title says what it checks. Mutation check: make `results.tsx` never apply the dimmed class; the test fails.
- [ ] The step-table layout test waits for `step-started` to be visible before measuring, and reads every rect in one `page.evaluate` under `expect.poll`.
- [ ] (respec 1) In every spec this ticket edits, the named imports from `./helpers` equal the same list sorted with the default `Array.prototype.sort` (code point), and every imported name is used in that file (the repo's `tsc` does not flag unused imports, so review checks it).
- [ ] Every spec this ticket edits passes under `npm run acceptance` with those files repeated once for flake (`--repeat-each=2` on the edited files), and `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] The report names the mutation used for each fixed assertion and each helper check, and lists every spec file and test edited.
- [ ] No INVARIANTS.md regressions

## Open questions

- designer: design/M8.md M8.7 "helpers" row says `holdNextSimulate` "holds the next matching POST" and names no generic helper. This ticket specifies hold-every-matching-request-until-release (today's local copies and the contract test's double hold rely on it) and adds `holdRequests(page, path, method, matches?)`, which the save-panel ticket uses for the named-build create `POST`. Record both in the M8.7 helpers row.

## Re-spec 1 - 2026-11-10

- Underspecified: the chart-id grep matched an untouched legend list, the import-order rule contradicted the specs (they use code-point order), and hold semantics ("next" vs every matching POST) and the test that pins the helper were left open; the aria-describedby mutation could not distinguish the new check.
- Changed: added generic `holdRequests` under `holdNextSimulate` (also for the named-build create hold); hold-every-until-release with `route.fallback()` for others; helper pinned by the contract status-line and pin-compare restore tests; chart-id grep keyed on `['chart-units-produced'`; charts-dim test uses a held real input; open-rows asserts a new and a kept row; status-id mutation moved to `build-input.tsx`; save-open holds left to the my-builds tickets.
- No branch work exists for this ticket.
