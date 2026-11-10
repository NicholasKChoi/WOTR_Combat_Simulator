# SGS-102 acceptance-test report 1

Verdict: PASS. Branch sgs-102-use-auto-run, new tip 9cdb07ee974608c5c9a75293d786a31d4e6c4bfe (on ae7fec3). Worktree kept.

The implementer's `acceptance/aoe4-auto-run.spec.ts` (14 cases) already covered every named ticket criterion. I ran it unchanged (18 passed together with my file's first run) and added `acceptance/aoe4-auto-run-contract.spec.ts` for gaps.

## Tests written (acceptance/aoe4-auto-run-contract.spec.ts)
1. Without JavaScript, the server-rendered page has status `loading` with its text, no issues, no `duration-error`, no `results-last-good`, no POST (first paint, no hydration-only state).
2. Status text reads `Computing the simulation.` on the first run, `Updating the results.` while a later run is in flight, empty at `current`.
3. After a server 400, status text is `The charts show the last valid build.`; no `simulation-retry`, no `simulation-error`, no omitted line when `omittedIssues` is absent.
4. Pinning while dimmed (invalid text) names the pin after the shown result's build and duration (`Pinned: <build>, 15:00`), not the live invalid text.

A fifth case (Results enabled by a stored pin during the first run) was dropped: the pin restore needs its own POST, so no pin exists until that returns. Not a defect.

## Results
Harness ran (Playwright, Chromium, per-checkout dev server). All 4 pass. Together with aoe4-auto-run.spec.ts, 18 passed before the fifth was dropped. `npx tsc --noEmit` and `npm run lint:dup` clean. Only the new test file was committed.

## Mutation checks (each reverted with `git checkout`; non-test files clean afterwards)
- Test 2: changed the `running` message to `Computing.`; failed (toHaveText).
- Test 3: rendered `simulation-retry` for any status other than `current`; failed (toHaveCount).
- Test 4: page pin name taken from live `text`/`selected` instead of `shown`; failed (toHaveText).
- Test 1: first-paint status `loading` changed to `current` in use-auto-run.ts; failed (data-status).

## Failures
None. No impl-defects or spec-gaps found.

## Not expressible
Strict `npx next build` first-paint check (reviewer did it); the no-JS dev-server render in test 1 stands in for it.
