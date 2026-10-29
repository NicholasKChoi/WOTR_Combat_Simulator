# Batch 1 suite gate: CI-parity run

Base: origin/main `d54af2e` (docs: add ARCHITECTURE.md layout framework).
Scope: sgs-001-wotr-combat-design-doc, sgs-007-unit-test-runner, and both merged.
Method: fresh detached checkouts in scratch worktrees (shared worktrees untouched). Per branch: npm ci, npx tsc --noEmit, npx next build; plus npm test on sgs-007 and the combined check. REPO.md commands.unit is empty, so npm test was run explicitly. No code or test files were edited. Logs: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/66b68a31-5a09-4d8c-9e4e-2beeff7c5e5c/scratchpad/batch1/

## Summary

| Check | Commit | npm ci | tsc | next build | npm test | Tree clean | Verdict |
|---|---|---|---|---|---|---|---|
| sgs-001-wotr-combat-design-doc | 47c8931 | pass | pass | pass | n/a (no test script on branch) | yes | PASS |
| sgs-007-unit-test-runner | e2ce61d | pass | pass | pass | pass (4/4) | yes | PASS |
| combined (001 + 007 merged on d54af2e) | 2ba7529 | pass | pass | pass | pass (4/4) | yes | PASS |

Combined merge: clean, no conflicts. SGS-001 adds only docs/combat-simulator.md (+168 lines). SGS-007 touches package.json, package-lock.json, vitest.config.ts, utils/utils.test.ts. Merge commits: 505ce54 (001), 2ba7529 (007).

## Details

### sgs-001 (47c8931)
- npm ci: exit 0 (audit warnings only).
- npx tsc --noEmit: exit 0.
- npx next build: exit 0. Routes: /, /apps/combat-simulator, /apps/starcraft-helper, /api/fight, /api/models/army.
- Tree after build: clean.

### sgs-007 (e2ce61d)
- npm ci, npx tsc --noEmit, npx next build: exit 0.
- npm test (vitest run, Vitest 1.6.1): exit 0. utils/utils.test.ts 4 passed, 1 file.
- Tree after build and test: clean.

### combined (2ba7529)
- npm ci, npx tsc --noEmit, npx next build: exit 0.
- npm test: exit 0, 4/4 passed.
- Tree clean.

## Failures

None. No stale-test, impl-defect, spec-gap, environmental, or blocker findings.

## Notes (not failures)

- Browserslist "caniuse-lite is outdated" and npm audit advisories are informational.
- Next build prints "No ESLint configuration detected." Expected per REPO.md; no lint gate exists.
- SGS-001 has no test script, so npm test is not applicable there.
- Scratch worktrees are registered in the shared repo's worktree metadata (unpushed). Remove them when done.
