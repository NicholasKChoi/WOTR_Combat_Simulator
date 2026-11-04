# SGS-083 CI-parity suite run 1

**Verdict: PASS**

- Branch: sgs-083-aoe4-highlight-step-span-on-charts
- Tip SHA: 66e57c26ca42b386530b2c8bbfafb991086075ed (commit "Add acceptance spec for the step span band on the charts")
- Base: origin/main 6103ed737e175a5b0a9552870a4359fb75d8351d
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-083 (detached, removed after this run)

## Results

| Step | Command | Result |
|------|---------|--------|
| Install | `npm ci` | exit 0, 0 vulnerabilities |
| Unit (verdict, `commands.unit`) | `npm test` (vitest run) | exit 0. Test Files 46 passed (46). Tests 1369 passed, 10 skipped (1379). Log: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/fe37a078-0455-4b3a-a6fa-5c6b2dc1f4c4/scratchpad/suite-SGS-083-unit.log |
| Typecheck (ticket criterion) | `npx tsc --noEmit` | exit 0, no output. Log: .../scratchpad/suite-SGS-083-tsc.log |
| Duplication (ticket criterion) | `npm run lint:dup` (jscpd) | exit 0, Found 0 clones. Log: .../scratchpad/suite-SGS-083-jscpd.log |
| Acceptance (ticket criterion) | `npm run acceptance:setup`, then `npx playwright test acceptance/aoe4-build-order-step-band.spec.ts` | setup exit 0. 9 passed (20.1s). Log: .../scratchpad/suite-SGS-083-acceptance.log |

The full `npx playwright test` suite was not run. Only the new SGS-083 spec was run, as the ticket criterion names it.

- Codegen: `commands.codegen` is empty, so no codegen step ran.
- acceptanceSetup: not needed for `npm test`, since vitest excludes `acceptance/**`. It was run only for the Playwright spec.
- Tree after the run: `git status --porcelain` empty in the suite worktree, so no dirty-tree failure.

## Failures

None.

## Environment

- Node: installed v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x` in package.json. Match, no mismatch.
- Playwright ran against installed Chromium (installed via `npm run acceptance:setup`). No leftover next dev or Playwright processes remained after the run.

## Ticket

- Ticked the last criterion in tickets/SGS-083-aoe4-highlight-step-span-on-charts.md: `npx tsc --noEmit`, `npm run lint:dup`, `npm test` pass; the new acceptance spec passes via `npm run acceptance`. All four checks passed. The `npm run acceptance` run was limited to the new spec as noted above.
