# Suite report: batch SGS-166-SGS-166 (attempt 1)

## Verdict: PASS

- Command run: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), run through `run.sh`. Full command, not a subset.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`. No failures.
- Log: `$TMPDIR/suite-SGS-166-unit.log` (outside any checkout).
- Branch: `sgs-166-doc-scroll-rule`, tip SHA `13a65f3a197de3831b70997945c327bfcae0841c`.
- Scratch checkout `suite-SGS-166-SGS-166` at the tip SHA, removed after the run (`checkout.sh remove` exit 0).

## Batch scope

One commit, `13a65f3` on top of `origin/main` (`0d708bc`). Docs only: 7 lines added to `ARCHITECTURE.md` describing the instant-scroll rule for acceptance hover and focus sequences. No code or test files changed, so no unit test can be affected by the diff; the suite was run as the gate regardless.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1`, checked through `run.sh` (so `commands.shellSetup` loaded). Declared: `package.json` `engines.node` = `24.x`. Match, no mismatch.
- No `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions` or `go.mod` at the repo root.
- `node_modules`: linked from the cached install with `bin/link-node-modules.sh` (the first half of `commands.acceptanceSetup`). `npm run acceptance:setup` (Chromium install) was not run, because the unit suite does not use Playwright.
- `commands.codegen` is empty; not run.
- `commands.build` and `commands.lint` were not run; `commands.unit` is set, so they are not required by the rule for an empty unit command.

## Tree after the run

`git status --porcelain` on the scratch checkout is empty. Clean, no codegen dirt.

## Failures

None.

## Notes

- The 15 skipped tests in 1 skipped file are part of the suite as configured (the `test:blob-live` file is skipped without `BLOB_LIVE=1`). Not a failure.
- No processes were started by this run beyond the Vitest run itself, which has exited.
