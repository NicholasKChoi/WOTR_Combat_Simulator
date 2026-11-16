# SGS-167 spec gate 1

**Verdict: READY**

Read at origin/main after `git fetch origin`. No scratch checkout was needed.

## Checks
- Grounded scope: `lineEndYs` is at `acceptance/aoe4-chart-views.spec.ts:36`, and `plotPoint` is in `acceptance/helpers.ts`. I did not find `settledScrollY` in helpers.ts's first 150 lines, so it is probably further down or elsewhere. It only serves as a style pointer.
  - pin-compare: the two `box()` reads at line 272 are not under poll. The pair at lines 357-358 is inside `expect.poll`. Both match the ticket.
  - chart-views: `drawn` is called separately at lines 305 and 311-312.
  - gathered-resources: line 113 compares two `getAttribute('d')` calls.
  - compact-view: lines 169-170 are two evaluates (legend bottom, textarea top).
- Testable criteria: they are observable. They cite relations and "the rule", not counts or lists. The "not a closed list" wording covers other sites.
- Open questions: none. Invariants: none, and this is test-only code under `acceptance/`.
- Dependencies and size: none, about 60 lines. TASK-GRAPH has no other open ticket (SGS-168 is a combat doc) touching these specs, so there is no throwaway work.
- On merge: the REPO.md exemplar `shows` text cites `lineEndYs` in the spec (REPO.md line 70), and the ticket names that update. The only other `lineEndYs` references are in the acceptance specs.
- Risk is low and correct: test code only, no `criticalPaths` symbol.
- Unverified assumptions: none is right, because no external service is faked.
- Input validation: not applicable.

## Notes (non-blocking)
- Unlisted sites the "same rule" clause should catch: `acceptance/aoe4-build-order-pin-compare.spec.ts:421-425`, where the label rect and each tick rect are read in separate `boundingBox` calls and then compared for overlap. Also check the `acceptance/aoe4-split-scroll.spec.ts` and `acceptance/aoe4-build-order-step-table` reads, which LESSONS names as flaky.
- The new general reader must be used by at least one converted site (the pin-compare widths and compact-view rects fit). Otherwise it is dead code.
- The pin-compare 1200 s test (lines 272-275) is not under poll today. Converting it to one evaluate is fine and does not need a new poll, since the ticket forbids changing what a test asserts.
