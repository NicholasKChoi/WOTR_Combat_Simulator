# SGS-130 spec gate 1

**Verdict: READY**

Read at origin/main. SGS-127 and SGS-128 have no branch yet, so I took their behavior from their ticket files.

## Checks

- **Grounded scope.** `blob-build-store.ts`, `create`, `bumpCounter`, `replaceNamed`, `exists`, `read`, `build-store.ts` ("never retries" on `replaceNamed`), `named-build-store.acceptance.test.ts` and the ARCHITECTURE.md storage row all exist. The new files (`blob-build-store.live.test.ts`, `test:blob-live`) are marked new.
- **Unverified assumption on retries, checked in `node_modules/@vercel/blob` 2.9.0.** `getRetries()` reads `process.env.VERCEL_BLOB_RETRIES || "10"` on every API request. The value feeds async-retry `retries`, so `1` means two HTTP attempts. A 412 and a 404 reach `bail`, so they are not retried. `unknown_error`, `service_unavailable`, `internal_server_error` and network errors are retried. The ticket's assumption list is accurate, and the "unset or empty" condition matches the SDK's `||`.
- **Contracts.** `BLOB_SDK_RETRIES = 1`, `landed(key, json)`, the `read(key, true)` fresh read, and the live-test gate, credentials, keys and message all match `design/M9.md` C10 and the "Blob store (M9.10)" Behavior rules. The ticket Scope outcomes match the table row by row.
- **Ordering.** The design's ordering constraint (SGS-127 before the M9.10 store ticket) is covered by Depends-on. SGS-128 is also a dependency, so the new tests meet the stricter jscpd gate.
- **Criteria.** Each criterion is behavioral and can fail. Text-equality versus deep-equality is tested explicitly. No stale counts or line numbers appear. The `landed`-throw case is covered. The call-once-with-the-caller's-etag criterion is covered.
- **Existing tests.** Scope states the rule and requires the implementer to list edits. I confirmed the rule is needed: the `replaceNamed` it.each asserts `expect(get).not.toHaveBeenCalled()`, and the `bumpCounter` "contended after three" and "retries a create" tests use `mockResolvedValueOnce` on `get`, so the extra `landed` read would consume those values.
- **Risk.** `high` is correct (a strongModelTriggers item: shared mutable state and write ordering).
- **Docs.** The ARCHITECTURE.md row text is stale as stated. A grep of docs and lib finds no other retry or conflict statement. The `build-store.ts` comment "never retries" stays true.
- **On merge.** Both BACKLOG bullet prefixes match the text in BACKLOG.md (lines 26 and 29).
- **Input validation, dependencies, diagram.** Not applicable (no new trust-boundary input), stated, and the diagram is present. Size is about 60 LOC.
- **Open questions.** None.

## Notes (non-blocking)

1. The existing-tests bullet lists "`create` reports `exists`" as an example of a changed test. The current test "reports exists when put fails and the blob is there" keeps its expected value, because the default `get` mock returns null and `landed` is false. Only the `replaceNamed` "after one put and no read" assertion on `get` changes. The rule as written still works.
2. The ticket says the env var is set when "unset or empty"; C10 says "when it is unset". The ticket's wording is the better one, so consider aligning the design text.
3. If the live run shows that `put` with `ifMatch` on a missing key creates the blob (the BACKLOG worry), the live test's "creates no blob" assertion fails. The ticket's follow-up covers only an unmapped error class, not that outcome. This is an edge, human-gated case. The implementer should treat it as a blocker to report on the PR instead of a mapping change.
4. SGS-127's Scope ("a read made for a compare-and-swap") is ambiguous about whether the weak-etag throw and the uncompressed request apply to every `read(key, true)`. SGS-130 depends on `landed`'s read going through that path, and it says so. Confirm at integration that SGS-127's `read` does not gate this behavior on `getNamed` or `bumpCounter` only.
5. SGS-127 and SGS-130 both edit the same ARCHITECTURE.md storage row, so the second to merge will have a text conflict.
