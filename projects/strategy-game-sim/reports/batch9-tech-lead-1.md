# Batch 9 tech-lead gate 1

Decision: PASS - no blockers, no untested hotspots. Two stacked draft PRs opened.

## PRs (bottom to top)

1. SGS-100 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/111 - base `main` - head `sgs-100-auto-run-controller` @ 6c4f90b561ba95c1843e0349bd1a22e39965596c - Merge risk **low**
2. SGS-102 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/112 - base `sgs-100-auto-run-controller` - head `sgs-102-use-auto-run` @ a9ef8637422ba4209dd75b5dd8e777848d959f80 - Merge risk **high**

Both pushed fresh (no remote branches existed; no force). Stacking: footer (`<!-- cf-stack -->`). Bodies set with `gh api -X PATCH`, both end with the required attribution lines.

### #111 Merge risk
**low** - nothing calls the controller yet; the only live change is the page's simulate call and error text moving into a shared client with identical output, a revert undoes it, and unit plus browser tests pin it.

### #111 Review focus
- `components/apps/aoe4-build-order/auto-run.ts:155-168` - once wired, a staleness check missing after the body read would let an older response overwrite the newer result - check `isLatest()` after `post` settles and again after `readOutcome` - pinned by `auto-run.test.ts`: drops %s read after / drops a superseded response and applies the latest (lines 434-510).
- `components/apps/aoe4-build-order/auto-run.ts:180-203` - a reordered rule would post an invalid request, re-post an unchanged build, or abort a wanted request - pinned by `auto-run.test.ts`: fire > rule order (lines 404-431).

### #112 Merge risk
**high** - new concurrency: overlapping in-flight simulate requests, aborted and dropped by the controller, now decide which result the page shows.

### #112 Review focus
- `components/apps/aoe4-build-order/use-auto-run.ts:40-62` - release before input, or a re-run mount effect, would post a stale first input or post twice - pinned by `acceptance/aoe4-auto-run.spec.ts`: first load runs once (asserts exactly one POST, its body, status current, no hydration error).
- `pages/apps/aoe4-build-order.tsx:129-135` - flushing with state instead of the passed values would run the previous build and pin it under the new name - pinned by `acceptance/aoe4-auto-run.spec.ts`: Enter and build select skip the pause (asserts the POSTed buildOrder equals the chosen build and the pin label names it).

## What I reviewed

- Base check: merge-base of origin/main and sgs-100 is fc19b52 (= origin/main); merge-base of sgs-100 and sgs-102 is 6c4f90b (= sgs-100 tip). Stack is linear; each branch's diff contains only its own task's commits (21b48c5, 49d6daa, 6c4f90b; 5d6bb70, 829ce21, a9ef863). All commits authored as choinickolas@gmail.com.
- SGS-100: origin/main...6c4f90b, 6 files +1096/-22; reviewable +284/-22 (`auto-run.ts`, `simulate-client.ts`, page). Read the controller and client in full.
- SGS-102: 6c4f90b...a9ef863, 29 files +1021/-585; reviewable +159/-135 (hook, status text, build-input, issue-list, results, CSS, page). Read the hook and every non-test component/page hunk; acceptance helpers diff; test titles and assertions of the pinning tests.
- Invariants: S3 holds (requests only for converted text and an integer duration inside `SIM_INPUT_BOUNDS`; route still validates). A3 holds (no randomness, no wall-clock; timer only debounces; shown result is the captured settled input). S1 holds (imports stay in the AoE4 app). A1/A2, W*, H* not touched. No criticalPaths symbol touched. No schema, API, migration, secrets or permissions change. No open question answered (both tickets: none; CONTEXT open questions unaffected).
- Gate reports: review-2 APPROVE on both; acceptance-test 1 PASS on both; batch9-suite-1 PASS (1802 unit). Simplify: no changes.

## Non-blocking notes

- The full acceptance suite was not re-run by a gate on SGS-102's rebased tip a9ef863; review-2 relied on the implementer's report (794 passed). The Vercel preview build is the remaining automated check.
- `git push -u` pushed both branches but could not write upstream tracking config (`.git/config` lock held by another process: "could not lock config file ... File exists"). Remote branches are correct; local branches just have no upstream set.
- Each settled edit now sends a simulate POST (at most one per 500 ms pause, plus aborts of superseded ones). The route's input caps (S3) still bound each request's cost; there is no per-client rate limit, same as before.
