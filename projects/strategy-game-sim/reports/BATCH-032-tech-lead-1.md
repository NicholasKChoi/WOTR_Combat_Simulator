# BATCH-032 tech-lead 1

## Decision
NO BLOCKERS. One draft PR opened.

## PRs (bottom to top)
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/38 - base `main` - head `sgs-032-aoe4-research-veterancy` @ 7e41e68 (pushed by this gate, no new commits). Single-PR batch: no stack link, no footer.

### Merge risk
**low** - a revert fully undoes it; no route, page, schema or config reads `SimulationResult` yet, and unit and acceptance tests pin the target choice, the queue delay, the tier at payment, the reserve, and the notes.

### Review focus
No hotspots: the risky paths are pinned by tests that fail on the obvious mutations. These are the queue resume after research, tier read at payment rather than spawn, the reserve only when short of resources, and `researched.add` on completion. The engine loop itself is unchanged apart from three lookup call sites.

(Ticket risk tier is `high`; the merge-risk rating comes from the diff factors. No public surface consumer exists until the route/page ticket lands.)

## Reviewed
- Range: origin/main a714a23 ... origin/sgs-032-aoe4-research-veterancy 7e41e68 (2 commits; merge-base = origin/main).
- Files: lib/aoe4-build-order/research.ts (new, +99), simulate.ts (+7/-12), simulate.test.ts and simulate.acceptance.test.ts (seam test, `withHandler` save/restore), research.test.ts, research.acceptance.test.ts, docs/aoe4-build-order.md (+17/-4).
- Reviewable LoC: +106/-12 (tests and docs excluded). Total +901/-21.
- Checked against INVARIANTS A1-A3 and S3, CONTEXT open questions (none), the ticket scope, and the review, acceptance, simplify and suite reports.
  - A1: no game numbers in code.
  - A2: the cost check happens before paying, the reserve only when short of resources, clamp at 0.
  - A3: notes are a pure function of the order and data, no randomness.
  - S3: no new loops over unbounded input.
- No runtime import cycle: research.ts imports simulate types only.
- Every `stepHandlers.research` override restores the saved handler in `finally`.

## Non-blocking notes
1. The commit subject "Add SGS-032 research and veterancy acceptance tests" (7e41e68) has a ticket id. This breaks shipped-artifact hygiene. Squash-merge with the PR title, which is clean, and drop the commit list from the squash body.
2. research.ts:10 `RESOURCE_TOLERANCE = Math.sqrt(Number.EPSILON)` (about 1.5e-8) differs from simulate.ts:14 `1e-9`, and research.ts duplicates `RESOURCES`/cost/affordable/spend. This is harmless today because of the clamp at 0. Follow-up: move the shared resource helpers and one tolerance into a common module.
3. research.ts:65-67 takes the max age over all entries of an upgrade, while the handler checks only `entries[0]` age (research.ts:35-37). This is latent and only matters if a snapshot ever gives an upgrade several ages. The review raised it too.
4. Out of scope (from the review): `shaft-mining` is `supported` with the shipped english rules, so it is a wrong `effects-unmodeled` example in docs/aoe4-build-order.md (Technologies) and design/M2.md. Use `admiralty` instead.
5. Manager action: whichever of SGS-031 and SGS-032 merges second routes the auto-house demand lookup through `resolveUnitEntry` and drops the build/move part of the seam test (simulate.test.ts:522-531).
