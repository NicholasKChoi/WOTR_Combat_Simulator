# SGS-118 implementer report 1

- Ticket: SGS-118. Branch: `sgs-118-acceptance-test-debt`. Tip: `4dbf100`. Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-118-acceptance-test-debt`. Base: `origin/main` (b3da879).
- Status: needs_review

## Files touched
- `acceptance/helpers.ts`: added `bodyDuration`, `holdRequests`, `holdNextSimulate`.
- `acceptance/aoe4-auto-run-contract.spec.ts`: dropped local hold, imports shared one; status-line test records simulate responses and asserts none before `release()`.
- `acceptance/aoe4-build-order-pin-compare.spec.ts`: dropped `holdSimulate` and `bodyDuration`; "a run that finishes before the restore lands" tracks LOAD_DURATION responses (none before release, one after).
- `acceptance/aoe4-step-annotations.spec.ts`: shared hold; `expectDescribedByStatus` helper (one `page.evaluate`) used in "deleting a row ..." and "an invalid edit dims ..."; charts-dim test rewritten and renamed; layout test waits for `step-started`.
- `acceptance/aoe4-compact-view.spec.ts`, `acceptance/aoe4-build-order-step-band.spec.ts`: shared hold, `CHART_IDS`; step-band uses `waitForRequest(isSimulatePost)` instead of `hitOnce` and the two no-op `unroute` calls are gone.
- `acceptance/aoe4-results-split.spec.ts`: `CHART_IDS` from helpers.
- `acceptance/aoe4-auto-run.spec.ts`: shared holds, `CHART_IDS` loop, `duration-error` `toBeVisible`, open-rows pre-assertions, `TABS_VIEWPORT` import order.

## Tests run
- `npx tsc --noEmit` and `npm run lint:dup`: pass (0 clones).
- `npm test`: 63 files, 1972 passed, 13 skipped.
- Acceptance with `--repeat-each=2`: contract, step-annotations, compact-view, results-split: 62 passed. auto-run, pin-compare, step-band: 130 passed.
- Grep criteria: `function hold*` only in helpers.ts; `await gate` outside save-open only the pin-compare restore handler (fulfills 500); no `['chart-units-produced'` array in specs. Import lists in the 7 edited specs are code-point sorted and every name is used (checked by a throwaway script).
- Build and codegen not run (codegen is empty; changes are acceptance-only, tsc covers them).

## Pre-existing tests edited
- `aoe4-step-annotations.spec.ts` "the charts dim from the edit until its result lands, and choosing the selected build does not dim them": rewritten and renamed per Scope 5.
- `aoe4-auto-run.spec.ts` "an invalid duration", "select keeps open step rows ...", "a first invalid load state has no target", "a superseded request ...": per Scope 2 and 5.
- Others only swapped their hold call or gained assertions as the ticket lists.

## Doc claims
- helpers.ts comment: "Holds every matching request until the returned function runs; later matching requests then pass at once. Other requests on the path go to any route registered earlier." True: `holdRequests` awaits one shared gate for matching requests and calls `route.fallback()` otherwise.

## Pinned outputs
None.

## Mutation checks (all undone; throwaway edits via checkout)
1. Delete `await gate` in `holdRequests`: the contract status-line test failed, but at `data-status 'updating'` on the second hold (helpers.ts, line 49 of the spec), not at the new `expect(answered).toEqual([])`. The first-hold check passed because the status was `running` before the response landed. The test fails, but the new assertion was not the one that caught it.
2. `holdNextSimulate` ignores `durationSeconds` (passes `undefined`): pin-compare test timed out in `runOk`'s `waitForResponse` (the 600 s run was held).
3. `holdNextSimulate` holds nothing (`() => false`): pin-compare test failed in `runOk` (`Expected: 600, Received: 1200`, the load run answered). It fails but not at the new `heldAnswers` assertion.
4. Remove `is-invalid` in `build-input.tsx`: "an invalid duration" failed at `toBeVisible()` (`hidden`).
5. Other build `BUILDS[0]`: open-rows failed at the new "newly opened row" assertion (`expect(...).toBe(true)`, received false).
6. `id="auto-run-statuz"`: both "deleting a row ..." and "an invalid edit dims ..." failed at `expect(described).toEqual(...)` in `expectDescribedByStatus`.
7. `results.tsx` never applies `styles.dimmed`: charts-dim test failed at `poll(lastGoodOpacity).toBe(0.5)` (received 1).

## Invariant check
Test-only change; no product code touched. No invariants apply.

## Out-of-scope findings
- Mutations 1 and 3 show the new "no response before release" assertions are not the first to fail, because the surrounding status/response waits already catch a broken hold. They remain valid pins but could be made the first failure by waiting briefly after `running` before reading the answered list; left as the ticket specifies.

## Notes
- The first worktree add attempt created the branch but not the worktree (sandbox); I added the worktree on the existing branch. I briefly reverted `helpers.ts` with `git checkout` during mutation work and reapplied the identical helper code before committing.
