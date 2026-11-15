# Suite report: batch SGS-163 (suite-1)

**Verdict: PASS**

- Command: `npm test` (REPO.md `commands.unit`), run through `run.sh`, full suite.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`. Exit 0.
- Branch: `sgs-163-pin-first-arrival`, tip `e510f1fd05980dece2dc918ea5b6d58ba5fff07a`.
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-163-SGS-163` (checked out at the tip SHA).
- Log: `/tmp/claude-1000/suite-SGS-163-unit.log`.
- Skipped tests (1 file, 15 tests) are pre-existing skips, not failures.

## Failures

None.

## Post-run tree

`git status --porcelain` is empty. No codegen configured (`commands.codegen` is empty), so no dirty-tree check applied beyond this.

## Commands not run

- `commands.acceptanceSetup`: not needed; the unit suite is Vitest only.
- `commands.codegen`: empty in REPO.md.
- `commands.lint` and `commands.build`: not run; `commands.unit` is set, so they are not substituted for it. The verdict comes from the unit suite.

## Environment

- Declared runtime: `engines.node` = `24.x` in `package.json` (no `.nvmrc`, `.node-version`, or other version file found in the checkout).
- Installed through `run.sh` (shellSetup loaded): Node `v24.22.2`. Matches the declared version. No mismatch.
- No install command needed beyond what `commands.unit` links through `link-node-modules.sh`.

## Cleanup

Scratch removal: `bash /home/choin/git/code-factory/scripts/checkout.sh remove "$PROJECT_DIR" suite-SGS-163-SGS-163` is run after this report is written. Result is noted in the handback.
