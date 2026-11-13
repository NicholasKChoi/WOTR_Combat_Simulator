# Discovery: standalone, run 1

Window: first run, whole repo as it stands. origin/main = e50e0749ac1b59657daf9d5283a5e67935d90e25; local main = cdc51b1939eeb19e95a2cd39ca8a1b217a8ec7ed.

## Checked

- Backlog, TASK-GRAPH and QUESTIONS read first; only items not already covered were considered.
- CI on main: `gh run list -b main --limit 30` returned one run, "AoE4 data freshness" 43369981194 (success). No failures, no flakes.
- Issues: `gh issue list --state open` returned none.
- Dependabot alerts: HTTP 403, alerts disabled for the repo (skipped per instructions).
- Outdated direct dependencies (`npm outdated --json`): only `@types/node` (24.19.2 vs 26.6.6) and `jscpd` (4.3.0 vs 5.4.3) are a major behind. @types/node should stay on 24 to match Node 24 in .nvmrc/engines, so not an item. jscpd is a dev-only duplication checker; a major bump has no evidence of benefit. Dropped. Minor bumps (next 16.4.3 to 16.4.6, vitest, playwright, bootstrap) are not in scope.
- New debt: grep for TODO/FIXME/HACK/XXX in app, lib, scripts, acceptance, components found none.
- Lint drift: not run; first run has no baseline to compare against.
- Plain-bug reading: the known candidates (acceptance/aoe4-results-split.spec.ts:41 red on main, step-band flake, `reread` missing `myBuildsAvailable` check, smoke-preview swallowed errors) are already in BACKLOG.md, so not refiled.

## Items

None. Every finding is already covered by the backlog or below the bar.

Note for the manager: the BACKLOG entry about `acceptance/aoe4-results-split.spec.ts:41` failing on main is the strongest existing candidate for a `standalone bug` or `debug`; it has no ticket in the graph.

## Watermarks

ci=43369981194
issue=0
alerts=0
sha=e50e0749ac1b59657daf9d5283a5e67935d90e25
