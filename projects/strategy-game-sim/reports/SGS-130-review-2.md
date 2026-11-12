# SGS-130 review 2

- Branch: `sgs-130-blob-landed-write-retry-cap`, tip `fc011d5`, delta from `0144aca` (the tip review 1 bounced)
- Mode: delta, text-only rework
- Verdict: **APPROVE**

## Check

`git diff 0144aca..fc011d5` touches two files and nothing else: `ARCHITECTURE.md` (the one storage row) and `lib/aoe4-build-order/blob-build-store.ts` (the two comment lines above `BLOB_SDK_RETRIES`). No code or test changed.

1. `ARCHITECTURE.md:24`: the new text is the replacement from review 1, finding 1, character for character. Every fact listed as kept survives: the three triggering methods, the fresh read, `JSON.stringify` text equality, the lost-response rationale, the value 1, set only when unset or empty, default 10, an existing value is kept. The corrected facts are in: the per-method outcomes replace "the put error decides the outcome", and the retry count now applies to `put`, `head` and `del` with `get` making a single request. Review 1 checked these outcomes against `blob-build-store.ts` and the SDK 2.9.0 source, and no code has changed since.
2. `blob-build-store.ts:9-10`: the comment is the replacement from finding 2, verbatim. It keeps the `process.env` read on each call, default 10, and the `bumpCounter` multiplication. It corrects "every request" to "put, head and del call (get is not retried)".

Both findings are resolved. The rest of review 1 stands unchanged: acceptance criteria 1-10 and 13 pass, criterion 11 now passes, criterion 12 stays unverified (it needs owner credentials), and invariants A1-A3 hold with S1-S3 not touched.

## Carried forward, not blocking

- The `design/M9.md` "SDK retries" rule and the reason for owner decision 4A assume `get` retries. In the SDK it does not. This is a design text correction for the manager or designer, and the code does not change.
- The non-blocking notes in review 1 (the third fresh read in `ARCHITECTURE.md`, the live test's probe `put` running before the cap is set, the deterministic-double undercount) are unchanged.

## Coverage

Reviewed only the delta diff. I ran no tests, because the delta has no code change.
