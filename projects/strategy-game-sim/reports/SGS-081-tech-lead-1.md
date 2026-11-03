# SGS-081 tech-lead 1

**Decision: no blockers, no untested hotspots. #89 updated (still a draft).**

## Reviewed
- Range c8cca5f..0af3967 (sgs-081 on top of the sgs-080 tip c8cca5f; c8cca5f is an ancestor of 0af3967, so the stack is linear). 22 files, +891/-91.
- Reviewable change: +617/-22 (three build JSONs +542/-7, README +47/-14, production-floors.ts +25, docs +3/-1). The rest is unit and acceptance tests.
- Ran `npx vitest run lib/aoe4-build-order/builds.test.ts`: 43 passed, 10 skipped. No skip was added in the diff.
- Checked that the 1TC guide steps 0 to 23 hash the same at 2fc9593, c8cca5f and 0af3967 (sha256 4c3a50b2...), so the frozen guide set is untouched.
- The 16 added 1TC steps all have `time` 420, and the gold reaction is still the first and only reaction (index 40).
- The production-floors.ts values match the ticket's authoritative table exactly.

## Blocker checks
- Invariants: A1 holds (only `time` trigger inputs in the build files; the floors are test constants). A2 holds (no engine change, and the no-waiting bar is pinned for each build). A3 holds (data only).
- Irreversibility, concurrency, security, contracts: nothing applies. No engine, route, OpenAPI, schema or UI change, and no criticalPaths symbol is touched.
- Open questions: CONTEXT has none. The floors, the cap and the added buildings are owner-confirmed in the ticket.
- Test pins: every edit is a re-derivation or an index move, and none weakens an assertion. One possible exception is noted below.

## Actions
- Force-pushed sgs-081-aoe4-retune-prebuilt-farms with lease 2fc9593 -> 0af3967. No new commits.
- Changed #89's title and body through `gh api PATCH`. #89 is still a draft with base sgs-080-aoe4-one-villager-per-farm.
- #88: left alone. Its footer already lists #88 -> #89.

## PRs (bottom to top)
1. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/88, base main (unchanged; high, per the earlier pass)
2. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/89, base sgs-080-aoe4-one-villager-per-farm

### #89 Merge risk
**low** - only build data, docs, test constants and test pins change; a revert fully undoes it, no API, schema, CLI, config or critical-path symbol changes, and each build's bars and floors are pinned per build by tests.

### #89 Review focus
No hotspots: this is a data-only rebuild with no engine logic. Every changed behavior is asserted for every build: floors and cap in [`builds.test.ts`: meets its production floors and keeps its floating resources under the cap at 1200 s](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/89/files#diff-db3c6cbe9f4b4ad39e30688ca0b435e824cc8ff86fc1535d45b3a5cd4f3cd573R77-R89), `farm-idle` in [`builds.test.ts`: leaves no villager waiting for a farm by %i s](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/89/files#diff-db3c6cbe9f4b4ad39e30688ca0b435e824cc8ff86fc1535d45b3a5cd4f3cd573R91-R93), and the hard-coded `man-at-arms` trigger against Castle in [`builds.test.ts`: reaches Castle, with the opening army before the Castle landmark and the transition after it](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/89/files#diff-db3c6cbe9f4b4ad39e30688ca0b435e824cc8ff86fc1535d45b3a5cd4f3cd573R151).

The #89 body states that #88 and #89 must merge together as one stack.

## Non-blocking notes
- acceptance/aoe4-simulate-api-spend-population.spec.ts:70 and :145: two tests that use the shipped 1TC build as a fixture now run at `durationSeconds: 1000` instead of the default. This keeps "populationCapReachedAt is null while the cap is never reached" true, which suggests the rebuilt 1TC now reaches 200 population before the default horizon. What each test checks is unchanged, so this is not a loosened build-quality bar, but the change is worth knowing about.
- acceptance/aoe4-build-order.spec.ts:385-425: the marker-label geometry helper now reads the geometry in one snapshot inside `expect().toPass()`. This is a test-stability fix outside the ticket's scope; it does not weaken any assertion.
- The branch history contains the commit subjects "SGS-081 rework 4: ..." and "WIP: ..." (pushed before this pass). This repo squash-merges, so they do not reach main, but the squash title should be clean.
