# Suite gate: batch SGS-160-SGS-160 (suite-1)

## Verdict: PASS

- Command: `npm test` (`commands.unit`, runs `vitest run`), run through `run.sh` in the scratch checkout.
- Summary: `Test Files  83 passed | 1 skipped (84)`, `Tests  2552 passed | 15 skipped (2567)`, exit 0.
- Branch: `sgs-160-results-split-chart-id-filter`, top-of-stack SHA `ff83f4fe76b4ebea5079eefedfd648c72ce05ad5`
  (commit `ff83f4f Select results charts by id in the split spec instead of the chart- prefix`).
- Full log: `/tmp/claude-1000/sgs160-unit.log`.
- Tree after the run: `git status --porcelain` empty.

## Scope note

- `commands.unit` (`vitest.config.mts`) excludes `acceptance/**`. The ticket's target,
  `acceptance/aoe4-results-split.spec.ts`, is a Playwright spec and was not run by this gate. Its
  verification belongs to the acceptance-test role (`commands.acceptance`), which this suite gate
  does not run.
- `commands.codegen` is empty, so no codegen step ran.
- `commands.acceptanceSetup` was not run in full. Vitest needs only node_modules, so I ran the first
  half of that command (`bin/link-node-modules.sh .`, which linked node_modules from
  `nm-cache/d57d0fdd0e531d4b`). The Chromium install step (`npm run acceptance:setup`) was skipped
  because the unit suite does not need it.
- `commands.unit` is set, so `build` and `lint` did not run.

## Failures

None.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1`. Declared: `engines.node` `24.x` in `package.json`, and
  `commands.shellSetup` is `nvm use 24`. Match, no mismatch.

## Cleanup

- Scratch checkout `suite-SGS-160-SGS-160` removed after this report was written (see handback for the
  remove result).
