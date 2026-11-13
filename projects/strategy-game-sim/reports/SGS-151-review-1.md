# SGS-151 review 1

Verdict: APPROVE. Branch sgs-151-shared-blob-test-fake, tip b2aaf34, base f55e0aa (own diff, 5 test files, no production file).

## Blocking findings
None.

## Judgment on the implementer's four points
1. Criterion 2 in `blob-build-store.test.ts`: the `vi.mock` factory is still bare `vi.fn()`s and `counterBlob` calls `installBlobFake` on those same mocks. The literal wording ("factory delegates") is not met there, but the intent is: no file keeps its own blob map or write-rule logic, the fake installs onto the same `vi.fn`s, and the factory cannot install the fake without breaking `mockReset` plus the per-test `mockResolvedValue` rows (incl. SGS-142's `replaceNamed`). Accepted as meeting the intent. Non-blocking; the manager may note it as a literal deviation.
2. Singleton `blobFake()` in the two acceptance files: acceptable. The hoisted factory has no other hand-off, `installed` is per module registry (Vitest isolates per file), and the file-level import of `@vercel/blob` forces the factory to run before `blobFake()`. It throws a clear error otherwise.
3. Single-await rule: holds in code (get awaits only when `beforeRead` returns a promise; put has no await; `counterBlob`'s `beforeRead` returns undefined). Unpinned by any test, as reported; no test the diff adds claims it, so not a finding. Note: the old lost-writes get awaited `beforeRead` unconditionally; now it awaits only on a promise. Tests pass.
4. `etag-N` form gone: matches respec 2; no assertion pinned it.

## Acceptance criteria
1. Existing assertions unchanged, tests pass: PASS (diff reviewed; only fake setup and state access changed; I ran the four files: 112 passed).
2. Factory delegates, no file keeps its own map/rules: PASS on intent (see point 1); lost-writes and named-store factories delegate literally.
3. Fake's own test fails if a rule breaks: PASS (create-over-existing, ifMatch absent -> BlobNotFoundError, stale ifMatch -> BlobPreconditionFailedError with body unchanged, etag differs per write).
4. CDN behavior and fault/weak-etag still exercised: PASS (named-store uses `{ cdn: true }`; lost-writes uses `aroundPut` faults and `weakReads`; helper test covers both).
5. `"e<n>"` etag pinned in the fake's test (`['"e1"', '"e2"']`); lost-writes `/^"e\d+"$/` unchanged: PASS.
6. Parallel-bump event order unchanged: PASS (test passes; `counterBlob` log order get-at-start, put after write, same as before).
7. No production file changes: PASS.
8. `npm test` and `tsc && lint:dup`: lint chain run by me, 0 type errors, 0 clones; the four affected test files pass. Full `npm test` not rerun by me (implementer reports 2525 passed).
9. INVARIANTS A1-A3: path match only, test-only change; hold.

## Checks done
- Mutation: removed `if (hold !== undefined) await hold` in the helper; "holds a get on the promise beforeRead returns" failed. Reverted; worktree clean.
- Helper does not statically import `@vercel/blob` and does not import production store code. Error classes injected.
- Doc claims in the helper and `counterBlob` comment match the code. No ticket ids or factory pointers in shipped files.
- jscpd: the helper falls under the `*test-helpers.ts` pattern; 0 clones.
- Convention: helper style matches siblings (`test-helpers.ts`); per-file semicolon/quote style kept in the named-store test.

## Spec gaps
None.

## Bot reconciliation
No `reviewBot` CLI or rules file configured; skipped.

## Non-blocking notes
- Single-await guarantee has no test (cannot fail on an added await); the parallel-bump test stays symmetric under it. Could be pinned later by counting microtask ticks, but not required.
- UI inspection: not applicable (no UI diff). Checklist section "AoE4 build order" UI items do not apply; `next build` not run (test-only diff).

## Coverage
Reviewed all five changed files in full. Not reviewed: full `npm test` (not rerun), `next build`.
