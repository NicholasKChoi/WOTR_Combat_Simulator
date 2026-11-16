# Suite report: batch SGS-173-SGS-173

**Verdict: PASS**

- Branch: sgs-173-architecture-store-rows
- Tip SHA: f94418cd6b86994edabbc628b18a9a8aa7326d79
- Base: main
- Scratch checkout: suite-SGS-173-SGS-173 (removed after this report)
- Files changed vs origin/main: ARCHITECTURE.md, docs/aoe4-build-order-format.md (docs only)

## Unit suite

Command: `npm test` (`commands.unit`, Vitest `vitest run`), run through run.sh with `commands.shellSetup` loaded.

Summary line:

```
Test Files  84 passed | 1 skipped (85)
Tests       2609 passed | 15 skipped (2624)
```

One test file is skipped and 15 tests are skipped. This is the suite's existing skip state; no failures.

Log: `/tmp/claude-1000/suite-SGS-173-SGS-173/suite-SGS-173-SGS-173.unit.log`

## Tree state

`git status --porcelain` after the run is empty. `node_modules` was linked from the factory cache by `link-node-modules.sh` and is gitignored, so it does not dirty the tree.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (through run.sh, after shellSetup).
- Declared: `engines.node` = `24.x` in package.json. Match, no mismatch.
- `commands.acceptanceSetup` was not run; the unit suite does not need Chromium.
- `commands.codegen` is empty; skipped.
- `commands.build` and `commands.lint` were not run; the unit command is set, so they were not required for this verdict.

## Failures

None.
