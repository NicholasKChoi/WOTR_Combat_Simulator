# SGS-007: Add a unit test runner runnable by `npm test`

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M1 / M1.10
- **Priority**: high
- **Risk**: standard
- **LOC estimate**: ~35 (vitest.config.ts ~10, utils/utils.test.ts ~25, package.json script and devDependency ~3; no production code changes; lockfile excluded)
- **Depends on**: none
- **Source**: M1.10; CONTEXT.md Decisions ("Testing: WOTR battle logic moves to `lib/combat-simulator/` ... unit-tested directly with a new unit test runner"). SGS-004 and SGS-005 depend on this ticket.

## Context

The root `package.json` has only a `dev` script and no test runner (REPO.md `commands.unit` is empty). ARCHITECTURE.md
(origin/main d54af2e) says `lib/<app>/` is plain TypeScript with no React or Next imports "so it can be tested", and
SGS-004 and SGS-005 will unit-test `lib/combat-simulator/`. This ticket adds the runner and one smoke test so those
tickets only add test files.

## Scope

Runner choice: **Vitest** (`vitest run`). Rationale from the repo:

- No Babel config exists. Jest would need `babel-jest` plus a TS preset, `ts-jest`, or `next/jest`. Vitest transpiles
  `.ts` with esbuild and needs none of them. It does not read `tsconfig.json` `jsx: preserve` for `.ts` files, and
  `isolatedModules: true` is compatible with esbuild's per-file transpile.
- `lib/` logic is plain TypeScript with no React, so no DOM environment or JSX transform is needed. Default `node`
  environment.
- Node v22.17 on the host; Vitest runs on it. TypeScript 4.7 is only used by `tsc`, not by the runner.
- Closed PR #12 used Jest (commit 6887ba8) and was superseded; no Jest config or dependency is on main to reuse.

Changes:

1. `package.json`: add devDependency `vitest` (pin one major; update `package-lock.json`, keeping `lockfileVersion` 2)
   and script `"test": "vitest run"`. `vitest run` is non-watch and exits non-zero on any failure.
2. `vitest.config.ts` at the repo root (`import { defineConfig } from 'vitest/config'`):
   - `test.include`: `['utils/**/*.test.ts', 'lib/**/*.test.ts']`.
   - `test.exclude`: `['acceptance/**', 'node_modules/**', '.next/**', 'golang/**']`.
   - Explicit `include` is required: Vitest's default pattern matches `*.spec.ts`, which would pick up the Playwright
     files in `acceptance/` (SGS-002), and `golang/frontend/src/App.test.js`.
   - Tests import `describe`, `it`, `expect` from `vitest` explicitly; do not enable `globals` or change `tsconfig.json`
     `types`.
3. `utils/utils.test.ts`: a smoke test of `shuffle` from `utils/utils.ts` (production file unchanged):
   - the result has the same length and the same elements as the input (compare sorted copies), including
     duplicates, e.g. `[1, 2, 2, 3, 4, 5]`;
   - the input array is not mutated (`shuffle` clones: `const clone = [...array]`);
   - the returned array is a different object from the input;
   - an empty array returns an empty array.
   No assertion on the order or on randomness (the output is random; stubbing `Math.random` is not needed).

Test convention to state in the PR description and follow in later tickets: unit tests live next to the code as
`<name>.test.ts` under `utils/` or `lib/<app>/`. Never put a test file under `pages/` (every file there becomes a
route). End-to-end tests stay in `acceptance/` as `*.spec.ts`, run only by Playwright (`npm run acceptance`, SGS-002).
`playwright.config.ts` sets `testDir: 'acceptance'`, so it never sees files under `utils/` or `lib/`.

Typecheck risk to verify: `tsconfig.json` includes `**/*.ts`, so `tsc --noEmit` and `next build` typecheck
`vitest.config.ts` and the test file, with `moduleResolution: node` and TS 4.7. If the chosen Vitest/Vite major ships
declarations TS 4.7 cannot parse or resolve, pick an older Vitest major that works, rather than changing the
TypeScript version or `moduleResolution`. Adding `vitest.config.ts` to `tsconfig.json` `exclude` is a last resort;
if used, say so in the PR description.

