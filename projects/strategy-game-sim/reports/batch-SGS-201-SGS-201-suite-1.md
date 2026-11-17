# Suite report: batch SGS-201-SGS-201

Verdict: **PASS**

- Top-of-stack branch: `sgs-201-series-legend-aria-pressed`
- Tip SHA: `79d17e17e0a730a239e6e465aa5a793379d5aa24`
- Base: `main`
- Scratch checkout: `suite-SGS-201-SGS-201`, removed after the run (`checkout.sh remove` exit 0).

## Commands run

1. `checkout.sh scratch` at the tip SHA, exit 0.
2. Environment check through `run.sh`: Node `v24.22.2`, npm `11.19.1`.
3. `link-node-modules.sh .` to give the scratch checkout a `node_modules` (cached tree, no Chromium install). `commands.acceptanceSetup` was not run in full: the unit suite (Vitest) does not need Chromium.
4. `commands.codegen`: empty, not run.
5. `commands.unit` (`npm test`, run as `vitest run`), full suite, through `run.sh`, output teed to `/tmp/claude-1000/suite-SGS-201-SGS-201/suite-SGS-201-SGS-201.unit.log`. Exit 0.
6. `git status --porcelain` in the scratch checkout after the run: empty (clean tree).

## Unit summary

```
Test Files  91 passed | 1 skipped (92)
     Tests  2858 passed | 15 skipped (2873)
```

The skipped file and 15 skipped tests are pre-existing skips in the suite, not failures.

## Failures

None.

## Environment

- Runtime matches the declared version: `package.json` `engines.node` is `24.x`; installed is `v24.22.2`. No mismatch.
- Scratch `node_modules` came from the cached lockfile install via `bin/link-node-modules.sh`.
