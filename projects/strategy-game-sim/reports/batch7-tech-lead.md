# Batch 7 tech-lead gate

## Decision
No blockers. Opened three independent draft PRs against main (not a stack; no gh stack link, no footer).

| task | branch @ tip | PR | base | merge risk |
|---|---|---|---|---|
| SGS-013 | sgs-013-aoe4-design-doc @ 555bb41 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/27 | main | low |
| SGS-014 | sgs-014-aoe4-data-model-loader @ 81dc459 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/28 | main | low |
| SGS-015 | sgs-015-aoe4-series-chart @ 7524915 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/29 | main | medium |

Branches pushed as-is (no new commits); all commits authored choinickolas@gmail.com. Bodies set via gh api PATCH. PR 27 Vercel preview already green at report time.

## Merge risk and review focus (verbatim from bodies)

### PR 27 (SGS-013)
## Merge risk
**low** - documentation only; a revert fully undoes it and no code, schema, API or config reads it.

## Review focus
No hotspots: a single new Markdown file that nothing in the build or runtime reads.

### PR 28 (SGS-014)
## Merge risk
**low** - new files only, with no importer outside their own tests; a revert fully undoes it, and the loader and classifier behavior is pinned by unit and acceptance tests.

## Review focus
- [`data/aoe4-build-order/rules/english.json:2-68`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/28/files#diff-8338dd1f8048668af7f81e1a1dc3db4e951cefcb324a9a9910567896f7b7e87eR2-R68) - a wrong hand-entered starting resource, villager split or supply value will shift every timing the simulator reports, and no test can compare these numbers with the live game - check each value against its cited source.

### PR 29 (SGS-015)
## Merge risk
**medium** - it changes repo config (a new runtime dependency in `package.json` and the lockfile, and the Vitest include list); it stays backward-compatible and a revert undoes it.

## Review focus
No hotspots: the component is not rendered by any page yet, the lockfile change only adds packages from the npm registry (plus dev-to-devOptional flag changes for shared types), and the helpers are pure and unit-tested.

## What I reviewed
- Base origin/main 20f59e4; every branch's merge-base is 20f59e4 and its diff holds only its own task.
- SGS-013: 3 commits, docs/aoe4-build-order.md +441. Checked against CONTEXT decisions (model scope, determinism and additive results, trigger semantics, builder scaling, auto-houses, gather trip model, patch policy, v1 coverage, CivRules seams); no open question exists and none was answered unilaterally. Bounds table covers S3.
- SGS-014: 3 commits, 11 files +14,376 (982 reviewable: data.ts, effects.ts, model.ts, refresh-snapshot.mjs, rules/*.json; snapshot generated). A1 holds: snapshot records commit and patch 17.0.12182 with patch-notes URL; every hand-entered leaf has source and unverified label. Loader deep-freezes shared data (protects A3 across requests); Map-only lookups. No importer outside tests; no network in tests.
- SGS-015: 2 commits, 7 files +558/-5 (+81/-2 reviewable). Lockfile: only registry additions plus dev -> devOptional flags; root package name unchanged. recharts pinned 3.10.1. Not rendered by any page. S1 holds.
- Gate evidence read: batch7-suite.md (PASS all three).

## Invariants
No violation. S1, S3, A1, A3 checked against the diffs; A2 not yet reachable (no simulator code).

## Non-blocking notes
- SGS-013 doc references files that do not exist yet (simulate.ts, civ-rules.ts, api.ts, gather.ts); expected for a design doc ahead of the engine, but merge it before the engine PRs so reviewers have the reference.
- SGS-014 data.ts: buildGameData freezes the snapshot/rules objects passed in, in place (documented in its comment); a later caller building test fixtures must pass copies.
- SGS-014 README known gap: crosscut-saw-4's +5 wood carry is not simulated; the engine will under-count wood after that tech.
- SGS-015 adds recharts with transitive @reduxjs/toolkit, immer, d3-* to the runtime deps; bundle cost only lands when a page imports the chart.
- Suite ran on Node 22.17 while engines wants 24.x (from suite report); Vercel builds on 24.
