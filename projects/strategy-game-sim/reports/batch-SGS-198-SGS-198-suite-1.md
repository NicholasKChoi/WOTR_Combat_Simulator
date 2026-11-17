# Suite report: batch-SGS-198-SGS-198

## Verdict: PASS

- Command run: `npm test` (`vitest run`), the full `commands.unit`, not a subset.
- Summary line: `Test Files  90 passed | 1 skipped (91)`, `Tests  2844 passed | 15 skipped (2859)`. Exit 0.
- Branch: `sgs-198-units-chart-unit-lines`
- Tip SHA: `3bd813828f32e1058b44ec6a642bad941ea36e5e`
- Scratch checkout: `suite-SGS-198-SGS-198` (created at the tip SHA with the branch listed), removed after the run.
- Log: `/tmp/claude-1000/suite-SGS-198-SGS-198/suite-SGS-198-SGS-198.unit.log`
- Tree after the run: `git status --porcelain` is empty. No codegen (`commands.codegen` is empty).

## Steps

1. Scratch checkout created at `3bd813828f32e1058b44ec6a642bad941ea36e5e`, exit 0.
2. Runtime check through run.sh: `node v24.22.2`, `npm 11.19.1`.
3. `commands.acceptanceSetup` was not run in full. Its `link-node-modules.sh .` step was run (node_modules linked from the nm-cache, exit 0). The Chromium install (`acceptance:setup`) was skipped because vitest does not use it.
4. `commands.codegen` is empty, so it was skipped.
5. `commands.unit` run in full, output teed to the log above.

Only `commands.unit` was run. `commands.lint` (`tsc --noEmit` and `lint:dup`) and `commands.build` were not part of this suite.

## FAIL

None.

## BLOCKER

None.

## Environment

- Node runtime matches the `engines.node` declaration `24.x` in `package.json`. Installed `v24.22.2`. No mismatch. No `.nvmrc`, `.node-version`, or `.tool-versions` exists in the repo.
