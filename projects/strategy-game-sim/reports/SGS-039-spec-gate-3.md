# SGS-039 spec gate 3

Verdict: NEEDS_SPEC (one small gap, no owner input needed). The new test-split wording is consistent and testable.

## Verified
- Every test named in the split exists on sgs-038-aoe4-depletion-engine (93a1e2b) under the quoted title. That covers the four default-amount tests (simulate-depletion.test.ts, validate.test.ts), the five unit tests to pin, and `pinned timelines` (4 tests).
- The split is complete and has no overlap: 4 tests take new values, 5 unit tests plus 4 depletion-spec requests plus 4 timelines tests pin six nulls, and the OpenAPI example takes the defaults. Files that need the pin: build-move.acceptance, research.acceptance, research, simulate, plus the two specs. That is more than three, so the shared `test-helpers.ts` value is required and is consistent with the earlier "three or more files" sentence.
- Seam-name count: it is 12 on the branch, and SGS-038 (13) and SGS-042 (`accrueWait`) each add one. "Rises by one relative to the count when this ticket starts" is unambiguous.
- ENG 1TC criterion: it has 24 steps and start rally gold. The last non-reaction step starts at 508 s, before sheep runs out (~783 s). The basis is recorded in SGS-040.
- `trigger?.kind === 'time'` is at simulate.ts:636 on the base, so "1 line before, 0 after" holds. The `waitBreakdown` single-writer grep and the `\b(3000|...)` grep are clean on the base.
- OpenAPI counts: Trigger oneOf 2, reaction on 0 of 6 BuildStep variants, and 0 `ResourceKind` refs match the criteria. Both stale description strings exist.
- Contracts match design/M3.md (`triggerWakeAt(trigger, state, income)`, the bank wake rule, the extension-point row). Open questions: none. Risk high is correct (criticalPaths symbols `offerSteps` and `nextWake` change). Diagram present.

## Gaps
1. `docs/aoe4-build-order.md` Scope and the docs-grep criterion - they name main-era wording that the SGS-038 base has already rewritten, so two stale statements go unnamed.
   - Scope says "Line 25 'Resources are infinite'". On the SGS-038 base, line 25 is now a different sentence, and line 27 says "no amount ships in the data yet, so every node is infinite unless a request sets one".
   - Line 345 in the Depletion section says "No amount ships yet, so a ref is finite only when the request sets `nodeAmounts`".
   - Both become false when this ticket lands. Neither is in Scope, and the docs criterion (`Resources are infinite|At most one step is armed|is not .time. or .villagers.`) finds only 2 lines on the base, not 3. An implementer would likely fix only what the grep catches and leave both false statements.
   - Fix: reword the line-25/323 bullet to "the finite-node paragraph at the top (`no amount ships in the data yet`) and the Depletion section (`No amount ships yet`): the six amounts now ship by default". Add `no amount ships` (case-insensitive) to the docs criterion, which finds 2 lines on the SGS-038 base and 0 after. State that the "3 lines on main" count is 2 on the SGS-038 base.

## Notes (non-blocking)
- Scope's earlier "Tests that rely on infinite nodes" paragraph says moved tests are fixed "not by changing expected numbers". The later split carves out the four default-amount tests. Add "except the tests of the defaults listed below" to the first paragraph.
- The four default-amount tests allow either new expected values or an `editGameData` with no `amount`. Fixing one choice per test would remove a small guess.
- The depletion spec title on the branch is still "depletions and warnings until the engine reports them". The ticket's "depletions and warnings with every node infinite" comes from the SGS-038 re-spec 3 rename, which is not on the branch yet. The implementer should rebase onto the post-respec SGS-038 before the spec names resolve.
- The ENG 1TC criterion lists only sheep and gold. ENG 1TC starts on gold and rallies to sheep, then wood, so berry/deer/boar/stone are not expected to run out. Say so, or the "no step moves" claim rests on that unstated assumption.
