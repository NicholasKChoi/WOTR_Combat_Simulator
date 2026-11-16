# Suite report: batch SGS-187-SGS-187, run 1

**Verdict: PASS**

- Branch: `sgs-187-remove-unused-settled-scroll-y` (base `main`)
- Tip SHA: `f7ff09f4c088105819c70c532d447ed985e3295c`
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-187-SGS-187` (HEAD matches the tip)

## Commands

- `commands.acceptanceSetup` (`link-node-modules.sh . && npm run acceptance:setup`), run through run.sh. The link step reused the cached node_modules (`nm-cache/d57d0fdd0e531d4b`). The Chromium install printed no further output and the call returned without error.
- `commands.codegen`: empty, not run.
- `commands.unit` (`npm test`, Vitest), run through run.sh with output teed to `/tmp/claude-1000/suite-SGS-187-SGS-187/suite-SGS-187-SGS-187.unit.log`. Exit 0.
  - Summary: `Test Files 83 passed | 1 skipped (84)`, `Tests 2613 passed | 15 skipped (2628)`.

## Tree state

`git status --porcelain` after the unit run is empty. The tree is clean.

## Failures

None.

## Environment

- Node: installed `v24.22.2`, declared `engines.node` `24.x` in `package.json`. Matches; no mismatch.
- No `.nvmrc`, `.node-version`, or `.tool-versions` file is present.
- Vitest reports `v5.0.5`.

## Cleanup

Scratch removal is run after this report is written; see the handback for the result.
