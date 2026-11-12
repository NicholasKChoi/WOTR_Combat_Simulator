# SGS-128 implementer 2 (Rework 1)

Ticket SGS-128, branch sgs-128-shared-test-helpers-and-jscpd-gates, tip c85f1e0 (was 16efd1a), worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-128-shared-test-helpers-and-jscpd-gates

## Files touched
- `.jscpd.tests.json`: pattern now `{**/*.test.ts,**/*.spec.ts,**/*test-helpers.ts,**/route-test-support.ts,helpers.ts}`; added `maxLines` 5000.
- `.jscpd.json`: added `maxLines` 5000.
- `acceptance/helpers.ts`: new exports `Gate` and `gatedTest(prefix)` (the shared fixture setup: client, extraHTTPHeaders, gate released in teardown); imports `test as base`.
- `acceptance/aoe4-my-builds.spec.ts`, `acceptance/aoe4-save-open.spec.ts`: `const test = gatedTest('<prefix>')` replaces the local Gate interface and `base.extend`; my-builds imports `Gate` as a type.
- `acceptance/aoe4-my-builds.spec.ts`: local `expectLockedWithoutRun(page, posts)` replaces the two identical locked-while-loading blocks (same four disabled/aria-busy checks, debounce wait, zero posts); no assertion removed.
- Ticket: Rework 1 boxes ticked.

## Checks
- `npx tsc --noEmit`: pass.
- `npm run lint:dup`: exit 0, both configs 0 clones (default 223 files, tests config 139 files). `jscpd --config .jscpd.tests.json --debug` lists `acceptance/helpers.ts` (1 match).
- `npm test`: 74 files, 2351 passed, 13 skipped, 0 failed.
- Build and acceptance not run (test-only rework; Playwright specs were refactored but not executed, only type-checked).

## Notes
- No new tests written, so no mutation checks. The folded specs keep every assertion.
- Doc claims: no doc text changed; `ARCHITECTURE.md` lines 48-49 now hold per the review. One comment moved verbatim into helpers.ts above `gatedTest`: "`gate` is released in fixture teardown, so a route handler that waits on it never outlives the test." (true: the fixture calls `open()` after `use`).
- Pre-existing tests edited: none changed in assertion; only the two Playwright specs' setup.
- S1 invariant: `gatedTest` is app-neutral (imports only Playwright and `uniqueClient`).
- Unverified assumptions added: none.
- Out-of-scope findings: none.

Status: needs_review
