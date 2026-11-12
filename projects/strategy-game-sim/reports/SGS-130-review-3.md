# SGS-130 review 3 (delta, Re-spec 1)

- Verdict: **APPROVE**
- Branch: `sgs-130-blob-landed-write-retry-cap`, tip `2d7f34e`
- Mode: delta from approved tip `fc011d5` (review-2). Covers the acceptance commit `d2b7669`, the simplify commit `73693ef` and the rework `2d7f34e`.
- Worktree: `worktrees/review-sgs-130-3` (detached). Removed after the review, or left for the next prune if removal fails with EBUSY.

## Blocking findings

None.

## Spec gaps

None. The ticket's Re-spec 1, `design/M9.md` lines 277 and 519-529, and owner decision 7 agree with each other and with the code.

## Gates run

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: 0 clones (both the source and test configs).
- `npm test`: 75 files passed and 1 skipped (the live test). 2400 tests passed, 15 skipped, 0 failed.
- The two touched test files on their own: 78 passed.
- My own mutation run: I re-added `if (await landed(key, JSON.stringify(update))) return update;` to the `bumpCounter` catch. 7 tests failed: contended, both "starts a new attempt" rows, the network-error rethrow, both parallel rows, and the route test for a dropped counter update. I reverted the change and confirmed `git status` was clean.
- `next build` not run by me. The diff touches no page or component. The implementer reports that the build passed.
- UI inspection: skipped, because the diff changes no UI.

## Acceptance criteria

1. Env cap set only when unset: **pass**. The code is unchanged in the delta (`blob-build-store.ts:14`). The unit test approved in review-2 still runs. `73693ef` only removed a duplicate route-level check.
2. `replaceNamed` read-back outcomes: **pass**. Code unchanged (`blob-build-store.ts:112-121`). The route tests in `blob-lost-writes.acceptance.test.ts:130-153` also drive the 200, 412 and 503 outcomes over a stateful fake.
3. `replaceNamed` with not-found gives `conflict`, one put on the caller's etag: **pass**. Unit test unchanged, plus route test `:155-166`.
4. `create` outcomes for `putBuild` and `createNamed`: **pass**. Unit tests unchanged, plus route table `:169-186`.
5. (respec 1) No read-back after a failed counter put: **pass**. `blob-build-store.ts:92-98` has no `landed` call and no read in the catch. The unit test at `blob-build-store.test.ts:351-364` makes the stored value equal the sent JSON. It asserts the second put uses `etag-2` and that `get` runs twice (once per attempt). It fails under the mutation.
6. (respec 1) Two parallel bumps: **pass**. `blob-build-store.test.ts:375-384` uses `counterBlob`, a fake whose put honors `ifMatch` and `allowOverwrite: false`. It covers an existing counter and an absent one. It asserts distinct counts `[before+1, before+2]`, a stored count of `before+2`, and the exact get/put event log. Under the mutation it fails with `[5,5]` / `[1,1]`. The event order is deterministic: both `get` mocks log synchronously when called, before any put.
7. (respec 1) Counter failure paths: **pass**.
   - Non-412 on an update rethrows after one put, even when the stored value matches: `:366-373`.
   - Create with the key present goes to the next attempt: `:343-349` and the create row of `:351-364`.
   - Create with the key absent rethrows after one put: `:386-394`.
   - Contended after 3 attempts: `:335-341`.
8. (respec 1) Route level: **pass**.
   - First save with a lost counter response gives 201 and a count of 1 or 2: `blob-lost-writes.acceptance.test.ts:189-199`. It first asserts the counter is absent.
   - A dropped counter update gives 503, one counter put and no build put: `:201-211`. This fails under the mutation.
   - 429 with `Retry-After` 1 after three counter puts: `:213-219`.
