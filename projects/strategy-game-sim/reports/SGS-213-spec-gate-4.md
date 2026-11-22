# SGS-213 spec gate (report 4)

Verdict: READY

ticket-lint at origin/main: no errors, no warnings. Re-read the ticket after re-spec 1 and the base code (`annotation-popover.tsx`, `step-annotations.ts` `combineRuns`/`StepRun`, `build-text-editor.tsx` `AnnotationLine`).

## Gaps from report 2: closed

1. Viewports: both Scope and the first criterion now name `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, and the placement assertion is unconditional. The no-room fallback is covered by the unit test only. Closed.
2. Top alignment: the acceptance test scrolls a mid-list line to the viewport centre and asserts top within 1 px. The near-bottom case stays an inside-the-viewport assertion, and the clamp is covered by the unit test. Closed.
3. Repeated step: a unit test applies the predicate to `combineRuns` of zero-wait completed copies (false) and of completed copies whose total wait is above zero (true). It fails if the predicate is applied to a single copy. At base `combineRuns` returns status `completed` only when every copy is completed, and sums `waitSeconds`, so both cases are constructible. Closed.

## New checks: nothing blocks

- Grounded scope, existing-test impact, docs, invariants, risk (standard, no criticalPaths symbol), On merge `none`, unverified assumptions `none`: unchanged from report 2 and still hold.
- No criterion pins a stale count or list; the index-based test rule is stated as a rule with examples only.

## Notes

- In the predicate unit test, put the non-zero-wait copy second (or make the first copy zero-wait), so a single-copy (`copies[0]`) implementation gives a different answer than the combined run.
- Placement unit rows need anchor.left well left of the textarea's right edge, which criterion 3 already requires.
