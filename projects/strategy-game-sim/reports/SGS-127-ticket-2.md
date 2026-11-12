# SGS-127 ticket re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-127-blob-strong-etag.md
Lint: clean.

## Summary

SGS-127 "Read Blob etags uncompressed so named-build version saves stop answering 412" (Bug, aoe4-build-order, high risk, ~40 LOC, depends on none). Re-spec from spec-gate 1 (NEEDS_SPEC, two gaps, three notes):

- Gap 1 (no Unverified assumptions): added the field. It lists that an identity read returns the strong etag, that `put({ifMatch})` accepts it, that the delivery and put-side hashes match, that undici sends a caller-set `accept-encoding` (the SDK side is confirmed: @vercel/blob 2.9.0 `get()` spreads `options.headers` last), and that the counter blob keeps a strong etag. Scope now has a stop condition: if the preview save answers 503 with the weak-etag log, do not merge; the ticket goes back to needs_spec for a different etag source. The preview criterion says it is the only check of these assumptions.
- Gap 2 (guard scope): the header and the weak-etag throw are keyed on `read`'s existing `fresh` flag, which is true for the CAS reads (`getNamed`, `bumpCounter`, and SGS-130's `landed`). The non-fresh `getBuild` gets no header and no throw. A new criterion requires a test that `getBuild` returns its value on a weak etag and sends no headers option. Scope keeps one shared fresh `read` path so SGS-130 inherits both.
- Notes folded in: the weak-etag error names the key and says the etag was weak, never the body (new criterion). The two 412 log lines name the build id and never the edit secret (criterion 6 extended). Tests reuse the `found(value, etag)` helper so the weak etag sits in `blob.etag`.

Diagrams: none (single component, outside the core control loop).
Open questions: none.
Overlap: none. SGS-130 builds on this ticket's end state, and its `landed` uses a fresh `read`, which matches the rule chosen here.