9. `landed` swallows a read throw: **pass**. Code unchanged. Route rows `:135`, `:137` and `:173` force the weak-etag throw and check the outcome of the original put error. `:137` checks that the logged error is the put error.
10. Text equality, not deep equality: **pass**. Unit test unchanged, plus route row `:134` (`sameDataReordered` gives 412).
11. No signature, `PutResult`, `ReplaceResult` or status change: **pass**. In the delta, `build-store.ts` changes only a comment.
12. The live test is skipped under `npm test` and fails in `beforeAll` without credentials: **pass**. Unchanged since review-2. `npm test` reports 1 file skipped.
13. Live keys stay under `live-check-`: **pass**. Unchanged since review-2.
14. (respec 1) `ARCHITECTURE.md` and the seam comments: **pass**.
   - `ARCHITECTURE.md:24` names `create` (behind `putBuild` and `createNamed`) and `replaceNamed` as the writes that read back. It says `bumpCounter` makes no read-back and gives the reason. It says a 412 or a created-meanwhile counter starts the next attempt with a fresh read and a new put, any other error rethrows, and `contended` follows the third attempt. All of this matches `blob-build-store.ts:82-101`.
   - The retry-cap sentence covers put, head and del, and says `get` makes a single request.
   - The retry-cap comment at `blob-build-store.ts:9-10` and the `landed` comment at `:49-51` ("For build writes only") are accurate.
   - The new catch comment at `:93-94` states the rejected alternative, as Scope asks.
   - The `build-store.ts:35` comment ("never re-reads the etag to try again") matches the memory and file stores (`build-store.ts:80-86`, one attempt) and the Blob store.
   - No comment or doc says a counter write is read back or that `get` is retried.
   - `docs/aoe4-build-order.md` lines 712-723 and 746 (save limit) still hold.
15. Human-gated live run: **unverified**. The owner runs it on the PR branch. The `replaceNamed` comment still says "unverified" until that run, as the ticket intends.
16. No INVARIANTS.md regressions: **pass**. See below.

## Invariants touched

- A1-A3 (`lib/aoe4-build-order/**` paths): **hold**. The diff touches storage only, not the simulation path. It adds no game number literal, spend, randomness or clock read.
- Save limit (design decision 7, not an INVARIANTS entry): **holds**. Each `bumpCounter` loser re-reads and claims a distinct count. The parallel test pins this.

## Contract and scope

- spec-checklist Contracts: no route, field or metric name changes. Scope: no `golang/` change and no out-of-scope item; `BuildStore`, `nextCounter` and the counter shape are unchanged. No open question is answered with a new constant.
- Design C10 seam: `landed` stays module-private, and `bumpCounter` follows the M9 rules table rows at lines 526-528.

## Lint

Both gates are clean.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so this section does not apply.

## Conventions

- Commit messages in the delta contain no ticket ids, PR numbers or process history.
- The new unit tests follow the file's existing `it.each` tables and `found`/`counterPuts` helpers (`blob-build-store.test.ts:24-33`). The route tests follow the `failNext`/`stored`/`putsTo` helpers in the same file.
- jscpd finds no clones.

## Non-blocking notes

- `blob-lost-writes.acceptance.test.ts:198`: `expect([1, 2]).toContain(...)` follows the criterion's "at most one above" wording. With this fake, both faults deterministically store 2, because the next attempt counts again. Pinning `2` would also catch a regression that brings the counter read-back back at route level. Today only the unit tests and the dropped-update route test catch that.
- `blob-build-store.test.ts:36-63` (`counterBlob`) is the third hand-written compare-and-swap Blob fake in `lib/aoe4-build-order/`. The others are `blob-lost-writes.acceptance.test.ts:22-71` and `named-build-store.acceptance.test.ts:~20-30`. There is no shared fake for it to reuse, and each one is wired through a different `vi.mock` style, so this is not a finding. It is a BACKLOG candidate: a shared in-memory Blob fake in a test-support module.
- The two new rows at `blob-build-store.test.ts:351-364` overlap in setup with the existing `retries a changed etag` (`:325`) and `retries a create that lost` (`:343`) tests. The difference is that the stored value equals the sent JSON, which is what the criterion tests. They could be folded into one table later. The diff adds only two such blocks, so the three-block rule does not apply.
- `blob-build-store.ts:108` says "No retry:" while `build-store.ts:35` was reworded to avoid "never retries" because the SDK retries the HTTP put. Both mean no application-level retry, and the next clause at `:108` makes that clear. The line is outside the delta and was approved in review-2.

## Coverage

- Reviewed in full:
  - `lib/aoe4-build-order/blob-build-store.ts`
  - the delta of `lib/aoe4-build-order/blob-build-store.test.ts`, plus the whole `bumpCounter` describe block
  - all of `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts` (added after `fc011d5`)
  - the `build-store.ts` comment and the store's `replaceNamed`
  - the `ARCHITECTURE.md` storage row
  - `vitest.config.mts`
  - the `docs/aoe4-build-order.md` save-limit paragraphs
  - `design/M9.md` C10, the rules table and decision 7
- Test files outside the delta are unchanged since review-2 (`git diff --stat fc011d5..HEAD -- '*.test.ts'` shows only the two files above).
- REPO.md review checklist:
  - "Every diff" asks for `next build` and loading touched pages. No page is touched, and I did not run the build.
  - The AoE4 section's UI and layout items do not apply.
  - No module-to-module copy of a helper or tolerance.
- Not reviewable here: the live Blob behavior (owner-gated).
