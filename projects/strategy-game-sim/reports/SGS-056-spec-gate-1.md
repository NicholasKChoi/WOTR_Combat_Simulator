# SGS-056 spec gate 1

Verdict: NEEDS_SPEC (one small docs gap; everything else checked out)

Checked on origin/main d5c2549 (ran `tsc --noEmit --strictNullChecks`): 177 errors; per-file counts and the
non-test error lines match the ticket exactly. Contracts, Decisions, invariants (A3, W2), risk (high),
dependencies, diagrams, lessons (none apply) and open questions (none) are fine.

## Gaps
1. Scope 5 (Docs) - says "Expect none", but `ARCHITECTURE.md` line 11 reads "TypeScript 7 with `strict: false`".
   After this ticket that sentence is misleading (strictNullChecks is on). An implementer would either skip it
   (following "expect none") or guess the wording. Fix: name `ARCHITECTURE.md` line 11 in Scope and say to
   reword it to "`strict: false` with `strictNullChecks: true`"; drop "Expect none". ARCHITECTURE.md is also a
   REPO.md styleSource.

## Notes
- Counts will shift if sibling M4 tickets edit these files first; the ticket already says re-measure.
- Many `!` in tests may repeat identical lines; run `npm run lint:dup` early (threshold 0 per design).
