# SGS-007 implementer report

Status: needs_review

- Branch: sgs-007-unit-test-runner (base origin/main d54af2e)
- Worktree: /home/choin/git/WOTR_Combat_Simulator-factory/worktrees/sgs-007-unit-test-runner
- Tip SHA: see summary returned to manager (single commit "test: add Vitest unit test runner")

## Files
- package.json: `test` script (`vitest run`), devDependency `vitest ^1.6.0` (resolved 1.6.1).
- package-lock.json: regenerated with `npm install --lockfile-version 2`; lockfileVersion stays 2.
- vitest.config.ts: include `utils/**/*.test.ts`, `lib/**/*.test.ts`; exclude acceptance, node_modules, .next, golang.
- utils/utils.test.ts: 4 smoke tests for `shuffle`.

## Tests
`npm test`: 1 file, 4 tests, all pass. Invariants encoded: same length and elements (with duplicates), input not mutated, new array returned, empty in gives empty out. No order or randomness assertions.

Mutation checks (each temporarily applied to utils/utils.ts, then restored; utils.ts has no diff):
- drop an element: rc=1
- duplicate an element: rc=1
- shuffle in place (clone = array): rc=1
- return the input array: rc=1

Discovery: a throwaway `lib/x/a.test.ts` with a relative import ran and passed; a throwaway `acceptance/z.spec.ts` that throws was not run; `golang/frontend/src/App.test.js` not run. Throwaways removed, not committed.

## Gates
- codegen: none set.
- `npm ci`: ok (lockfileVersion 2).
- `npx tsc --noEmit`: exit 0 (Vitest 1.x types work under TS 4.7; no tsconfig change needed).
- `npx next build`: succeeded.
- Playwright `--list` check: not run, playwright.config.ts does not exist on this base (SGS-002 not merged).
- lint: REPO.md lint is `npx tsc --noEmit`, covered above.

## Notes
- Vitest prints "CJS build of Vite's Node API is deprecated" because the package is not `"type": "module"` and the config is `.ts`. Harmless warning; renaming to `vitest.config.mts` would silence it but deviates from the ticket.
- `npm install` reported audit vulnerabilities (pre-existing dependencies plus vitest's tree); not addressed.
- Invariants: no app code, pages, components or styles touched; S1-S3, H3 untouched.
- PR description should state the test convention from the ticket (tests next to code as `<name>.test.ts` under `utils/` or `lib/<app>/`, never under `pages/`; e2e stays in `acceptance/` as `*.spec.ts`).
- Out-of-scope findings: none.
- Merge-order note: lockfile must be regenerated with `npm install --lockfile-version 2` if SGS-002 merges after.
