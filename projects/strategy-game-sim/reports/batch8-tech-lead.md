# Batch 8 tech-lead gate

## Decision
PASS. No blockers and no untested hotspots. Three stacked draft PRs opened with footer stacking.

## PRs (bottom to top)

### #108 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/108 (base main)
## Merge risk
**low** - a new module with no caller and type-only additions to `api.ts`; a revert removes it fully, and tests pin every check.

## Review focus
No hotspots: a pure module with no caller yet; every check row, the issue order, the 413 byte count and the read-back check are pinned in [`saved-builds.test.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/108/files#diff-ebfad9ff743cdb1e5664d7e7effd5b264a00e9c1fdd0a383d3a52d47756424c7).


### #109 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/109 (base sgs-099-saved-build-record)
## Merge risk
**high** - new concurrency: the Blob counter is a compare-and-swap shared by every serverless instance, and it is what bounds the save rate.

## Review focus
- [`lib/aoe4-build-order/blob-build-store.ts:48-65`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/109/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR48-R65) - the tests mock `@vercel/blob`. If the live SDK reports a lost `ifMatch` race with an error other than `BlobPreconditionFailedError`, concurrent saves from one client get a 503 instead of a retry. A create conflict that is not recognised would also fail the save. Check the error class the installed SDK throws for HTTP 412, and run the preview smoke against a real store - pinned by [`blob-build-store.test.ts`: retries a changed etag with the etag of the new read; reports contended after three changed etags; retries a create that lost to another writer](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/109/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R114-R138)
- [`lib/aoe4-build-order/save-rate-limit.ts:19-25`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/109/files#diff-1ff9d02432d364f48243c924c82c4864f77336661bfdf5f70b641b57d9992f5dR19-R25) - an off-by-one at the 30-save boundary or a wrong window start lets a client save more than the limit, or locks it out for the wrong time. Check `<=` against `maxSaves` and the `Retry-After` arithmetic - pinned by [`save-rate-limit.test.ts`: allows saves 1 to 30 in a window and refuses the 31st and 32nd, and the retry-after table](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/109/files#diff-0f14a04a04f152e9ee9d9a6e4ce3f533949067a8aeb7755b1bce96481762ddb4R21-R37)


### #110 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110 (base sgs-101-build-store-and-rate-limit)
## Merge risk
**high** - security-relevant code: new unauthenticated public routes that write to storage and, outside production, delete from it. Saved builds also outlive a revert.

## Review focus
- [`lib/aoe4-build-order/builds-routes.ts:51-54`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-519aeb228be232bb7cbf7b9b2411569dd50dae9650b2485957b238beaffb72b3R51-R54) - DELETE is refused only when the storage env is exactly `production`. A `VERCEL_ENV` that is missing at runtime maps to `development`, so such a deployment would serve unauthenticated deletes, and production saves would land under the `development/` prefix. Check that the production function sees `VERCEL_ENV=production` - pinned by [`builds-routes.test.ts`: answers 405 for DELETE in production and deletes nothing](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-7db2194747083f7aa9ed31189abd6284b36ece559c61ce53772a026493e95146R173-R182) and [`saved-builds.test.ts`: storageEnv table](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/108/files#diff-ebfad9ff743cdb1e5664d7e7effd5b264a00e9c1fdd0a383d3a52d47756424c7R99-R111)
- [`lib/aoe4-build-order/builds-routes.ts:20-30`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-519aeb228be232bb7cbf7b9b2411569dd50dae9650b2485957b238beaffb72b3R20-R30) - if the order changes, a client loses budget to bodies the route rejects (check after the slot), or saves bypass the limit (put before the slot). Check validation, then slot, then put - pinned by [`builds-routes.test.ts`: answers %s with the check error, calling no store and spending no slot; allows saves 1 to 30 from one client and refuses the 31st with Retry-After and no put](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-7db2194747083f7aa9ed31189abd6284b36ece559c61ce53772a026493e95146R57-R118)
- [`pages/api/aoe4-build-order/simulate.ts:27-50`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-578b560075c1794ae8b41fe38dc3a3da3b4f497a963ac48dba931babeb5aed34R27-R50) - the existing simulate consumers read these responses. A changed 405 header or text, or 400 body, breaks them. Check that the shared helpers emit the same status, headers and body - pinned by [`simulate-api.acceptance.test.ts`: answers GET with 405, Allow: POST and the method text; answers a body that is an array with the not-an-object 400](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/110/files#diff-8868ec3efb67eaa728b9af6a1777c1ca1a74d5bd518a86bccef6cf24fa41e0d2R52-R60)


## Reviewed
- Commits 1e6d6c2..f931a8a (sgs-099 @5efa6ee, sgs-101 @ce261b4, sgs-103 @f931a8a) on origin/main; linear stack, each branch's diff holds only its own task.
- Reviewable LoC: #108 +120/-1 (tests +225 excluded); #109 +236/-3 (tests +545, package-lock +209/-13 excluded); #110 +181/-25 (openapi.json +609/-37, unit tests +374/-4, Playwright +413/-8 excluded).
- Against INVARIANTS.md S1-S3, W1-W2, H1-H3, A1-A3; CONTEXT.md has no open questions; M6 has no Safety and contracts section.
- npm audit on sgs-101: found 0 vulnerabilities. npm ls zod: single zod@4.6.7.

## Non-blocking notes
- A missing VERCEL_ENV at runtime maps to development: unauthenticated DELETE in production and saves under the development/ prefix (design choice; #110 Review focus 1).
- Without BUILDS_STORE_ID on Vercel the file store hits a read-only filesystem; saves answer 503.
- Blob SDK internal retries (up to 10) times 3 CAS attempts can make a request slow during a Blob outage (review N4).
- Refused saves still write the counter, so an over-limit client still causes Blob operations.
- The counter rule is duplicated in build-store.ts and blob-build-store.ts (BACKLOG item).
- Distributed clients can fill storage at 30 x 64 KB per IP per hour.
- Live SDK behavior (412 error class, del on absent blob, OIDC) is unverified until the preview smoke run.
- The SGS-099 commit message carries the ticket id; the PR title and body are clean for the squash.
- Review N1: one test catches a static import of the Blob module only incidentally.
