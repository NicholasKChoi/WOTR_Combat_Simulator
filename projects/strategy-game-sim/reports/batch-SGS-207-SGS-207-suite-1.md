# Suite report: batch SGS-207-SGS-207

Verdict: PASS

- Branch: sgs-207-bump-next-16-4-6
- Tip SHA: a9689c3e0eca6fe19c94a5180341c53bba8e8ecf
- Base: main
- Scratch checkout: suite-SGS-207-SGS-207 (removed after this report)

## Commands run

1. `commands.acceptanceSetup` (`link-node-modules.sh . && npm run acceptance:setup`), exit 0. node_modules linked from the nm-cache, Chromium installed.
2. `commands.codegen`: empty in REPO.md, not run.
3. `commands.unit` (`npm test`, which runs `vitest run`), exit 0, run in full. Log: `/tmp/claude-1000/suite-SGS-207-SGS-207/suite-SGS-207-SGS-207.unit.log`

Unit summary line:

    Test Files  91 passed | 1 skipped (92)
    Tests  2902 passed | 15 skipped (2917)

3. `git status --porcelain` on the scratch checkout after the run: empty, the tree is clean.

`commands.build` and `commands.lint` were not run, because `commands.unit` is set.

## Failures

None.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1, run through `run.sh` so `commands.shellSetup` loaded. Declared `engines.node` is `24.x` in `package.json`. No `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions`, or `go.mod` applies. Match, no mismatch.
- No `.nvmrc` or other version file exists in the repo. `engines` was the only declaration checked.
- Setup note: the scratch checkout had no node_modules; `acceptanceSetup` linked them from the nm-cache.
- Cleanup: `checkout.sh remove` is run after this report is written; a failure there is deferred cleanup only.
