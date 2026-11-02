# SGS-061 spec gate 1

Verdict: READY

Checked against origin/main d5c2549, the M4 design (C4, Behavior rules route rows, Docs rows), CONTEXT.md, INVARIANTS (S3, A3), and SGS-057/059/060/075.
- Scope grounded: route, api.ts (`text?: string` at line 12), openapi (oneOf, `text`, version 1.0.0, 11 old strings, examples exactly-one/pasteSyntax/pastedStep) all match the ticket's "today" claims.
- Names match design (`checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`, `MAX_REPORTED_ISSUES`). SGS-075 temporary branch removal is stated in Scope and criteria.
- Criteria are observable (jq, grep, mutation check); rule for existing tests stated; Risk high is correct (public contract break); Docs scope is thorough; Open questions none; Diagram present.

Notes (non-blocking)
- Criterion 7 says "6 hits on origin/main" for the `exactly one of|text: null|send exactly` grep; I count 5 lines (2 in docs/aoe4-build-order.md, 3 in openapi.json). The end state (no output) is unaffected.
- `git grep` criteria on SGS-075-era route lines cannot be run on origin/main yet; they depend on the dependency chain merging first.
