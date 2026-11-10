# Batch 10 suite gate, tip c016f92e3089747e8e1f1d6edbfcb350f2229278 (sgs-105-save-and-open-by-link)

Verdict: unit and lint PASS; acceptance FAIL (1 of 848, stale-test).

## Commands
- `npm ci && npm run acceptance:setup`: ok. codegen: none. `git status --porcelain` clean after runs.
- `npm test` (commands.unit): 62 files passed, 1857 tests passed, 10 skipped.
- `npx tsc --noEmit && npm run lint:dup`: pass, 0 clones.
- `npm run acceptance` (ACCEPTANCE_PORT=3791): 847 passed, 1 failed (2.0m).

## Failure
- Classification: stale-test (belongs to SGS-105's acceptance spec; the code is right).
- `acceptance/aoe4-save-open.spec.ts:704`, test "opening a link > a saved build whose text no longer converts opens as text with the issues and no run".
- Expected `getByTestId('tab-build')` to have `aria-selected="true"`; got element not found.
- Cause: this test uses the default desktop viewport, where SGS-104's split layout renders no tabs (workbench-tabs.tsx only renders tab buttons when not split). Every other assertion in the test passed up to line 703. The spec was written before the rebase onto the split layout. Fix: drop the tab assertion here or set `PHONE` viewport (as the "tab after a load at 390 px" describe at line 709 does).

## Environment
- Node v24.22.2 matches engines `24.x`. No mismatch.
- Playwright server on 3791 stopped; no leftover listener. Worktree suite-batch10 removed. `git worktree prune` printed an unrelated "Device or resource busy" for `.git/worktrees/rebase-sgs-102` (stale entry from another agent).
