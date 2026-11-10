# batch11-suite-1: CI-parity suite, SGS-106

Verdict: PASS

Branch sgs-106-smoke-preview, SHA 0aee0751a40e8e7ac9159cb9bb682770f75412d4 (base origin/main). Detached worktree suite-batch11 under worktrees/, removed after.

- Setup: `npm ci && npm run acceptance:setup` ok.
- commands.unit `npm test`: 62 files passed, 1857 tests passed, 10 skipped (1867), exit 0.
- commands.acceptance `npm run acceptance`: 863 passed (2.1m), exit 0.
- codegen: not set. `git status --porcelain` clean after the run.
- Failures: none. No classification needed.

## Environment
Node v24.22.2 via run.sh; `engines` declares 24.x. No mismatch. No `.nvmrc`.
VERCEL_AUTOMATION_BYPASS_SECRET was not printed.
