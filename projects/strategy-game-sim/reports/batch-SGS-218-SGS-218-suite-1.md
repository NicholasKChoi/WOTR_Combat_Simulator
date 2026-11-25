# Suite report: batch SGS-218-SGS-218

Verdict: PASS

- Branch: sgs-218-fight-api-spec-pinned-schemas
- Tip SHA tested: 2f202a337a9907e318e9bf7cfaddb9aa82bf60b2
- Scratch checkout: suite-SGS-218-SGS-218 (created at the tip SHA, removed after this report)

## Commands

- `commands.unit` ("npm test", Vitest `vitest run`), run in full through run.sh.
  Log: /tmp/claude-1000/suite-SGS-218-SGS-218.unit.log
  Summary: Test Files 95 passed | 1 skipped (96); Tests 3116 passed | 15 skipped (3131); exit 0.
- `commands.acceptanceSetup`: not run. The unit suite does not need Chromium. Its install prefix
  (link-node-modules.sh) was run alone through run.sh to provision node_modules, which linked from the
  nm-cache for lockfile hash a3f26664079500e1.
- `commands.codegen`: empty in REPO.md, not run.
- `commands.build` and `commands.lint`: not run. `commands.unit` is set.

## Tree state

`git status --porcelain` after the run: empty (clean). No codegen output, no dirty files.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x` (package.json), and REPO.md
  `shellSetup` is `nvm use 24`. Match, no mismatch.

## Failures

None.
