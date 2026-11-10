# SGS-102 review 1

Verdict: **APPROVE**

Scope: diff 53d5c37..ae7fec3 (branch sgs-102-use-auto-run, base SGS-100 tip). 28 files, +938 / -585. Full first pass.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

All 23 criteria pass. Each is ticked in the ticket.

- Wiring and removals: pass. Every grep in the criterion is empty. The only `fetch(` match is `components/apps/aoe4-build-order/simulate-client.ts:6`.
- `auto-run-status.test.ts`: pass. `it.each` covers all 14 rows of the Scope table, including `hasResult` for `invalid` and `rejected`.
- `issue-list.test.ts`: pass. The summary appears without a prop. The tests cover omitted 3, 0 and absent.
- The auto-run spec, all 13 named cases: pass. I read every test against its criterion.
  - Hydration console check is present (`acceptance/aoe4-auto-run.spec.ts:65-79`).
  - Clock-paused debounce, undo, comment-only edit, Enter and select flush with the pin label, invalid text dim, first invalid load, duration messages and aria, 400 with `2 more issues not shown.`, 500 and network failure with `Try again`, superseded abort, and 390 px no scroll are all present.
- Rewritten specs: pass. Each of the 16 is justified by a ticket rule; see the section below.
- Small-screen rewrite: pass. The scroll test became "a run does not scroll the page by itself". The sticky test was reduced to the stickiness check, and its `scrollMarginTop` check was removed (rule 7). The implementer report names it.
- Docs: pass. Status texts, duration messages, `Try again` and the summary text are quoted exactly. The only timing given is the design constant of 500 ms. No `\bRun\b` remains.
- First paint: pass. I ran `npx next build` and loaded the page with JavaScript disabled:
  - `data-status="loading"`;
  - no `build-order-issues`, no `duration-error` and no `results-last-good`;
  - zero POSTs.
- Select keeps open step rows: pass. `selectBuild` calls `editText`, and the auto-run spec covers it.
- Gates: pass.
  - `npx tsc --noEmit` is clean.
  - `npm run lint:dup` found 0 clones.
  - `npm test`: 51 files, 1615 passed and 10 skipped.
  - `npm run acceptance`: 753 passed in 1.5 min.
  - `npx next build` succeeded; `/apps/aoe4-build-order` is SSG.
- No INVARIANTS regressions: pass (see below).

## Invariants touched

- S1 (apps independent): holds. All changes stay under the aoe4-build-order component, page, docs and acceptance paths. No shared module was touched.
- S3 (bounded requests): holds.
  - The page sends one POST per settled distinct request.
  - The in-flight request is aborted when superseded.
  - A known 400 is not re-sent.
  - Invalid client input never posts. The duration range is checked before any request, and the acceptance spec checks 59, 3601 and 61.5.
  - Nothing posts before hydration (`hold: !router.isReady`, controller created in an effect, checked with JS disabled).
  - The pin restore is still one `postSimulation` call.
- A3 (deterministic): holds. Late responses are dropped by sequence number, and the superseded-request spec confirms the shown result is the newer one.

## The 16 rewritten specs

Each change follows a ticket rule; none weakens an assertion just to pass.

- **client-check**: rules 1, 2 and 6.
  - The 400 tests now go through `goto`.
  - "client issues clear an earlier server error" now uses a 500, because duration 59 is caught in the browser now.
- **inline-issues**: the scroll-to-issue behavior is deleted by the ticket.
  - The 4 scroll tests, LONG_PASTE and the scroll helpers were removed.
  - The "hidden until Run" checks became "shown on settle", which is the changed behavior.
- **run-errors**:
  - 400 issues now appear in `build-order-issues` with the omitted line.
  - A failure now shows one `simulation-error` paragraph.
- **m4-flow**:
  - Results is enabled after load.
  - The results-stale check became the invalid status plus opacity (rule 3).
- **pin-compare**:
  - The restore and the load are told apart by request body.
  - The reload test expects 2 posts.
  - The invalid paste now dims the results and keeps the charts.
  - The stale test became a dim and undim test.
  - In "pin disabled while shown equals pin", the middle step now runs a new build. That matches the rule that the pin acts on the shown result.
- **m3-flow, chart-readability, knight-longbow-page**:
  - `runSimulation` became `waitForRun` around the edit, plus an explicit switch to the Results tab (rule 5: no run selects a tab).
  - Duration is filled before select, so the select flush carries it.
- **step-band**: "a new Run" became a duration edit that runs. The band and active-row assertions are kept.
- **timeline-compare**:
  - `loadResult` uses the first-load run (default build, 1200 s), which is the same input the old `runWith(builds[0], 1200)` used. Checked against `DEFAULT_DURATION_SECONDS` and `builds[0]` in the page.
  - The long-wait test now passes 1200 explicitly.
