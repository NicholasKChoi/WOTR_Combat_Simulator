# SGS-010 spec gate 2

Verdict: READY

Checked against 96d2602.

## Prior gap
Closed. The ticket now adds `expect(await response.text()).not.toContain('request body must be a JSON object')`
and allows it despite the "no exact Invalid JSON" line. Walked through both mutations:
- `bodyParser: false`: `req.body` is undefined, `validateFightForm` (fight.ts:66-67) returns the shape error, the handler
  sends `{"error":"request body must be a JSON object"}` 400. Status and `expectNoBattle` pass, the negative assertion fails. Falsifiable.
- Pre-fix string body: Playwright JSON-encodes the non-JSON string, so the parser accepts it and the handler returns the same shape error. The negative assertion fails. Falsifiable.
- Fixed test, unmutated: the parser answers plain-text `Invalid JSON` and the assertion passes.

## Other checks
- Grounded: test at validation spec line 153 in `body shape`; `postRaw` signature `(request, body: string | Buffer, contentType)`; `Buffer.alloc(0)` comment precedent at line 149; fight.ts message and handler exist.
- Criteria testable; open questions none; CONTEXT.md Decision on malformed JSON agrees.
- Invariants: file is outside INVARIANTS paths; fight.ts is touched only by a temporary reverted mutation (W-series untouched). Fine.
- Contracts: no new names; Depends-on none, correct. Size about 5 lines. Diagrams not triggered. LESSONS empty. On merge none, correct.
- Risk low is correct (test-only, no criticalPaths, REPO criticalPaths empty).

## Notes
- Criterion 5 says "no other test file changes"; the temporary fight.ts edit must be reverted, which criterion 4 says ("run once and reverted"). Reviewer should confirm the final diff is one file.
- Implementer should run the mutation under `npm run acceptance` and report the failing assertion lines.
