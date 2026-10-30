# SGS-011 spec gate 2

Verdict: NEEDS_SPEC (one small gap, not owner)

Verified against 96d2602. File, grep hits, line numbers (openapi.json:6, spec-surface:26-27, caps:131-134, ARCHITECTURE.md:54-57), CONTEXT.md lines 22/34/77, INVARIANTS.md line 23, REPO.md lines 88-89 all match. Owner decision recorded (CONTEXT.md line 77). Risk high is correct (W1/W2 Paths, public schema file). Invariants named, no contradiction. No open questions, no dependencies, size ~0, no diagram needed, LESSONS empty. All four gaps of gate 1 are closed.

## Gaps
1. Acceptance criteria, AC1 - the grep count contradicts Scope - not owner. AC1 requires `git grep "models/army"` over acceptance/ etc. to find exactly one match (the caps spec URL). But Scope replaces the spec-surface assertions with one asserting the description does not mention `/api/models/army`. That assertion needs the literal string (`not.toContain('/api/models/army')`), so the grep finds two matches and AC1 fails as written. An implementer would either avoid the literal (obscure test) or drop the assertion. Fix: reword AC1 to "exactly two matches: the request URL in the 404 test in acceptance/fight-api-caps.spec.ts and the not-contain assertion in acceptance/fight-api-spec-surface.spec.ts; the caps test title does not contain the path".

## Notes
- AC2 curl check is fine; the caps test covers the 404 under `npm run acceptance`.
