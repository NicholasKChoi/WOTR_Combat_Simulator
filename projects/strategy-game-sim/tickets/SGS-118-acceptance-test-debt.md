# SGS-118: Share one hold-simulate helper and make the weak acceptance specs able to fail

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.7, M8.8
- **Priority**: medium
- **Risk**: standard
  <!-- Test-only and one component, but it edits about a dozen specs and the shared acceptance helpers
       that every spec imports; a wrong helper breaks the whole acceptance run. -->
- **Invariants**: none
- **LOC estimate**: 250 (test lines only; no business logic: `acceptance/helpers.ts` plus about ten specs)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md Criteria map M8.7 and M8.8, M8.7 detail rows "acceptance" and "helpers"; plan outline G

## Context

Five acceptance specs each hand-roll a "hold the next simulate POST" route, several specs list the four
chart ids by hand, and a handful of assertions cannot fail (found in the SGS-102 and SGS-108 reviews). M8
adds more specs that need the hold (the my-builds specs), so the helper must exist first, and the weak
assertions must be able to fail before the milestone relies on them.

## Scope

All edits are under `acceptance/`; nothing under `lib/`, `components/` or `pages/` changes. Read at
`origin/main`; line positions below are today's and are examples only.

**1. `holdNextSimulate` in `acceptance/helpers.ts`.**
Add `export async function holdNextSimulate(page: Page, durationSeconds?: number): Promise<() => void>`
(design/M8.md M8.7 detail, "helpers"). It routes `**${SIMULATE_PATH}` on the page and holds every
simulate POST that matches until the returned `release` is called; when `durationSeconds` is given, only
POSTs whose body `inputs.durationSeconds` equals it are held and others continue at once. A held request
continues after release and swallows the failure when the page aborted it (as the local copies do with
`route.continue().catch(() => {})`). The route is registered before the function returns, so the caller can
trigger the request straight away. Reading the body duration reuses what `aoe4-build-order-pin-compare.spec.ts`
does today (`bodyDuration`): move it to helpers if the helper needs it, and delete the spec's copy if it
becomes unused.

