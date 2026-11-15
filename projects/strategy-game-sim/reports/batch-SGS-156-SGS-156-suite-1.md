# Suite report: batch SGS-156-SGS-156 (suite-1)

## PASS

- Command: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), full command, not a subset.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2583 passed | 15 skipped (2598)`.
- Skipped: the one skipped file is `lib/aoe4-build-order/blob-build-store.live.test.ts`, gated by
  `describe.skipIf(process.env.BLOB_LIVE !== '1')`, so it is skipped by design. The 15 skipped tests are not
  itemized here.
- Branch SHA: `sgs-156-auto-houses-plan-ahead` at `c8685a7c0fb35fde870bb5f09378369d36a67624` (scratch checkout
  HEAD detached at that SHA, confirmed).
- `git status --porcelain` after the run: empty (clean tree, no codegen step, nothing dirty).
- Log: `$TMPDIR/suite-unit.log` (17 lines).

## Steps

- `commands.codegen` is empty, so it was not run.
- `commands.acceptanceSetup` was not run. The unit command is Vitest and does not need Chromium. Acceptance
  is out of the suite gate's scope here.
- `commands.build` and `commands.lint` were not run. `commands.unit` is set, so the spec for this gate does not
  call for them.

## FAIL

None.

## BLOCKER

None. The scratch checkout was created and removed cleanly (`checkout.sh remove` exit 0).

## Environment

- Runtime: Node `v24.22.2` (run.sh loads `source ~/.nvm/nvm.sh && nvm use 24`), npm `11.19.1`.
- Declared: `package.json` `engines.node` = `24.x`; no `.nvmrc`, `.node-version`, or `.tool-versions`.
- Match: yes. No mismatch.
- Node modules: linked via `bin/link-node-modules.sh` (cache `nm-cache/d57d0fdd0e531d4b`).
- Scratch checkout `suite-SGS-156-SGS-156` removed.
