# SGS-084 tech-lead 1

## Decision
PASS - draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/98 (base `main`, head `sgs-084-aoe4-gather-rate-per-villager`, tip 94a0c7b, draft)

## Merge risk
**medium** - adds a required field to the public `/api/aoe4-build-order/simulate` response and records it inside `simulateBuildOrder` (a critical path); additive, and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:755-763`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/98/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R755-R763) - if `gathererCounts` counted a node that `incomePerSecond` leaves out (or the reverse), the per-villager line would be diluted or would spike at node run-outs and while builders are away - check it walks the same refs with the same `gatherers > 0` filter as `incomePerSecond` - pinned by [`lib/aoe4-build-order/simulate-series.test.ts`: gatherers is a non-negative integer per sample, 0 exactly where the rate is 0, on every prebuilt build](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/98/files#diff-025a9bdbecb157675c10f2869627300043b3f78c9625fd0a2369fe6064415cfbR270-R280) and the start-split, builder and run-out cases in the same `gatherers` block

## Rating note
The manager passed ticket risk `high`. Merge risk is rated from the diff: the change is additive (new required response field, minor OpenAPI bump 2.2.0 -> 2.3.0), the only consumer is the in-repo page, and the hunks inside `simulateBuildOrder` only record a new series; nothing changes what the event loop or payment checks decide. No migration, no external side effect, no concurrency, no security surface. So `medium`, not `high`.

## What I reviewed
- Range: origin/main fad1e41 ... sgs-084-aoe4-gather-rate-per-villager 94a0c7b (3 commits, all authored choinickolas@gmail.com).
- 14 files, +579/-16 total; reviewable business logic +56/-8 (simulate.ts, model.ts, result-series.ts, results.tsx, line-chart.tsx).
- Invariants checked: A1 (no game numbers in code; counts read from engine state), A2 (no payment change), A3 (deterministic; no new randomness or clock), S1 (no cross-app import). No violation.
- Contract: `SimulationResult` gains `gatherers`; existing fields unchanged. Stored pins hold only text/duration and are re-simulated on load (pages/apps/aoe4-build-order.tsx:118-133), so no old stored result lacks the field.
- CONTEXT.md open questions: none touched. Ticket has no milestone, so no milestone Safety section applies.
- Hotspots: the `gathererCounts` entry is pinned by assertions (`n === 0` iff rate is 0 across every prebuilt build; exact counts at the start split; builder leave/return; drop at node run-out). `perVillagerSeries` zero-divisor handling is pinned by result-series.test.ts `perVillagerSeries` table. The pinned-run per-villager rendering is pinned by acceptance/aoe4-gather-rates-per-villager.spec.ts. No untested hotspots.
- Stack check: single task, branch diff contains only its own commits.
- Branch was not on origin before this run; pushed with `git push -u`, no new commits. PR body set with `gh api -X PATCH` (gh pr edit is broken here per REPO.md). Footer stacking: `<!-- cf-stack -->` footer with a one-entry stack.

## Non-blocking notes
- `gathererCounts` duplicates the ref walk of `incomePerSecond` (simulate.ts:744-763); the two must stay in step. Tests pin the coupling, so it is a note only.
- line-chart.tsx header wrapper uses Bootstrap utilities only (no module CSS on the same element), so the checklist rule on mixing is not hit.
