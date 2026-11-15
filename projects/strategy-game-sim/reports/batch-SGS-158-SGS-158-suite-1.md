# Suite report: batch SGS-158-SGS-158 (suite-1)

**Verdict: PASS**

- Ticket: SGS-158 (WOTR combat die hits on 5 or 6), standalone, Milestone none.
- Branch: `sgs-158-dice-hit-5-or-6`, top-of-stack SHA `dea14a6491585f03febfe752f53ebf2cded02c82`.
- Base: `main` (origin/main at 35dd0ab when the batch was launched).
- Scratch checkout (removed after this report): `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-158-SGS-158`.

## Command run

`commands.unit` = `npm test` (Vitest, `vitest run`), run in full through run.sh. Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-158-SGS-158-unit.log`.

Summary line:

- Test Files: 83 passed, 1 skipped (84)
- Tests: 2562 passed, 15 skipped (2577)

No failures. `commands.unit` is set, so `build` and `lint` were not run. `commands.codegen` is empty, so it was skipped.

## Setup

- `commands.acceptanceSetup` was not run. Its Chromium install is for acceptance tests, which the unit suite does not need. Only its dependency step ran, `link-node-modules.sh .` (node_modules linked from the nm-cache, hash d57d0fdd0e531d4b), because the unit suite needs node_modules.

## Working tree

`git status --porcelain` after the run was empty. The tree is clean.

## Environment

- Declared runtime: `engines.node` = `24.x` in package.json (also the `commands.shellSetup` nvm target, `nvm use 24`). No `.nvmrc`, `.node-version`, or other version file in the checkout.
- Installed through run.sh: Node v24.22.2. This matches the declared range. No mismatch.
- No runtime version mismatch on this verdict.

## Failures

None.

## Notes

- The one skipped test file and the 15 skipped tests were not inspected. They are pre-existing skips and the verdict does not depend on them.
