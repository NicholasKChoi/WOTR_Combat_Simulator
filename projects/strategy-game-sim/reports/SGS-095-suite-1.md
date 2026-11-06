# SGS-095 suite run 1 (batch: SGS-098 bottom, SGS-095 top)

Verdict: **PASS**

- Branch: `sgs-095-test-hygiene`
- Tip SHA: `a857539f3e662a267ebbfbcb56edca5d9c50e02f` (includes SGS-098 tip `4ac6a6a`)
- Base: `origin/main` `93283559`
- Worktree: detached at the tip, `worktrees/suite-SGS-095` (removed after this report)

## Commands run (REPO.md)

| Step | Command | Result |
|------|---------|--------|
| acceptanceSetup | `npm ci && npm run acceptance:setup` | exit 0; 233 packages added, Chromium installed |
| codegen | (empty in REPO.md) | skipped |
| unit (verdict) | `npm test` (vitest run) | exit 0. `Test Files 48 passed (48)`, `Tests 1511 passed \| 10 skipped (1521)` |
| acceptance | `npm run acceptance` (Playwright) | exit 0. `734 passed (1.3m)`, 0 failed |

The acceptance run was done in addition to the unit verdict because the batch names an acceptance flake.

Logs (scratchpad):
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d69ea2da-7796-491c-bb02-bb73ad748533/scratchpad/setup.log`
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d69ea2da-7796-491c-bb02-bb73ad748533/scratchpad/unit.log`
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d69ea2da-7796-491c-bb02-bb73ad748533/scratchpad/acceptance.log`

## Failures

None. No failures in unit or acceptance, so nothing to classify.

## Known flake: acceptance/aoe4-small-screen.spec.ts:42

Did not fail in this run. The spec ran (8 log lines mention it) and the Playwright summary reports 0 failed. Not seen as a flake this time.

## Notes

- Unit has 10 skipped tests (1521 total). Skips are reported by vitest; I did not inspect which ones or why. Not a failure.
- Working tree after the run: `git status --porcelain` is empty. No codegen was run, so no codegen dirt. Build artifacts from `npm ci`/Playwright are ignored by git.
- `commands.build` and `commands.lint` were not run. The unit command is non-empty, so the fallback in step 4 did not apply. `commands.lint` (tsc + jscpd) was not part of the requested verdict.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1` (via `run.sh`, which loads `commands.shellSetup`).
- Declared: `engines.node` = `24.x` in `package.json`; REPO.md acceptance harness says Node 24.x.
- Match: yes. No mismatch to report.
- Install command used: `npm ci` (from `commands.acceptanceSetup`).
