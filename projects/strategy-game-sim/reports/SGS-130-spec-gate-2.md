# SGS-130 spec gate 2 (after Re-spec 1, Q59 A)

**Verdict: READY**

Read at the local branch tip `sgs-130-blob-landed-write-retry-cap` (stack tip 73693ef) for the code, and `design/M9.md` C10, Behavior rules "Blob store (M9.10)" and owner decision 7 for the contract.

## Checks

- **Grounded scope.** `blob-build-store.ts` on the branch has `landed` called in `bumpCounter`'s catch (`if (await landed(key, json)) return update;`), which is the one line the rework removes. The test names the ticket quotes exist on the branch: the `it.each` "returns the update after one put for %s when the read-back shows the JSON it sent", the "Each failed put is followed by a read-back" comment, and "the save rate counter when its Blob write fails" in `blob-lost-writes.acceptance.test.ts`. The ARCHITECTURE.md row on the branch says "(in `create`, `bumpCounter` or `replaceNamed`)", as Scope says.
- **Criteria can fail on the branch code.** The no-read-back criterion fails today: a 412 with the same JSON stored returns the update via `landed`. The parallel-bump criterion fails today: the loser's `landed` sees the winner's identical JSON and returns the same update, so the "updates differ" and "count rises by two" assertions fail. The route-level criteria are reachable with the existing fake: a "retried" or "dropped" fault on a first save gives `exists(key)` true, then the next attempt re-reads and counts again, so the stored count is 2 for one accepted save ("at most one" holds). A dropped response on an update rethrows, which the route answers 503. Losing every attempt gives `contended`, and `takeSaveSlot` maps that to 429 with `Retry-After` 1.
- **Contracts and decisions.** Scope and criteria match C10, the rules-table rows for `bumpCounter` (put throws, parallel saves, lost response) and decision 7. The `landed` and `create` outcomes are unchanged from gate 1 and still match the table. No open question remains, and Q59 is no longer an undecided point in the body.
- **Rule for existing tests.** Scope states the rule (changed behavior gets a new expected value, others keep theirs) and gives examples marked "the rule decides". It lists no closed set. Good.
- **Docs.** The ARCHITECTURE row, the `BLOB_SDK_RETRIES` comment, the `landed` comment and the `build-store.ts` "never retries" comment are all in Scope. The row on the branch is the one that is now untrue for `bumpCounter`. The comment above `landed` in the branch code does not mention counters, so it stays true.
- **Risk, size, On merge, diagram.** `high` stays right (shared state and write ordering). LOC drops to about 55 or less, and the change is smaller than that since it removes a call. On merge is unchanged and valid. The diagram matches the new flow (read, act, record, with `bumpCounter` going to the next attempt).
- **Unverified assumptions.** The list covers the retry env, the `get` single request, the lost-response and 412 behavior, and `ifMatch` on a missing key. The new counter rule relies only on the SDK retry answering 412 or "already exists" after a landed write, which is listed.
- **No throwaway work.** No other open ticket rewrites `bumpCounter` or the counter tests (checked against the ticket's Depends-on set only; SGS-131..140 are not touched by this file).

## Notes (non-blocking)

1. The ticket still carries the full "Rework 1" section with an exact ARCHITECTURE sentence that names `bumpCounter` in the read-back clause and ends "Change nothing else". Scope says it is superseded, but an implementer skimming the bottom of the file could copy it. Consider striking the sentence or adding "(superseded by Re-spec 1)" to that heading.
2. The wording of the parallel-bump criterion ("give one update after one put and one retry") is dense. The testable properties are: the two returned updates differ, the stored count rises by two, and the loser made a second `put` after a fresh read. The implementer can read that from the rest of the criterion.
3. Notes 2 to 5 of gate 1 still apply: the "unset or empty" wording versus C10's "unset", the live-test outcome where `ifMatch` on a missing key creates the blob (report as a blocker on the PR), the SGS-127 `read` applying to every fresh read, and the ARCHITECTURE row conflict with SGS-127.