**2. Delete every local copy and call the helper.**
Remove `holdSimulate` in `aoe4-build-order-pin-compare.spec.ts` (duration-filtered, so it calls
`holdNextSimulate(page, LOAD_DURATION)`), in `aoe4-build-order-step-band.spec.ts` (a nested function that
also returns a `hitOnce` promise), in `aoe4-step-annotations.spec.ts`, in `aoe4-compact-view.spec.ts`, and
`holdNextSimulate` in `aoe4-auto-run-contract.spec.ts`. Also replace the two inline hold routes in
`aoe4-auto-run.spec.ts` ("a first invalid load state has no target", which holds every POST, and "a
superseded request is aborted", which holds only the 900 s duration). In `step-band.spec` the `hitOnce` use
becomes `page.waitForRequest(isSimulatePost)` registered before the triggering action; the existing
`page.unroute` calls that pair with a hold stay or go with the helper's returned release, whichever keeps the
test passing, and the status-line test in the contract spec that unroutes and holds twice keeps working.
Pure fulfil/abort routes (`route.fulfill`, `route.abort`) are not holds and stay.

**3. Use `CHART_IDS` instead of hand-listed chart ids.**
`CHART_IDS` already exists in `acceptance/helpers.ts`. Replace the local arrays in
`aoe4-build-order-step-band.spec.ts` (`CHARTS`), `aoe4-compact-view.spec.ts` (`CHARTS`) and
`aoe4-results-split.spec.ts` (`CHART_IDS`) with the import, and the two-id loop in the "a first invalid load
state has no target" test of `aoe4-auto-run.spec.ts` with a loop over `CHART_IDS` (every chart is absent).
Do not change what `CHART_IDS` is defined as: a sibling ticket redefines it from the app's chart id list,
and the specs must work with either definition. `aoe4-chart-readability.spec.ts` lists two ids as a
deliberate subset and stays.

**4. Assertions that cannot fail (all M8.7 "acceptance" row items).**
- `aoe4-auto-run.spec.ts`, "an invalid duration": assert `duration-error` is visible
  (`toBeVisible()`), in addition to its text. Bootstrap's `.invalid-feedback` is hidden unless the input has
  `is-invalid`, so a lost class now fails the test.
- `aoe4-auto-run.spec.ts`, "select keeps open step rows and opens the new rows that have options": before
  selecting the other build, assert the two builds' expected open-row lists differ, so the case cannot pass
  when both builds give the same list. Pick the other build so that holds with the shipped data.
- `aoe4-step-annotations.spec.ts`, aria-describedby wiring: wherever a test asserts
  `aria-describedby` equals `auto-run-status`, also assert the id resolves, in the page, to the element
  that shows the status text (`document.getElementById` of the attribute's value is the `auto-run-status`
  element and its text is the status message at that moment). The text assertion on the attribute alone
  passes when the id points at nothing.
- `aoe4-step-annotations.spec.ts`, "the charts dim from the edit until its result lands, and choosing the
  selected build does not dim them": its second half re-chooses the same build, which changes no input.
  Replace it with a case that changes a real input (choose a different prebuilt build, or change the
  duration) and shows the charts dimmed (`opacity` 0.5 through `getComputedStyle`) until the result lands,
  then 1. Rename the test to say what it now checks.
- `aoe4-step-annotations.spec.ts`, "the longest prebuilt step table fits the Build panel ...": wait for
  `step-started` to be visible (not only `step-run`) before the layout measurement, so it cannot measure a
  table that has no times yet. Keep the single `page.evaluate` for the rects (LESSONS).

**5. Spec import order (M8.8).**
In `aoe4-auto-run.spec.ts` the `TABS_VIEWPORT` import sits between lower-case names; order the named imports
from `./helpers` the same way the other edited specs do (case-insensitive alphabetical, helpers added by
this ticket included).

**Docs:** `docs/aoe4-build-order.md` and `ARCHITECTURE.md` mention none of these helpers today
(`git grep -n "holdSimulate\|holdNextSimulate" -- docs ARCHITECTURE.md` finds nothing); no doc change.

**Out of scope:** any change to product code; `aoe4-chart-readability.spec.ts`; the unit-test debt
(vitest `css`, auto-run history, loader abort, identity branch, house gate), which another ticket owns;
the SGS-103 route test gaps and `aoe4-builds-api.spec.ts` `toEqual`, which sit with the server-debt ticket;
chart-layout, split-scroll and legend specs; pinning the split-layout Tab order.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `acceptance/helpers.ts` exports `holdNextSimulate(page, durationSeconds?)` returning a release function. With no duration it holds the next simulate POST; with a duration it holds only POSTs whose body duration equals it and lets others through. Each behavior is exercised by a spec that fails if the helper ignores the argument (a held duration-filtered POST does not resolve until `release()`, and a POST for another duration resolves while it is held).
- [ ] No acceptance spec defines its own hold-simulate function: `git grep -nE "function hold[A-Za-z]*" -- acceptance` matches only `acceptance/helpers.ts`.
- [ ] Every simulate hold in `acceptance/*.spec.ts` goes through `holdNextSimulate`: a `page.route` whose handler awaits a gate promise and then calls `route.continue` is absent from the specs.
- [ ] No spec declares an array literal of two or more chart ids: every match of `git grep -nE "'chart-[a-z-]+', *'chart-" -- acceptance` is in `acceptance/helpers.ts` or in `aoe4-chart-readability.spec.ts`.
- [ ] The invalid-duration test asserts `duration-error` is visible. Mutation check: remove the `is-invalid` class from the duration input in `build-input.tsx` in a throwaway worktree; the test fails. The implementer records this in the report.
- [ ] The open-rows test asserts the two builds' expected open-row lists differ before it acts. Mutation check: point the "other" build at the first build; the test fails on that assertion.
- [ ] Wherever a step-annotations test asserts `aria-describedby`, it also asserts the id resolves to the `auto-run-status` element carrying the status text. Mutation check: change the attribute value in `results.tsx` to an id that does not exist (`auto-run-statuz`); every such test fails.
- [ ] The charts-dim test changes a real input and asserts opacity 0.5 until the result lands, then 1. Mutation check: make `results.tsx` ignore `dimmed` (never apply the dimmed class); the test fails.
- [ ] The step-table layout test waits for `step-started` to be visible before measuring, and reads every rect in one `page.evaluate` or an `expect.poll`.
- [ ] The named imports from `./helpers` in `aoe4-auto-run.spec.ts` are in one consistent case-insensitive alphabetical order.
- [ ] Every spec this ticket edits passes under `npm run acceptance` with the specs' own runs repeated once for flake (`--repeat-each=2` on the edited files), and `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] The report names the mutation used for each fixed assertion and lists every spec file edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none
