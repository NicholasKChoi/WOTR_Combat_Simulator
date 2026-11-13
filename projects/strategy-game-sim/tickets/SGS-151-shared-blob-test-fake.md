# SGS-151: Share one in-memory Blob fake across the store tests

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A1, A2, A3 (path match only; test-only change, behavior untouched)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (test-only; about 120 lines of fake move into one shared test-support module, net test lines go down)
- **Depends on**: SGS-142
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12): three hand-written in-memory Blob fakes, a shared test-support fake would replace all (SGS-130 review 3)

## Context

Three test files each hand-write an in-memory stand-in for `@vercel/blob` `put`, `get`, `head`, and `del`, each re-implementing `ifMatch` / `allowOverwrite` / etag semantics: `counterBlob` in `lib/aoe4-build-order/blob-build-store.test.ts` (a single counter blob, with an event log), the `vi.mock('@vercel/blob')` block in `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts` (a key map with injectable faults, weak-etag reads, a read hook), and the one in `lib/aoe4-build-order/named-build-store.acceptance.test.ts` (a key map plus a CDN cache that serves the first body unless `useCache: false`). A fix to one copy's write rules (a new rejection case, an etag form) has to be repeated in the others, or the tests quietly disagree about what Blob does.

## Scope

This is a test-hygiene Chore: no production code and no behavior the owner sees changes.

- Add one shared test-support module next to `route-test-support.ts` and `test-helpers.ts` in `lib/aoe4-build-order/` (named `*test-helpers.ts`, so it is not collected as a test). It holds the single implementation of the write rules: create-only without `ifMatch` unless `allowOverwrite`, `BlobNotFoundError` for `ifMatch` on an absent key, `BlobPreconditionFailedError` on an etag mismatch, a fresh etag per write (respec 2: each write yields a quoted strong etag of the form `"e<n>"`, because `blob-lost-writes.acceptance.test.ts` asserts `readEtag` matches `/^"e\d+"$/` and keeps that assertion; the weak-read mode returns the same etag prefixed `W/`; the etag form in `named-build-store.acceptance.test.ts` (`etag-N`) is not preserved, so any assertion there that pins it is a fake-state read that takes the new form from the shared fake's accessor), seeding a key takes an explicit etag (the lost-writes test seeds the counter key with a fixed etag today), `head` / `del` raising `BlobNotFoundError` for an absent key, `get` returning the stream/headers/etag shape the store reads. The optional behaviors the three copies need (fault injection and weak-etag reads, a read hook, a CDN cache that honors `useCache: false`, an event log, seeding a key) are opt-in features of the shared fake, or are layered on top of it by the test that uses them; the implementer chooses the API, following the helper style of the sibling support modules.
- Replace the three hand-written fakes with the shared one. The `vi.mock('@vercel/blob', ...)` calls stay in each test file (Vitest hoists them); they delegate to the shared fake. (respec 1) The shared module must not statically import `@vercel/blob` (it would be circular with the mock factory that imports the module): the factory passes the real SDK error classes (`BlobNotFoundError`, `BlobPreconditionFailedError`, from `importOriginal`) into the fake. The fake installs its behavior onto the same `vi.fn` mocks the test files already create, so existing call assertions on those mocks keep working.
- (respec 1) The `counterBlob` event log (counter-JSON specific) stays layered in `blob-build-store.test.ts`, not in the shared fake.
- (respec 2) `get` and `put` in the shared fake keep the same number of awaits as `counterBlob` has today (one each, no extra `await` from a hook or log layer): the parallel-bump test in `blob-build-store.test.ts` asserts an exact get/put event order that depends on it.
- (respec 2) `blob-build-store.test.ts` is also edited by SGS-142. Describe and edit it at SGS-142's end state: `describe('replaceNamed')` there uses per-test `mockResolvedValue` on the mocked `get`/`put`/`head` and adds `head`-based cases, and does not use `counterBlob`; leave those rows alone. Read the file at the SGS-142 tip (or origin/main once integrated), not the base.
- (respec 2) Name the new module `*test-helpers.ts` (for example `blob-fake-test-helpers.ts`) so it falls under the `pattern` of `.jscpd.tests.json` (stricter than the main jscpd config). A different name needs that pattern extended in this ticket.
- Keep each file's assertions as they are. Where a test reads fake state directly (the stored body, an etag, `lastPutError`, the event log), it reads it through the shared fake's accessors.
- The shared fake does not import production store code, so a store bug cannot be mirrored into the fake.

**Out of scope:** any change to `blob-build-store.ts` or its production behavior; `blob-build-store.live.test.ts` (talks to real Blob); the file-store backend; new test cases beyond what the shared fake needs to prove its own write rules; fakes outside the Blob SDK (`fetch-test-helpers.ts`, `storage-test-helpers.ts`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Pre-existing tests in `blob-build-store.test.ts`, `blob-lost-writes.acceptance.test.ts`, and `named-build-store.acceptance.test.ts` keep their assertions and expected values and pass; any edit to them is to fake setup and state access only.
- [ ] (respec 1) In each of the three test files, the `vi.mock('@vercel/blob')` factory delegates `put`/`get`/`head`/`del` to the shared module and no file keeps its own blob map or write-rule logic; the shared fake's own test is the only test of the write rules.
- [ ] The shared fake has its own test that fails if a rule breaks: a create without `ifMatch` over an existing key is refused unless `allowOverwrite`; `ifMatch` on an absent key raises `BlobNotFoundError`; a stale `ifMatch` raises `BlobPreconditionFailedError` and leaves the stored body unchanged; each successful write yields an etag different from the previous one.
- [ ] The CDN-cache behavior (a stale body and etag served unless `useCache: false`) and the fault/weak-etag behavior remain exercised through the shared fake by the tests that used them before.
- [ ] (respec 2) Each successful write through the shared fake yields a quoted strong etag of the form `"e<n>"`, and a test in the shared fake's own test pins that form; the lost-writes etag assertion passes unchanged.
- [ ] (respec 2) The parallel-bump test in `blob-build-store.test.ts` passes with its event-order assertion unchanged.
- [ ] No production file changes; the diff touches only test and test-support files.
- [ ] `npm test` and `npx tsc --noEmit && npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: the "exactly one implementation" criterion was a search-style check with no behavior behind it; Invariants said `none` though the paths match A1-A3; import-cycle, mock-install, and event-log placement were unstated.
- Changed: criterion replaced with a delegation/behavior one; Invariants set to A1, A2, A3; Scope gained the importOriginal error-class, same-`vi.fn`, and event-log-in-test rules.
- Branch work: none existed; nothing to preserve.

## Re-spec 2 - 2026-11-12

- Underspecified: the etag form (an existing test pins `"e<n>"`, the fakes differed), the dependency on SGS-142 (same test file), the single-await constraint, and the jscpd test-pattern naming.
- Changed: Depends on SGS-142; Scope states etag form, explicit-etag seeding, await count, SGS-142 end state, and `*test-helpers.ts` naming; two criteria added.
- Branch work: none existed; nothing to preserve.
