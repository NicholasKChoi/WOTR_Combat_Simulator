# Suite gate: batch SGS-203-SGS-203

**Verdict: PASS**

- Branch: `sgs-203-marker-control-stays-in-view`
- Top-of-stack SHA: `85508a7fb229b315ab9cc6e9a45b2a7f4a73b424`
- Base: `main`
- Scratch checkout: `suite-SGS-203-SGS-203` (checked out at the SHA above; `git rev-parse HEAD` matches)

## Command run

`commands.unit` exactly: `npm test` (runs `vitest run`), executed through `run.sh` in the scratch checkout.

Log: `/tmp/claude-1000/suite-SGS-203-SGS-203/suite-SGS-203-SGS-203.unit.log`

Summary line:

```
Test Files  91 passed | 1 skipped (92)
     Tests  2864 passed | 15 skipped (2879)
```

No failures. `commands.codegen` is empty, so no codegen step ran. `commands.acceptanceSetup` was not run because the unit suite does not need it. `commands.acceptance` is not part of the unit gate and was not run.

## Tree state

`git status --porcelain` after the run: empty (clean). Nothing was committed or modified.

## Environment

- Declared runtime: Node `24.x` (`engines.node` in `package.json`; `commands.shellSetup` is `nvm use 24`). No `.nvmrc`, `.node-version`, or `.tool-versions` at the repo root.
- Installed runtime via `run.sh`: Node `v24.22.2`. Matches the declared range; no mismatch.

## Failures

None.

## Notes

- The suite reports 1 skipped test file and 15 skipped tests. These are reported by vitest as skipped and did not fail the run. I did not inspect them.
