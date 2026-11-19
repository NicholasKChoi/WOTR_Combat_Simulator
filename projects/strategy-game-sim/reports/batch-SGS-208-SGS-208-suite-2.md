# CI-parity suite: batch SGS-208-SGS-208

Verdict: **PASS**

- Tip: `sgs-208-repeat-build-or-move-step` at `7df2c519623c2aae052bd255566ed2f6bf4c6ea7`
  (top of stack, rebased on origin/main `ddc68f3`).
- Scratch checkout: `suite-SGS-208-SGS-208`, created at the tip SHA and checked out clean.

## Command run

`npm test` (commands.unit, `vitest run`), run through `run.sh`.

Summary line:

```
Test Files  93 passed | 1 skipped (94)
Tests  2984 passed | 15 skipped (2999)
```

Exit code 0. Log: `/tmp/claude-1000/suite-SGS-208-SGS-208/suite-SGS-208-SGS-208.unit.log`
(under `$TMPDIR`, outside the checkout).

Not run, by design: `commands.codegen` is empty; `commands.acceptanceSetup` and
`commands.acceptance` were not needed for the unit verdict (Vitest only). `lint` and `build` were not
run because `commands.unit` is set.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x`, and `commands.shellSetup`
  (nvm, `use 24`) matches it. No mismatch.
- `node_modules` came from `bin/link-node-modules.sh .` (hardlinked, cached per lockfile hash) through
  `run.sh`, as in `commands.build`.

## Working tree

`git status --porcelain` after the unit run is empty. The tree is clean and HEAD is unchanged.

## Failures

None.

## Cleanup

Scratch removal is run after this report is written. Any failure to remove it is deferred cleanup.
