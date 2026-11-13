# SGS-151: Share one in-memory Blob fake across the store tests

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (test-only; about 120 lines of fake move into one shared test-support module, net test lines go down)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12): three hand-written in-memory Blob fakes, a shared test-support fake would replace all (SGS-130 review 3)

## Context

Three test files each hand-write an in-memory stand-in for `@vercel/blob` `put`, `get`, `head`, and `del`, each re-implementing `ifMatch` / `allowOverwrite` / etag semantics: `counterBlob` in `lib/aoe4-build-order/blob-build-store.test.ts` (a single counter blob, with an event log), the `vi.mock('@vercel/blob')` block in `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts` (a key map with injectable faults, weak-etag reads, a read hook), and the one in `lib/aoe4-build-order/named-build-store.acceptance.test.ts` (a key map plus a CDN cache that serves the first body unless `useCache: false`). A fix to one copy's write rules (a new rejection case, an etag form) has to be repeated in the others, or the tests quietly disagree about what Blob does.

## Scope

This is a test-hygiene Chore: no production code and no behavior the owner sees changes.

- Add one shared test-support module next to `route-test-support.ts` and `test-helpers.ts` in `lib/aoe4-build-order/` (named like them, so it is not collected as a test). It holds the single implementation of the write rules: create-only without `ifMatch` unless `allowOverwrite`, `BlobNotFoundError` for `ifMatch` on an absent key, `BlobPreconditionFailedError` on an etag mismatch, a fresh etag per write, `head` / `del` raising `BlobNotFoundError` for an absent key, `get` returning the stream/headers/etag shape the store reads. The optional behaviors the three copies need (fault injection and weak-etag reads, a read hook, a CDN cache that honors `useCache: false`, an event log, seeding a key) are opt-in features of the shared fake, or are layered on top of it by the test that uses them; the implementer chooses the API, following the helper style of the sibling support modules.
- Replace the three hand-written fakes with the shared one. The `vi.mock('@vercel/blob', ...)` calls stay in each test file (Vitest hoists them); they delegate to the shared fake.
- Keep each file's assertions as they are. Where a test reads fake state directly (the stored body, an etag, `lastPutError`, the event log), it reads it through the shared fake's accessors.
- The shared fake does not import production store code, so a store bug cannot be mirrored into the fake.

**Out of scope:** any change to `blob-build-store.ts` or its production behavior; `blob-build-store.live.test.ts` (talks to real Blob); the file-store backend; new test cases beyond what the shared fake needs to prove its own write rules; fakes outside the Blob SDK (`fetch-test-helpers.ts`, `storage-test-helpers.ts`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Pre-existing tests in `blob-build-store.test.ts`, `blob-lost-writes.acceptance.test.ts`, and `named-build-store.acceptance.test.ts` keep their assertions and expected values and pass; any edit to them is to fake setup and state access only.
- [ ] Exactly one implementation of the Blob write rules (create-only, `ifMatch` not-found and mismatch, fresh etag per write) exists in test code; none of the three test files re-implements them.
- [ ] The shared fake has its own test that fails if a rule breaks: a create without `ifMatch` over an existing key is refused unless `allowOverwrite`; `ifMatch` on an absent key raises `BlobNotFoundError`; a stale `ifMatch` raises `BlobPreconditionFailedError` and leaves the stored body unchanged; each successful write yields an etag different from the previous one.
- [ ] The CDN-cache behavior (a stale body and etag served unless `useCache: false`) and the fault/weak-etag behavior remain exercised through the shared fake by the tests that used them before.
- [ ] No production file changes; the diff touches only test and test-support files.
- [ ] `npm test` and `npx tsc --noEmit && npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
