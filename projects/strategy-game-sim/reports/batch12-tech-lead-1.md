# Batch 12 tech-lead gate

## Decision

PASS. No blockers and no untested hotspots. Three stacked draft PRs are open and pushed bottom up with no new commits. Stacking uses the footer (`<!-- cf-stack -->`).

## Opened PRs (bottom to top)

### SGS-120: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/134 (base `main`, head `sgs-120-named-routes` at c09b34d)

## Merge risk
**high** - new concurrency: `replaceNamed` is a read-compare-write on shared stored builds, and a wrong compare silently overwrites a concurrent writer's version.

## Review focus
- [`lib/aoe4-build-order/blob-build-store.ts:78-88`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/134/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR78-R88) - if `ifMatch` is dropped or the precondition error is not mapped to `conflict`, two tabs saving at once in production both succeed and the earlier save is lost without a 412 - check that the put carries the caller's etag and that only `BlobPreconditionFailedError` and `BlobNotFoundError` become `conflict` - pinned by [`lib/aoe4-build-order/blob-build-store.test.ts`: replaceNamed](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/134/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R106-R126)
- [`lib/aoe4-build-order/build-store.ts:80-86`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/134/files#diff-0dea67c8df429107f6801989a9618ae4d5229c188ef553b13458cbedcc786ee8R80-R86) - an `await` between `readNow` and `writeNow` lets two concurrent replaces with the same etag both report `replaced` in dev and tests, hiding conflict bugs - check the compare and write stay synchronous - pinned by [`lib/aoe4-build-order/build-store.test.ts`: lets only one of two concurrent replaces with the same etag win](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/134/files#diff-163acd2113c9e0b09fac47b5ba014d5bfc7f0d75f78f7b9136326d478e35d67aR168-R178)

### SGS-121: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/135 (base `sgs-120-named-routes`, head `sgs-121-named-build-routes` at 6ca957b)

## Merge risk
**high** - security-relevant code: the edit-secret check is the only thing between a public PUT and overwriting someone else's build; it also adds a public API.

## Review focus
- [`lib/aoe4-build-order/named-builds-routes.ts:93-124`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/135/files#diff-4b233f2d937fbdbc05de40e7d4bed2e0a788ae70fa10b843bd05b768080a763bR93-R124) - a reordered check lets anyone with a build id overwrite it (secret compared after the write), reveals the revision to non-owners (412 before 403), or lets secret guessing skip the rate limit (slot after the secret) - check the order slot, read, schema, secret (403), revision (412), compare-and-swap (412) and that `createdAt` and `secretHash` come from the stored record - pinned by [`lib/aoe4-build-order/named-builds-routes.test.ts`: namedBuildReply, PUT store rows](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/135/files#diff-f0d35fa8961ba0b2ac24b8927c1c3d7dcc32afe74fd899d224adca9f17289ee4R339-R414)
- [`lib/aoe4-build-order/api-route.ts:45-57`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/135/files#diff-25fe55c11ccb9dc62b94376717f79a2681d107feb5abdd02aa055019303625d0R45-R57) - shared by every AoE4 route; if the ETag branch fires for other replies or drops the JSON content type, existing clients fail to parse responses, and if it is removed the named routes send Next's body hash as the ETag so `If-Match` never matches - check only replies with an `ETag` header take the direct write - pinned by [`lib/aoe4-build-order/api-route.test.ts`: writes a body whose reply sets an ETag directly as JSON](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/135/files#diff-06de1119389c311503eb299ae64847fa81d158a98879210266068c03272dff32R76-R81)

### SGS-124: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136 (base `sgs-121-named-build-routes`, head `sgs-124-page-library` at bbf6c56)

## Merge risk
**medium** - touches a public surface (the page's `?n=` and `?b=` query handling and its URL rewriting), backward-compatible for existing `?b=` links, and a revert undoes it.

## Review focus
- [`pages/apps/aoe4-build-order.tsx:236-261`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR236-R261) - a wrong guard order here discards a user's unsaved edits without asking, or lets a late fetch for a previously chosen build overwrite the text after the user moved on - check the confirm runs before any state change and that a superseded or failed fetch changes nothing - pinned by [`acceptance/aoe4-my-builds.spec.ts`: discard confirm](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR162-R209) and [choosing a My builds entry failures](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR436-R456)
- [`pages/apps/aoe4-build-order.tsx:190-207`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR190-R207) - a shared `?n=` or `?b=` link that 404s could replace the address or leave auto-run held forever, so the page never runs - check the hold ends on every outcome and a failure replaces nothing - pinned by [`acceptance/aoe4-my-builds.spec.ts`: opening ?n= failures](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/136/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR290-R308)

## What was reviewed

- Combined range `156bf30...bbf6c56` (merge-base with origin/main through the top of the stack). Each task was also read against its own base.
- Stack check: linear. Each branch's diff against its base contains only its own task.
- Reviewable LoC (hand-written logic, excluding tests, acceptance specs, generated OpenAPI and docs):
  - SGS-120: +146/-47 in build-store.ts and blob-build-store.ts.
  - SGS-121: +216/-8 in named-builds-routes.ts, builds-routes.ts, api-route.ts and pages/api/aoe4-build-order/named-builds/{index,[id]}.ts. OpenAPI 2.4.0 to 2.5.0 is additive only.
  - SGS-124: +201/-91 in pages/apps/aoe4-build-order.tsx, build-library.ts, build-input.tsx, pin-name.ts, save-build.tsx and saved-build-loader.ts.
- Checked against INVARIANTS.md, CONTEXT.md (no open questions) and the M8 Safety and contracts section. Every product decision traces to design/M8.md as answered by the owner. The edit secret is only in the 201 body and the Authorization header; only its hash is stored, and it is never logged.
- Every Review focus entry has a pinning test, and each test's assertions were read.

## Non-blocking notes

- Known open risk, already in BACKLOG: live Vercel Blob `put` with `ifMatch` on a missing key is unverified. It is reachable only after a concurrent delete, and DELETE is non-production only. It maps to `conflict` (412) if Blob reports not-found.
- The file-store compare-and-swap is atomic within a process but not across processes. It is used only for dev and tests.
- The memory and file store etag is a content hash, so ABA is possible in principle. The routes always bump `revision` and `updatedAt`, so this cannot happen through the API.
- Auto-run is not held during a choose. Every control is disabled while the fetch runs, so the user cannot edit.
- Cross-tab refresh of My builds (the `storage` event) is deliberately not in SGS-124; a later ticket covers it.
