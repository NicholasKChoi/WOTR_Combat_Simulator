# SGS-151 spec-gate report 3

Base read: origin/main (fetched). SGS-142 read at local branch sgs-142-replace-named-missing-key-conflict. Verdict: **READY**. Risk `low` confirmed.

## Prior gaps (report 2)
1. Etag form: closed. Scope states `"e<n>"` strong etags, `W/` prefix in weak-read mode, and explicit-etag seeding. A criterion pins the form in the fake's own test. The lost-writes test asserts `/^"e\d+"$/` at base, and `counterBlob` already uses `"eN"`. The named-store test only checks the etag is a non-empty string and differs between writes, so it holds with the new form.
2. Depends on: closed. `Depends on: SGS-142`. TASK-GRAPH has SGS-142 as needs_review, so the dependency is stated. At the SGS-142 tip, `blob-build-store.test.ts` still has `counterBlob` (one use in the bumpCounter describe), and the `replaceNamed` rows use per-test `mockResolvedValue`, as the ticket says.

Report-2 notes are also covered: the single-await rule, the `*test-helpers.ts` naming (the tests jscpd pattern includes `**/*test-helpers.ts`), and the reset and accessors.

## Checks
- Grounded scope: the three fakes and the sibling support modules exist as described.
- Criteria are behavioral. The only search-like item is "no production file changes", a diff scope check, which is fine.
- No open questions. Invariants A1-A3 are path matches only. No criterion contradicts them.
- No overlap with open tickets: no other ticket in the graph edits these three files besides SGS-142, which is a declared dependency.
- No contract, validation, or doc impact. Unverified assumptions `none` is right, since the fake only mirrors rules the store tests already encode.

## Notes (non-blocking)
- Create over an existing key without `allowOverwrite`: all three copies throw a plain `Error('This blob already exists')`, and the store treats it through `exists()`. The shared fake should keep a plain `Error` (not a typed SDK error) so store behavior does not change. The ticket leaves this to the implementer, which is fine, and the fake's own test covers the refusal.
- `counterBlob`'s event log records the failed put by body count, so the layered log must wrap the installed mock without adding an `await`. The ticket's single-await rule covers this.
