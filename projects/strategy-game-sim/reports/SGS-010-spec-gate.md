# SGS-010 spec gate

Verdict: NEEDS_SPEC (one gap, closable by the ticket author without the owner)

Checked against 96d2602.

## Gaps

1. Acceptance criteria, mutation check (criterion 3): not satisfiable as written. An implementer would guess a mutation or fail the criterion.
   - The test keeps only `status 400` and `expectNoBattle` (which returns early on non-JSON bodies and, for JSON bodies, checks only for no `rounds` or `outcomes`).
   - With `bodyParser: false`, `req.body` is undefined in `pages/api/fight.ts`. `validateFightForm` then returns `request body must be a JSON object` and the handler sends a 400. The fixed test still passes. So the named mutation does not fail it, and "before the fix the same change leaves it passing" is equally true after the fix.
   - A Buffer body distinguishes the paths only if the test asserts the plain-text `Invalid JSON` body or the absence of a JSON `error`. The ticket forbids that assertion and assigns it to the contract spec.
   - Proposed fix, pick one:
     a. Drop the mutation criterion. Replace it with: "the request reaches the server as the unmodified bytes `{"attack-regs":`; the implementer verifies this once (for example, a temporary log of the raw body or content-length of 15, or a one-off check that the server answers the plain-text `Invalid JSON` body) and states how". Update Context so it no longer claims the test would fail if the parser path broke. The contract spec owns that.
     b. Keep the mutation criterion and add a cheap assertion that is not the exact text, for example `expect(await response.text()).not.toContain('request body must be a JSON object')`. This fails when the handler's shape rejection fires. State that this is allowed despite the "do not assert Invalid JSON" line.
   - Option b makes the test actually fail for a real reason (Tests rule in common.md). Recommended.

## Other checks (pass)

- Grounded scope: the test `malformed JSON runs no battle` exists in `body shape` (line 153) and uses `postRaw`. The `postRaw` signature is `(request, body: string | Buffer, contentType)`. The empty-body test already uses `Buffer.alloc(0)` with the Playwright comment the ticket cites. The contract spec has the malformed Buffer test with exact `Invalid JSON`. The handler shape message matches the ticket. The openapi 400 description mentions `Invalid JSON`.
- Open questions: none. CONTEXT.md Decisions agree ("Malformed JSON keeps Next's plain-text 400").
- Invariants: adjacent to none that matter (the test file is outside the INVARIANTS paths). The ticket says "No INVARIANTS.md regressions", and none are in play. W-series and S3 are untouched.
- Contracts: no new names. Depends-on is none, which is correct.
- Size: about 4 lines. Diagrams: not triggered. LESSONS.md (repo and project): empty.
- On merge: none, correct.
- Risk: low is correct (test-only, one file; no criticalPaths or strongModelTriggers hit).

## Notes

- Scope says "same wording idea as the existing comment"; it is fine. Suggested comment: "Playwright JSON-encodes a non-JSON string body, so send a Buffer to reach the parser."
- Criterion 1 is observable only by reading the diff. Fine for a reviewer.
