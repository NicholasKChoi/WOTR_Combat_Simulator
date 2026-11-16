# Suite report: batch SGS-169-SGS-169 (run 1)

**Verdict: PASS**

## Run

- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-169-SGS-169`
- Branch: `sgs-169-effect-not-simulated-debug-severity`
- Tip SHA: `372f015b2be340b989b9da76d7bd7a3a0fe5b799` (checked out at this SHA; `HEAD` matches)
- Command: `commands.unit` = `npm test` (runs `vitest run`), via `run.sh`
- Log: `/tmp/claude-1000/suite-SGS-169-SGS-169/suite-SGS-169-SGS-169.unit.log`
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2612 passed | 15 skipped (2627)`, duration 6.65s
- Dependencies: the scratch checkout had no `node_modules`. I ran only the node_modules step of `commands.acceptanceSetup` (`bin/link-node-modules.sh`, which linked the cached modules for the lockfile hash). I did not run `npm run acceptance:setup` (Chromium), because the unit suite does not use it.
- `commands.codegen` is empty; no codegen step ran.
- `git status --porcelain` after the run: clean (no output, exit 0). No CI failure from the tree.

## Failures

None.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1`. Declared `engines.node` is `24.x` (`package.json`). No `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions`, or `go.mod` was checked, as none is present in the repo root. Versions match, no mismatch.
- Skipped test file (1) and skipped tests (15) are the existing skips in the suite; they were not run.
