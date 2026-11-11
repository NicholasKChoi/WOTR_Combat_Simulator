# Batch 12 CI-parity suite, run 1

Batch: linear stack on origin/main 156bf30
- SGS-120 `sgs-120-named-routes` c09b34d
- SGS-121 `sgs-121-named-build-routes` 6ca957b
- SGS-124 `sgs-124-page-library` bbf6c56 (top of stack, suite SHA)

Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch12` (detached at bbf6c56, removed after this report).

## Verdict: PASS

Every REPO.md command passed on bbf6c56. No failures, so there is nothing to classify and no pre-existing-on-base question arises.

| Step | Command | Result |
|------|---------|--------|
| Acceptance setup | `link-node-modules.sh . && npm run acceptance:setup` | OK (Chromium install) |
| Codegen | `commands.codegen` | empty, not run |
| Unit | `npm test` (vitest run) | PASS: 73 files passed, 2345 tests passed, 13 skipped (2358). Exit 0. Log: `.../reports/batch12-suite-1.unit.log` |
| Lint, typecheck | `npx tsc --noEmit` | PASS, exit 0 |
| Lint, duplication | `npm run lint:dup` (jscpd) | PASS: 0 clones in 154 files |
| Build | `npx next build` | PASS: compiled, all pages and API routes generated (Next 16.4.3) |
| Acceptance | `npm run acceptance` (Playwright, chromium) | PASS: 992 passed, 0 failed, 0 flaky. Log: `.../reports/batch12-suite-1.acceptance-full.log` |

Tree after the run: `git status --porcelain` is empty. Codegen is not configured, so nothing was generated, and no file was left dirty.

## Failures

None.

## BLOCKER

None.

## Environment

- Node: installed v24.22.2 (npm 11.19.1). Declared: `engines.node` "24.x" in `package.json`, and the REPO.md `shellSetup` (`nvm use 24`). Match, no mismatch.
- No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` in the repo.
- Acceptance dev server was started and stopped by Playwright's own `webServer`. No process of mine was left running.
