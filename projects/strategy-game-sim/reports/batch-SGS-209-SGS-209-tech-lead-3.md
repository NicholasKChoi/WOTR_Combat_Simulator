# Tech-lead: batch SGS-209-SGS-209

## Decision

PASS. No blockers and no untested hotspots. The stacked draft is open.

## PRs (bottom to top)

- SGS-209: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/217
  - base `main`
  - new
  - pushed head 3f948d434df1ebf513bb05dcdaa5694acb1c2c42
  - `pr.sh create`: `created #217`
  - `pr.sh body`: `body #217 rewritten`

### Merge risk
**medium** - adds an operation to the public named-builds API and changes the id route's 405 `Allow` list, OpenAPI `info.version` and 405 example key; it stays backward-compatible (existing operations keep their behavior) and a revert undoes it (a renamed record is still a valid stored build).

### Review focus
- [`lib/aoe4-build-order/named-builds-routes.ts:96-129`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/217/files#diff-4b233f2d937fbdbc05de40e7d4bed2e0a788ae70fa10b843bd05b768080a763bR96-R129) - `writeNextRevision` is now the write path for both `PUT` and `PATCH`. If the secret were compared before the rate-limit slot is taken, edit secrets could be guessed without limit, and a wrong revision check would let a stale tab overwrite a newer version - check the order: slot, read, secret, revision, then compare-and-swap - pinned by [`lib/aoe4-build-order/named-builds-routes.test.ts`: answers 429 for an exhausted slot before reading the build, even with a wrong secret](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/217/files#diff-f0d35fa8961ba0b2ac24b8927c1c3d7dcc32afe74fd899d224adca9f17289ee4R582-R590) (the `PUT` copy at lines 356-366 pins the same order for updates)
- [`lib/aoe4-build-order/named-builds-routes.ts:152-176`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/217/files#diff-4b233f2d937fbdbc05de40e7d4bed2e0a788ae70fa10b843bd05b768080a763bR152-R176) - a rename that spread the request body or rebuilt the order could overwrite steps, `createdAt` or `secretHash`, or store extra body keys - check that only `buildOrder.name` (trimmed) changes - pinned by [`lib/aoe4-build-order/named-builds-routes.test.ts`: answers 200 with ETag "2" and changes only the name, revision and updatedAt](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/217/files#diff-f0d35fa8961ba0b2ac24b8927c1c3d7dcc32afe74fd899d224adca9f17289ee4R652-R669)

## What I reviewed

- Commit range: `d80751b..3f948d4` (merge-base = `origin/main` tip). It has 4 commits, all SGS-209: bce5d14, eba21ef, 2a9e651, 3f948d4.
- Diff size: 19 files, +913/-104 in total. Hand-written production code is +92/-27 across 7 files: `named-builds-routes.ts`, `named-builds.ts`, `saved-builds.ts`, `save-rate-limit.ts`, `named-build-client.ts`, `build-fetch.ts`, and `acceptance/helpers.ts`. The docs are +368/-32: `openapi.json` and `aoe4-build-order-format.md`. The rest is tests: the route unit tests, the client unit tests, and 2 new acceptance specs plus 4 edited ones.
- Invariants:
  - S3 holds. The rename takes a slot from the shared write budget, the name is capped at 100 characters, and the id route's 128 kb body limit applies.
  - A1 to A3 are untouched. There is no engine or data change.
  - None of the changed symbols is on a `criticalPaths` entry.
- Open questions: PROJECT.md has none and the ticket has none. The change follows design C8 and C9 and the "Rename: server" rules.
- Irreversibility: none. No schema change. A renamed record still matches `storedNamedBuildSchema`, which the old code reads.
- Concurrency: nothing new. The rename uses the existing `replaceNamed` compare-and-swap, and the race test covers the conflict case. Whether the real Blob store rejects a stale etag is the ticket's unverified assumption, so the PR has a Preview check for it.
- Security: the secret check is the same and runs after the slot is taken. There are no new unauthenticated write paths and no secrets or PII in logs. The log lines carry only the id and revisions.
- Contract: the change only adds to the API. `PATCH` used to be 405 and is now an operation. The 405 `Allow` list and messages change, and the OpenAPI 405 example key changes from `patchOnId` to `postOnId`. The ticket requires all of these, and no production consumer reads them.
- Blast radius: the `PUT` write path was moved into `writeNextRevision`. Its check order and write (`{...stored, ...record, revision+1, updatedAt}`) are the same as before, and the existing `PUT` tests still pass unchanged.
- Stack check: one member on `main`, and its diff holds only its own task. There is no base-only branch. `gh pr view` found no existing PR before the create.
- Issue line: the ticket's Source names no `GitHub issue #<n>`, so the PR body has no issue line.

## Non-blocking notes

- The rename rejects a blank name after trimming, but `PUT` and `POST /builds` still accept any name up to the cap, including an empty one. The ticket asks for this difference, so it is not a defect.
- I put the attribution line above the `<!-- cf-stack -->` marker so the stack footer runs to the end of the body.

## Cleanup

`checkout.sh remove` for the scratch `tech-lead-SGS-209-SGS-209` runs after this report is written. Its result is given in the handback.
