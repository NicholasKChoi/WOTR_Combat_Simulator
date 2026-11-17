# Suite report: batch-SGS-193-SGS-193 (suite-1)

## Verdict: PASS

- Command run: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), run through `run.sh`.
- Summary line: `Test Files  90 passed | 1 skipped (91)`, `Tests  2836 passed | 15 skipped (2851)`. Exit 0.
- Branch: `sgs-193-step-annotations-name-the-wait`, tip `a84332a347505df974d5c36e87a4e7921d388bb0` (scratch checkout detached at this SHA).
- Full log: `/tmp/claude-1000/suite-SGS-193-SGS-193/suite-SGS-193-SGS-193.unit.log`
- Tree after run: `git status --porcelain` empty (clean).
- Only the full command was run; no partial package runs. `commands.lint` and `commands.build` were not run (not part of the unit verdict).
- `commands.codegen` is empty; nothing run.
- `commands.acceptanceSetup` run (`link-node-modules.sh` plus `npm run acceptance:setup`, Chromium install); exit output showed no error. Acceptance tests were not run (not part of this suite).

## Environment

- Node: installed `v24.22.2` (npm 11.19.1), loaded through `run.sh` with `commands.shellSetup`. Declared: `engines.node` `24.x` in `package.json`; no `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions`. Match, no mismatch.
- Vitest reports `v5.0.5`.
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-193-SGS-193` (removal below).

## Failures

None.
