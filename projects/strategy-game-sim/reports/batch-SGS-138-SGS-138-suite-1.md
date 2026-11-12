# Suite gate: batch SGS-138 (SGS-138-suite-1)

## Verdict: PASS

- Branch: `sgs-138-pinned-runs-no-tooltip-one-legend-entry`
- Branch SHA verified: `7556a2c` (commit "Keep pinned runs out of the chart tooltip and show one dashed legend entry")
- Base: `origin/main` (94a439d)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-138` (detached at 7556a2c)

## Commands run

| Step | Command | Result |
|------|---------|--------|
| Runtime check | `node -v && npm -v` via run.sh | node v24.22.2, npm 11.19.1 |
| Dependencies | `bash .../bin/link-node-modules.sh .` via run.sh | linked from `nm-cache/d57d0fdd0e531d4b` |
| Unit | `timeout 590 npm test` (`commands.unit`, via run.sh) | PASS |
| Codegen | `commands.codegen` is empty | not run |
| Acceptance setup | not run (see note) | not run |

Note on acceptance setup: the unit suite (Vitest) only needs `node_modules`. I ran the first half of
`commands.acceptanceSetup` (the `link-node-modules.sh` step) and skipped `npm run acceptance:setup`
(Chromium install), because Vitest does not use it. The verdict does not depend on it.

Unit summary line (`npm test`, vitest run):

- Test Files: 80 passed | 1 skipped (81)
- Tests: 2484 passed | 15 skipped (2499)
- Duration: 3.98s

Full log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-138-unit.log`

## Failures

None.

## Tree state

`git status --porcelain` in the suite worktree after the run: clean (no output). No codegen configured, so nothing was generated.

## Blockers

None.

## Environment

- Declared runtime: `engines.node` = `24.x` in `package.json`. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` present.
- Installed through run.sh: Node v24.22.2. Matches the declared range, so no mismatch.
- Install command, if needed on another machine: `source ~/.nvm/nvm.sh && nvm use 24`.

## Cleanup

Worktree removal and prune follow this report.
