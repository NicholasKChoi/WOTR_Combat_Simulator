# SGS-142: Answer conflict when a named build is deleted mid-update

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: high
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: `head` on an absent key rejects with `BlobNotFoundError` (the store's own `exists` helper and `deleteNamed` already rely on this, but no live test pins it); `put` with `ifMatch` on an absent key raises a plain `BlobError` (SDK code `bad_request`, message "The specified key does not exist."), observed once by the owner on @vercel/blob 2.9.0, not a documented contract
- **LOC estimate**: 15 (`replaceNamed` in `lib/aoe4-build-order/blob-build-store.ts`; the live test edit is test code)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12) from the owner's live `npm run test:blob-live` run on main

## Context

`replaceNamed` in `lib/aoe4-build-order/blob-build-store.ts` returns `conflict` only for `BlobPreconditionFailedError` and `BlobNotFoundError`. The owner's live run against a real store showed that `put` with `ifMatch` on a key that no longer exists raises a plain `BlobError` ("The specified key does not exist.", SDK `bad_request`), so `replaceNamed` rethrows it. The named-builds PUT route (`replaceNamed` caller in `lib/aoe4-build-order/named-builds-routes.ts`) catches it as a storage failure and answers 503 instead of the 409 "changed" reply when a build is deleted between its read and its write. Live test 2 fails for this reason. Unit tests did not catch it because `blob-build-store.test.ts` mocks `put` with the SDK's typed errors only, and live test 1 ("records the error put raises") asserts only `toBeInstanceOf(Error)`, so it passed on an unrelated `BlobOidcEnvironmentNotAllowedError`. The comment above `replaceNamed` that says the raised error is unverified becomes stale.

## Scope

- `replaceNamed` in `lib/aoe4-build-order/blob-build-store.ts`: when the put fails, is not found to have landed, and is not already a known conflict error, check whether the key is absent with `head`. Absent (`head` rejects with `BlobNotFoundError`) returns `conflict`. Any other outcome (key present, or `head` itself failing for another reason) rethrows the original put error, so a real outage still answers 503. Do not reuse the `exists` helper as is: it turns every `head` failure into "absent", which would map an outage to `conflict`. No retry and no etag taken from any read into a write (existing rule at `replaceNamed`).
- Update the comment above `replaceNamed` that calls the raised error unverified, to state the observed behavior.
- `lib/aoe4-build-order/blob-build-store.test.ts`, `describe('replaceNamed')`: rows that assert `head` is never called for an unrecognized put error change to the new behavior; add the missing-key and head-failure cases below. Any other test keeps its assertions.
- `lib/aoe4-build-order/blob-build-store.live.test.ts`: test 1 asserts the exact error class observed live (a plain `BlobError`, so a subclass such as `BlobOidcEnvironmentNotAllowedError` fails it) instead of `toBeInstanceOf(Error)`. Keep the `console.log`. Test 2 must pass against a real store.
- Docs: check `ARCHITECTURE.md` (AoE4 saved-build storage row says an absent build gives `conflict`) and any comment at the seam; fix only a statement the change makes untrue.

**Out of scope:** the memory and file stores, `create`, `bumpCounter`, `deleteNamed`, the route's reply shapes, the `exists` helper's behavior for `create` and `bumpCounter`, changing SDK retry settings.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A put on `replaceNamed` that raises a plain `BlobError` (not a precondition or not-found subclass) while `head` reports the key absent and the fresh read does not show our JSON returns `conflict`; a test covers it and fails at the base.
- [ ] The same put error with `head` finding the key present rethrows the original put error; a test fails if it maps to `conflict`.
- [ ] The same put error with `head` failing for a reason other than `BlobNotFoundError` rethrows the original put error (not the `head` error and not `conflict`); a test fails if an outage maps to `conflict`.
- [ ] A put error where the fresh read shows our JSON landed still returns `replaced`, and the existing `BlobPreconditionFailedError` and `BlobNotFoundError` rows still return `conflict`.
- [ ] Live test 1 fails when `put` raises any class other than the one observed live (verified by asserting the class, not `Error`), and live test 2 passes with `npm run test:blob-live` against a real store; the implementer records the live result in the report, or states it could not be run.
- [ ] Docs and comments that described the missing-key error as unverified are corrected.
- [ ] No INVARIANTS.md regressions

## Open questions

none
