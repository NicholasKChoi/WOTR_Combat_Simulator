# SGS-007 review 1

Verdict: **REQUEST CHANGES**

Reviewed commit 67ba9d8 against base origin/main d54af2e (`git diff d54af2e...67ba9d8`). The branch is not on origin yet, so I reviewed the local commit in a detached worktree at `worktrees/review-sgs-007-unit-test-runner` and removed the worktree when done.

## Blocking findings

1. `utils/utils.test.ts:5` and `utils/utils.test.ts:13` - contract - Both inputs are already in ascending order (`[1, 2, 2, 3, 4, 5]` and `[1..8]`), so a `shuffle` that sorts the caller's array in place passes every test. Acceptance criterion 2 explicitly lists "sort ... the input in place" as a break that must make `npm test` exit non-zero. I checked it with two temporary edits to `utils/utils.ts`. `const clone = [...array.sort()]` gave rc=0. Adding `array.sort(); return clone;` also gave rc=0. A descending sort or a reverse does fail (rc=1), so the gap is specific to ascending input. The test can miss a real bug: a sort-in-place regression would reorder the arrays passed in by callers (the StarCraft helper's player and map lists). Fix: use an unsorted input in the "does not mutate the input" test, and ideally in the duplicates test too (for example `[3, 1, 4, 1, 5, 9, 2, 6]`). Then re-run the sort-in-place mutation and confirm it fails. Use a numeric comparator (`(a, b) => a - b`) in the multiset comparison if any value has two or more digits.

2. `package-lock.json:2` - convention (shipped-artifact hygiene) - The top-level `"name"` changed from `"WOTR_Combat_Simulator"` to `"sgs-007-unit-test-runner"`. `package.json` has no `name`, so npm used the worktree directory name. This adds an unrelated change to the diff and puts a factory ticket id into a committed file. Every later lockfile regeneration in a differently named worktree would change it again. Fix: restore `"name": "WOTR_Combat_Simulator"`. Either edit that one line or regenerate from a directory with that name. Then confirm `npm ci` still succeeds.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `npm ci` then `npm test` runs once, runs utils test, exits 0 | pass | `npm ci` rc=0; `npm test` ran `vitest run` v1.6.1: 1 file, 4 tests passed, rc=0, no watch |
| 2 | Drop, duplicate, sort or mutate in place makes `npm test` fail | **fail** | drop rc=1; drop+duplicate (`[...array.slice(1), array[1]]`) rc=1; `clone = array` rc=1; shuffle input in place and return a copy rc=1; reverse in place rc=1; **ascending sort in place rc=0** (two variants) |
| 3 | Discovers only `utils/**/*.test.ts`, `lib/**/*.test.ts` | pass | With throwaway `acceptance/z.spec.ts` and `utils/z.spec.ts` (both throw), neither was collected; `golang/frontend/src/App.test.js` exists and was not collected; only 2 files ran |
| 4 | No server, browser, or acceptance setup | pass | Node environment, default config; no browser process during the run |
| 5 | `lib/<app>/*.test.ts` with a relative sibling import runs with no extra config | pass | Throwaway `lib/x/a.test.ts` importing `./a` ran and passed; removed afterwards |
| 6 | Playwright `--list` does not collect the utils test | not verified | `playwright.config.ts` is not on this base because SGS-002 has not merged; the implementer report says so as well |
| 7 | `npx tsc --noEmit` passes | pass | rc=0 (Vitest 1.x types load under TS 4.7 with `moduleResolution: node`; tsconfig unchanged) |
| 8 | `npx next build` succeeds | pass | Build completed; route table unchanged |
| 9 | lockfileVersion 2 and `npm ci` succeeds | pass (see finding 2) | `"lockfileVersion": 2`; `npm ci` rc=0 |
| 10 | No change under pages/components/styles; utils.ts byte-identical | pass | `git diff --quiet d54af2e HEAD -- utils/utils.ts pages components styles` is clean |
| 11 | No invariant regressions | pass | No app code changed |

I ticked no criteria because the verdict is not APPROVE.

## Invariants touched

- S1 (apps independent): holds. No imports change. The new test imports only `./utils`.
- S2 (linked and wrapped): holds. No pages added.
- S3 (bounded simulation): holds. No new inputs.
- H3 (uniform randomness): holds. `utils/utils.ts` is unchanged. The new test makes no assertion about the distribution, as the ticket specifies.
- W1, W2, H1, H2, A1 to A3: not touched.

## Spec-checklist

- Contracts: there are no API or field surfaces in the diff. The `test` script name matches the ticket.
- Scope: nothing under `golang/` changed. No CONTEXT.md out-of-scope item was implemented. No coverage, watch script, CI, jsdom, or tsconfig change. No open question was answered with a constant.
- Naming: fine.
- S1 to S3: hold (see above).

## Lint

`commands.lint` = `npx tsc --noEmit`: rc=0, no findings. The repo has no ESLint config.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran and there was nothing to reconcile.

## Conventions

- `vitest.config.ts` matches the ticket's config exactly, with explicit `vitest` imports and no `globals`.
- `utils/utils.test.ts` uses 4-space indentation, matching `utils/utils.ts:1-18`. Semicolon use is already mixed across the repo's `.ts` files (`pages/api/fight.ts:1-3` uses both), so omitting them is not a departure. There are no prior test files in the repo to compare layout against.
- Commit author is `choinickolas@gmail.com`, as Vercel requires. The commit message contains no ticket ids or PR numbers.

## Correctness and REPO.md review checklist

- Every diff: `npx next build` passes. No page or component changed, so I did not run a manual `npm run dev` page click-through. The page bundles are unchanged.
- Shared code (`utils/**`): the only change is a new test file. `utils/utils.ts` is unchanged, so its consumers (StarCraft helper) are unaffected.
- Combat simulator, StarCraft helper, golang: not touched.
- No resource, concurrency, or error-handling concerns in a config file plus a test file.

## Non-blocking notes

- The lockfile regeneration also bumped three existing transitive packages of `postcss`/`next`: `nanoid` 3.3.4 to 3.3.20, `picocolors` 1.0.0 to 1.1.1, `source-map-js` 1.0.2 to 1.2.2. All stay within their major version and `next build` passes. No package was removed. Mention it in the PR description.
- Vitest prints "The CJS build of Vite's Node API is deprecated" on every run. This is harmless. Renaming to `vitest.config.mts` would silence it, but that departs from the ticket, so leave it.
- Vitest 1.x / Vite 5 need Node 18 or newer. Vercel's default Node satisfies this, and devDependencies are installed on Vercel.
- The PR description must state the test-location convention from the ticket, and that the Playwright `--list` check was not run.
- Merge order with SGS-002: regenerate the lockfile with `npm install --lockfile-version 2` rather than merging it by hand. Check the top-level `name` again afterwards (finding 2).

## Coverage

Files reviewed: `package.json`, `vitest.config.ts`, `utils/utils.test.ts`, and `package-lock.json` (structural diff of the `packages` map against base, plus the name and lockfileVersion fields).
Commands I ran: `npm ci`, `npm test`, `npx tsc --noEmit`, `npx next build`, 8 temporary mutations of `utils/utils.ts` (all reverted), and discovery checks with throwaway files (all removed).
Not reviewed: the Playwright `--list` interaction (SGS-002 is not merged) and a manual `npm run dev` page load (no page changes).
