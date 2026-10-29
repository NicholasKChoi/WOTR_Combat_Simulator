# SGS-007 review 2

Verdict: **APPROVE**

This is a full re-review of tip e2ce61d (the rework commit on top of 67ba9d8) against base origin/main d54af2e. I diffed with `git diff d54af2e...e2ce61d` and checked the rework delta with `git diff 67ba9d8..e2ce61d`. I worked in a detached worktree at `worktrees/review-sgs-007-unit-test-runner` and removed it afterwards. origin/main is still d54af2e after a fetch.

## Blocking findings

None.

## Required fixes from review 1

1. Unsorted test inputs: **fixed**. `utils/utils.test.ts:8` and `:15` now use `[3, 1, 4, 1, 5, 9, 2, 6]`.
   - The no-mutation test compares the input after the call against a literal (`:17`).
   - The multiset comparison uses the numeric comparator `byValue` (`:4`, `:11`).
   - I re-applied the mutations myself. `npx vitest run` exited 1 for each of these:
     - `const clone = [...array.sort()]`
     - `array.sort(); return clone;`
     - `array.sort(); return [...array];`
     - `array.reverse(); return clone;`
2. Lockfile name: **fixed**. `package-lock.json:2` is `"name": "WOTR_Combat_Simulator"` again, the same as base.
   - The rework changed only that one line in the lockfile.
   - `packages[""]` has no `name` field, the same as base.
   - No `sgs`/`SGS` string appears in any changed file.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `npm ci` then `npm test` runs once and exits 0 | pass | `npm ci` rc=0. `npm test` (vitest 1.6.1 run) ran 1 file with 4 tests, rc=0, no watch. |
| 2 (rework 1) | Dropping, duplicating, sorting in place or mutating in place makes the tests fail | pass | rc=1 for: drop (`clone.slice(1)`), duplicate (`clone[0] = clone[1]`), `const clone = array`, `return array`, the three in-place sort variants, and reverse in place. One of my own mutations (a rotation) gave rc=0, which is correct because a rotation is a valid permutation. `utils/utils.ts` was restored after each run and `git status` was clean. |
| 3 | Only `utils/**/*.test.ts` and `lib/**/*.test.ts` are discovered | pass | I added throwaway `acceptance/z.spec.ts` and `utils/z.spec.ts`, both of which throw. Neither was collected. `golang/frontend/src/App.test.js` exists and was not collected. |
| 4 | No server, browser or acceptance setup | pass | Node environment with no setup files. The run took about 300 ms. |
| 5 | A `lib/<app>` test with a relative sibling import runs | pass | A throwaway `lib/zz/a.test.ts` importing `./a` ran and passed. I removed it afterwards. |
| 6 | Playwright `--list` does not collect the unit test | not run | SGS-002 has not merged. Static check only: on the local `sgs-002-playwright-acceptance-harness` branch, `playwright.config.ts` sets `testDir: 'acceptance'`, so `utils/` is outside its scope. Left unticked. |
| 7 | `npx tsc --noEmit` passes | pass | rc=0 |
| 8 | `npx next build` passes | pass | rc=0. The route table is unchanged. |
| 9 | lockfileVersion 2 and `npm ci` succeeds | pass | `"lockfileVersion": 2`. `npm ci` rc=0. |
| 10 | No changes under pages/components/styles, and utils.ts is byte-identical | pass | `git diff --quiet d54af2e -- utils/utils.ts pages components styles` is clean. |
| 11 | No invariant regressions | pass | No app code changed. |

In the ticket I ticked criteria 1-5 and 7-11. Criterion 6 is left unticked.

## Invariants touched

- S1: holds. The test imports only `./utils`.
- S2: holds. No pages were added.
- S3: holds. There are no new inputs.
- H3: holds. `utils/utils.ts` is unchanged, and the test makes no assertion about order or distribution.
- W1, W2, H1, H2 and A1-A3: not touched.

## Spec checklist

- Contracts: no API, field or metric surfaces. The `test` script name matches the ticket.
- Scope: no change under `golang/`. No coverage tooling, watch script, CI, jsdom or tsconfig change. No invented constants.
- Naming: `byValue` states what it does.
- S1-S3: hold.

## Lint

`npx tsc --noEmit` exited 0 with no findings. The repo has no ESLint config.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty. No bot ran and there is nothing to reconcile.

## Conventions

- The test file keeps the 4-space indentation and no-semicolon style of the first commit, consistent with `utils/utils.ts:1-18`.
- The repo has no other test files to compare against.
- `vitest.config.ts` matches the ticket exactly, with explicit vitest imports and no `globals`.
- Both commits are authored by `choinickolas@gmail.com`. Neither commit message contains a ticket id or PR number.

## Correctness and REPO.md review checklist

- Every diff: `next build` passes. No pages or components changed, so a manual page load is not needed.
- Shared code (`utils/**`): only a test file was added. Consumers of `shuffle` (the StarCraft helper) are unaffected.
- Combat simulator, StarCraft helper and golang: not touched.
- The diff is a config file and a test file, so there are no concurrency, resource or error-handling concerns.

## Non-blocking notes

- Some mutations can pass by chance:
  - An in-place shuffle has about a 1/20160 chance per run of producing the original order and passing the no-mutation test.
  - The duplicate mutation `clone[0] = clone[1]` passes when both positions hold a `1` (2/56).
  - Both are fine for a smoke test. The ticket says not to stub `Math.random`.
- Carried over from review 1, for the PR description:
  - The lockfile regeneration bumped three transitive packages within their majors: nanoid, picocolors and source-map-js.
  - State the test-location convention.
  - State that the Playwright `--list` check was not run.
  - Whichever of SGS-007 and SGS-002 merges second regenerates the lockfile with `npm install --lockfile-version 2`, then re-checks the top-level `name`.
- Vitest prints a warning that Vite's CJS Node API is deprecated. It is harmless, and is left as is per the ticket's filename.

## Coverage

- Files reviewed: `package.json`, `vitest.config.ts`, `utils/utils.test.ts`, and `package-lock.json` (the name/lockfileVersion fields and the rework delta; the packages map was reviewed in review 1 and is unchanged since).
- Commands run: `npm ci`, `npm test`, 9 temporary mutations of `utils/utils.ts` (all reverted), discovery checks with throwaway files (all removed), `npx tsc --noEmit`, `npx next build`.
- Not reviewed: actually running Playwright `--list` (SGS-002 has not merged), and a manual `npm run dev` page load (no page changes).
