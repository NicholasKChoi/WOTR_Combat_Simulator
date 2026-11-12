# Tech-lead: batch-SGS-127-SGS-129, round 1

## Decision: PASS - 3 stacked draft PRs opened

No blockers, no untested hotspots. Stack is linear: each branch's diff against its base contains only its own task.

## Opened PRs (bottom to top)

### SGS-127 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138 (base `main`, head `sgs-127-blob-strong-etag` 8691f1e)

## Merge risk
**high** - changes the compare-and-swap etag that decides whether a concurrent writer's version is kept, and if the CDN still weakens identity reads, `GET`/`PUT` of named builds and every save's rate-limit check answer 503 instead of today's behavior.

## Review focus
- [`lib/aoe4-build-order/blob-build-store.ts:27-43`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR27-R43) - `read` serves `getNamed` (used by the public named-build `GET` as well as `PUT`) and `bumpCounter` (every save, saved or named). If the live CDN ignores `accept-encoding: identity` and still returns `W/`, opening a shared named build and every save go from working to 503 - check the `fresh` branch is the only place the header and the throw apply, and that the etag is read from the same response as the body - pinned by [`blob-build-store.test.ts`: %s with a compressed response / rejects a weak etag before any put](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R126-R145) and [`blob-build-store.test.ts`: returns the stored value for a weak etag and sends no headers option](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R91-R95)
- [`lib/aoe4-build-order/named-builds-routes.ts:111-122`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138/files#diff-4b233f2d937fbdbc05de40e7d4bed2e0a788ae70fa10b843bd05b768080a763bR111-R122) - the two 412 log lines are the only way to tell a stale client from a store etag conflict in production; a secret in either line would leak edit rights into logs - check both log only the id and revisions - pinned by [`named-builds-routes.test.ts`: answers 412 for a stale revision and for a store conflict, logging each with its own line, the id and no secret](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/138/files#diff-f0d35fa8961ba0b2ac24b8927c1c3d7dcc32afe74fd899d224adca9f17289ee4R417-R435)

Preview checks in the body: version save to revision 2 then 3 on the live-Blob preview, the named-build link loads (200), and the stop condition (503 with `returned a weak etag` in the log means do not merge). The body also carries the On merge step: delete `debug/named-build-412-diagnostics` (local and origin).

### SGS-128 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/139 (base `sgs-127-blob-strong-etag`, head `sgs-128-shared-test-helpers-and-jscpd-gates` 9bbe59d)

## Merge risk
**low** - test code, lint config and docs only; a revert fully undoes it and no shipped code path changes.

## Review focus
No hotspots: no production code changes; every moved assertion keeps its comparison and bound, and the suite (unit) still runs every prior test.

### SGS-129 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/140 (base `sgs-128-shared-test-helpers-and-jscpd-gates`, head `sgs-129-strict-typescript` 75fa929)

## Merge risk
**medium** - changes `tsconfig.json`, which `next build` type-checks against, so a strict error would fail the deploy; backward-compatible and a revert undoes it.

## Review focus
No hotspots: config flag plus type annotations in two test files; `tsc --noEmit` is clean and the Vercel build on this PR confirms `next build`.

## What I reviewed

- Combined range `cdc51b1..75fa929` (origin/main to SGS-129 tip), 7 commits, all authored as choinickolas@gmail.com.
- SGS-127 (`cdc51b1...8691f1e`): 6 files +166/-7; hand-written logic +20/-4 (`blob-build-store.ts`, `named-builds-routes.ts`), read in full with surrounding `read`/`bumpCounter`/`getNamed`/`replaceNamed`/`readStored`/`readNamedBuild`/`updateNamedBuild`.
- SGS-128 (`8691f1e...9bbe59d`): 45 files +432/-490; read all non-test files (+195/-7: jscpd configs, `package.json`, helpers, `production-floors.ts`, `route-test-support.ts`, `openapi-schemas.ts`) and the floor-check call sites in `builds.test.ts` and the prebuilt-farms spec.
- SGS-129 (`9bbe59d...75fa929`): 4 files +9/-7, read in full.
- Pins checked: weak-etag rejection (describe.each over `getNamed`/`bumpCounter`, asserts message names key, not body, and no `put`), `FRESH_GET_OPTIONS` expectations, `getBuild` weak-etag passthrough with unchanged options, strong etag reaching `ifMatch` for both CAS paths, route 503-on-weak and distinct 412 log lines without secret.
- Branches were not on origin at start (local only); pushed bottom-up, no new commits. PR bodies set via `gh api PATCH` (REPO.md: `gh pr edit` fails here).

## Non-blocking notes

- Manager must act: SGS-127's Preview checks are owner-only (live Blob, needs `BUILDS_STORE_ID`). The ticket's stop condition says do not merge until they pass. `autoMerge.maxMergeRisk: high` would otherwise let #138 (and the stack above it) auto-merge on a green Vercel check before the owner runs them. Hold #138 for the owner's preview confirmation.
- Blast radius worth knowing (admitted in the commit message, not spelled out): `getNamed` is also the read behind the public named-build `GET` (`readNamedBuild`), whose etag is unused. If identity reads still come back weak, viewing a shared named build regresses from 200 to 503, and `bumpCounter` failing would 503 every save. The preview checks cover both; a follow-up could let the `GET` path read non-throwing, but that is a spec choice, not a defect.
- `builds: named build revision mismatch` is logged at `console.error` for a normal stale-client 412; this is log noise, not a defect.
- SGS-127 On merge: also drop the BACKLOG.md bullet beginning `AoE4 "Save a new version" fails in production` (factory-internal, kept out of the PR body).
- `next build` on the SGS-129 tip was not run by review or me; the Vercel preview on #140 is its check.
