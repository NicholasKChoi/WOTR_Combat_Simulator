# CI-parity suite: batch SGS-197-SGS-197

Verdict: PASS

- Branch: sgs-197-chart-zoom-pan
- Tip SHA: 5156184c78d41d43722b4e625e0baf728d552ad0 (scratch checkout, verified with rev-parse)
- Scratch checkout: suite-SGS-197-SGS-197 (removed after this report)

## Command run

`npm test` (REPO.md `commands.unit`), run through run.sh with the profile's `shellSetup`, output teed to `$TMPDIR/suite-SGS-197-SGS-197/suite-SGS-197-SGS-197.unit.log` (`/tmp/claude-1000/suite-SGS-197-SGS-197/`, outside the checkout).

Summary line from the full run:

```
Test Files  88 passed | 1 skipped (89)
Tests       2745 passed | 15 skipped (2760)
```

No failures. The full command was the verdict; no partial package runs.

## Setup

- `commands.acceptanceSetup` was not run in full. The unit suite is Vitest and needs no Chromium. Its first step, `bin/link-node-modules.sh`, was run alone to provide node_modules (linked from the nm-cache `d57d0fdd0e531d4b`).
- `commands.codegen` is empty; skipped.
- `commands.build` and `commands.lint` were not run; they are not part of this suite gate's scope (unit is set).

## Tree check

`git status --porcelain` on the scratch checkout after the run: empty. Clean.

## Environment

- Runtime: Node v24.22.2 (through run.sh, after shellSetup). Declared: `engines.node` `24.x` in package.json, and `nvm use 24` in REPO.md shellSetup. Match; no mismatch.
- No failures classified; no environmental issues observed.

## Failures

None.
