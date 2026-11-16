# Suite report: batch SGS-183-SGS-183

**Verdict: PASS**

- Command: `npm test` (`commands.unit`, Vitest `vitest run`), run through `run.sh` in the scratch checkout.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2623 passed | 15 skipped (2638)`.
- Branch: `sgs-183-tabs-layout-cases-to-default-viewport`
- Tip SHA: `271f0682233f9df2d4e4c3dda9e2886138447c73`
- Full log: `$TMPDIR/suite-SGS-183-SGS-183/suite-SGS-183-SGS-183.unit.log` (`/tmp/claude-1000/suite-SGS-183-SGS-183/suite-SGS-183-SGS-183.unit.log`)
- Tree after the run: `git status --porcelain` empty. No codegen configured (`commands.codegen` is empty), so no codegen step ran.

## Steps

1. Scratch checkout created: `checkout.sh scratch` at `271f0682`, path `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-183-SGS-183`.
2. Runtime: `node -v` through run.sh gives `v24.22.2`. `package.json` `engines.node` is `24.x`, and no `.nvmrc` or `.node-version` is present. Match.
3. `commands.acceptanceSetup` ran through run.sh (`link-node-modules.sh .` then `npm run acceptance:setup`). It linked node_modules from the cache and installed Chromium. It exited without error. The unit suite needs the linked node_modules.
4. Unit suite run in full, output tee'd to the scratch log above.
5. Scratch removal: see the remove call result below.

## Failures

None.

## Environment

- Node `v24.22.2` installed, `engines.node` `24.x` declared. No mismatch.
- `commands.acceptanceSetup` was run in full, as the task instructed, though only the link step feeds the unit suite.
