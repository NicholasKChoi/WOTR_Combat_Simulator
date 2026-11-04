# SGS-094 suite-1: CI-parity run

Branch: `sgs-094-aoe4-deer-pack-2450`
Tip SHA: `24a7963` (verified: matches branch tip; based on origin/main `d950413`, ancestor check passed)
Verdict: **PASS**

## Run

- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-sgs-094` (detached at 24a7963, removed after this report)
- Install: `npm ci` (exit 0, 0 vulnerabilities)
- Acceptance setup and codegen: not run. Unit suite needs only `npm ci`; `commands.codegen` is empty.
- Unit command: `npm test` (`vitest run`), exit 0
- Summary line: `Test Files  48 passed (48)`, `Tests  1488 passed | 10 skipped (1498)`, duration 2.75s
- Skipped tests: 10. A repo-wide `git grep` for `it/test/describe .skip/.todo` found none outside `acceptance/`, so the skips come from conditional guards, not literal skip markers. Not investigated further.
- Post-run `git status --porcelain`: clean (no dirty tree).

## Environment

- Declared: `package.json` `engines.node` = `24.x`; `.nvmrc`, `.node-version`, `.tool-versions` absent.
- Installed: Node v24.22.2, npm 11.19.1 (via `scripts/run.sh`). Matches the declared version. No mismatch.

## Failures

None.

## Blockers

None.