- **gather-rates-per-villager, gathered-resources, narrow-layout, results-split**:
  - These are mechanical `waitForRun` swaps, plus a Results tab switch before `pin-run`.
  - In narrow-layout, `runRejected` became `expectInvalidNoRun`, because the unknown id is now caught in the browser.
- **small-screen**: see the acceptance criteria above.
  - The keyboard tests drop the warm-up run, since Results is enabled after load.
  - The "Results disabled" test forces a 500 on load to get a page with no result.
- **step-table**:
  - "table buttons never post" became "post once, after they settle", the inverse rule for auto-run. The add-then-delete-first sequence changes the text, so the single POST is real.
  - The open-row test now runs through a duration edit.

`waitForRun(page, action?, status = 'current')` adds a third argument beyond the ticket signature. It is only used for the `rejected` and `failed` waits, and the default keeps the ticket behavior. This is fine.

## Review checklist (REPO.md)

- Every diff:
  - `npx next build` passes.
  - I loaded the page against `next start` at 360x760, 390x844, 700, 768 and 1280 and screenshotted the current, invalid-duration and failed states. The screenshots are in my scratchpad.
  - At every width:
    - `scrollWidth - clientWidth` is 0;
    - `duration-error` has display block and is visible;
    - the status reads `The charts show the last valid build.`;
    - the failed state shows `The simulation could not be run (HTTP 500).` and `Try again`.
  - The only console error is the 500 the check forced on purpose.
- AoE4 build order:
  - No copied helper. `lint:dup` found 0 clones. `firstPaintState` repeats one expression from the controller; see the notes.
  - Doc sentences match the code.
  - No element mixes Bootstrap utilities with module CSS. `.dimmed` and `.autoRunStatus` sit on elements with no utilities.
  - Conditional classNames use `cn` (`build-input.tsx` duration input, `results.tsx` root).

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no rules file.

## Non-blocking notes

1. `acceptance/aoe4-auto-run.spec.ts:203`: "an invalid duration" checks `duration-error` with `toHaveText` but never `toBeVisible`. The message shows only through Bootstrap's `.is-invalid ~ .invalid-feedback`. If the `is-invalid` class were dropped, the message would be hidden and this test would still pass. I confirmed in a browser that it is visible today. Suggest adding `await expect(page.getByTestId('duration-error')).toBeVisible()`.
2. `components/apps/aoe4-build-order/use-auto-run.ts`: `firstPaintState` repeats the controller's `settledFields` request expression. The ticket put exporting `settledFields` out of scope, and the page does not read `request` at first paint, so a drift would not show. Worth a follow-up to export it from SGS-100's controller.
3. `acceptance/aoe4-auto-run.spec.ts:309-321`: "select keeps open step rows" builds its expected value with the production `hasOptionalField`. It does not first assert that some row differs between `editText` and a bare `setText`. If the two builds ever stop differing, the test cannot catch the break.
4. `acceptance/aoe4-auto-run.spec.ts:189` lists two chart ids by hand where `CHART_IDS` from helpers would do.
5. `docs/aoe4-build-order.md:878`: "Server 400 issues take its place ... until the next settled input". A settled input with the same request key, such as a comment-only edit, keeps the 400 issues, because the controller keeps `rejected` for the same key. If tightened, suggested text: "Server 400 issues take its place under the editor view, without lines, until a settled input changes the request."
6. Out-of-scope, from the implementer: in SGS-100's controller, `shown.selected` can lag when the in-flight key matches (the select happens during an identical in-flight request). This is for the manager to file against the controller, not this ticket.

## Coverage

- Reviewed:
  - every changed source file: `use-auto-run.ts`, `auto-run-status.ts` and its test, `build-input.tsx`, `issue-list.tsx` and its test, `results.tsx`, `workbench.module.css`, `pages/apps/aoe4-build-order.tsx`;
  - `docs/aoe4-build-order.md`;
  - `acceptance/helpers.ts`;
  - the new `aoe4-auto-run.spec.ts`;
  - all 16 rewritten specs;
  - SGS-100's `auto-run.ts`, for semantics.
- Gates run:
  - lint (`tsc` and `lint:dup`);
  - unit tests;
  - build;
  - full acceptance;
  - ticket greps;
  - a JS-disabled first paint;
  - multi-width screenshots and overflow checks.
- Not reviewed: the SGS-100 diff itself, which was out of scope (base).
- One environment limit: the sandbox kills background processes when a command returns, so the production server was started and stopped inside the same command as the browser check.