**Out of scope:** editing REPO.md `commands.unit` (a human does this after merge, M1.10's second half); Jest; React or
DOM testing (jsdom, Testing Library); coverage tooling; watch-mode script; CI workflow files; moving or testing
`pages/api/fight.ts` or any `lib/combat-simulator/` code (SGS-004, SGS-005); any change to `pages/**`, `components/**`,
`utils/utils.ts`, `styles/**`; the Playwright harness itself (SGS-002); `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] After `npm ci`, `npm test` runs once without watching, runs `utils/utils.test.ts`, and exits 0 on a clean checkout.
- [x] Changing `shuffle` in `utils/utils.ts` to drop or duplicate an element, or to sort/mutate the input in place, makes `npm test` exit non-zero (verify locally by temporarily breaking it; do not commit the break).
- [x] The unit runner discovers only `utils/**/*.test.ts` and `lib/**/*.test.ts`: a `*.spec.ts` under `acceptance/` and `golang/frontend/src/App.test.js` are not run by `npm test`.
- [x] `npm test` does not start a server or a browser, and does not require `npm run acceptance:setup`.
- [x] A `*.test.ts` file under `lib/<app>/` importing a sibling module with a relative import runs under `npm test` with no extra configuration (check with a throwaway file; do not commit it).
- [ ] The Playwright config (once SGS-002 merges) does not collect `utils/utils.test.ts`; with both branches present, `npx playwright test --list` shows only `acceptance/` specs. If SGS-002 is not yet merged when this is implemented, state that this check was not run.
- [x] `npx tsc --noEmit` passes with the new `.ts` files.
- [x] `npx next build` still succeeds.
- [x] `package-lock.json` keeps `lockfileVersion` 2 and `npm ci` succeeds.
- [x] No files under `pages/`, `components/`, `styles/` change, and `utils/utils.ts` is byte-identical to main.
- [x] No INVARIANTS.md regressions (S1 to S3 and H3 are untouched: no app code changes).

## Open questions

- None blocking. Note for the manager: this ticket and SGS-002 both edit `package.json`, `package-lock.json` and (SGS-002 only) `.gitignore`; whichever merges second needs a lockfile regeneration (`npm install`, not a hand merge). They do not conflict on script names (`test` here, `acceptance` and `acceptance:setup` there).

## Rework 1 - 2026-10-28 (review)

Bounced by review at tip 67ba9d8 (report: reports/SGS-007-review.md). No earlier gate had passed.

Findings:
- `utils/utils.test.ts:5`, `:13`: both test inputs are already sorted, so a `shuffle` that sorts the caller's array in place (`[...array.sort()]`, or `array.sort(); return clone;`) passes every test. Acceptance criterion 2 names that break.
- `package-lock.json:2`: top-level `"name"` changed from `"WOTR_Combat_Simulator"` to `"sgs-007-unit-test-runner"` (npm used the worktree directory name because package.json has no name).

Required fixes:
- [x] Use unsorted test inputs (e.g. `[3, 1, 4, 1, 5, 9, 2, 6]`) and assert the input is unchanged after the call; re-apply both sort-in-place mutations and confirm `npm test` fails on each, then restore `utils/utils.ts`.
- [x] Restore `"name": "WOTR_Combat_Simulator"` in package-lock.json (top level and `packages[""]` if present) and confirm `npm ci` still succeeds with lockfileVersion 2.

Acceptance criterion 2 (rework 1): the no-mutation test fails for an in-place sort as well as an in-place shuffle.

## Gate log - 2026-10-28

- review: REQUEST CHANGES at 67ba9d8 (rework 1); APPROVE at e2ce61d (reports/SGS-007-review-2.md).
- acceptance-test: skipped. REPO.md has no acceptance harness configured (SGS-002 not merged).
- PR description must note: lockfile regeneration bumped nanoid, picocolors, source-map-js within majors; unit tests live at `utils/**/*.test.ts` and `lib/**/*.test.ts`; Playwright `--list` check not run (SGS-002 unmerged). Whichever of SGS-002/SGS-007 merges second regenerates the lockfile with `npm install --lockfile-version 2` and rechecks the top-level name.
