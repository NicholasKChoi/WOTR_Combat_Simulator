# Suite gate: batch SGS-206-SGS-206

Verdict: **PASS** (unit suite). Extra browser check: **PASS** (29/29 on `acceptance/aoe4-chart-row-feedback.spec.ts`).

- Branch: `sgs-206-chart-table-hover-and-drag`
- Tip SHA: `6b14c0d7c48c2147d88b30695cd6375a28503665`
- Base: `main`
- Scratch checkout: `suite-SGS-206-SGS-206` (removed after this report)

## Unit (primary verdict)

- Command: `npm test` (`commands.unit`, Vitest `vitest run`), run through `run.sh` after `commands.acceptanceSetup`.
- Summary line: `Test Files  91 passed | 1 skipped (92)`, `Tests  2872 passed | 15 skipped (2887)`.
- Log: `/tmp/claude-1000/suite-SGS-206-SGS-206/suite-SGS-206-SGS-206.unit.log`
- No failures.

## Extra: browser check after simplify's drop-indicator change

- Setup: `commands.acceptanceSetup` (`link-node-modules.sh` plus `npm run acceptance:setup`) ran first and exited without error.
- Command: `npx playwright test acceptance/aoe4-chart-row-feedback.spec.ts` (single file, through `run.sh`).
- Result: `29 passed (38.1s)`. Covers the header row highlight, drag feedback, and drop indicator, including the drop-indicator placement cases (release above, within, and below the charts, and between collapsed charts) that exercise the translateY(-50%) centering.
- Log: `/tmp/claude-1000/suite-SGS-206-SGS-206/suite-SGS-206-SGS-206.playwright.log`
- Only a warning from Next.js about `package-lock.json` outside the git repo (the scratch sits under the factory's worktree root). Not a failure.

## Environment

- Node: installed `v24.22.2`, npm `11.19.1`. Declared `engines.node` in `package.json` is `24.x`, and `shellSetup` runs `nvm use 24`. Match, no mismatch.
- `.nvmrc` and `.node-version` are absent.
- node_modules: linked from the factory's `nm-cache/d57d0fdd0e531d4b` by `link-node-modules.sh`.
- `commands.codegen` is empty, so no codegen step ran.

## Tree state

- `git status --porcelain` after the run is empty. Clean, no CI failure from codegen or test artifacts.

## Failures

None.
