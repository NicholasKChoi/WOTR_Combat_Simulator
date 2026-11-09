# SGS-102 spec gate, pass 3

**Verdict: READY**

Checked against origin/main 1e6d6c2 (git show / git grep), design/M6.md C6 and the behavior tables, the SGS-100 ticket (dependency), spec-gate-2 and ticket-3 reports.

## Pass-2 gaps

1. Contradicting greps: closed. The first grep excludes `acceptance/aoe4-auto-run.spec.ts`; the `fetch(` rule is now "no non-test file other than `simulate-client.ts`" (`':!*.test.ts'`). Both hold in the end state.
2. Pre-controller state of `useAutoRun`: closed. First paint is computed in the hook from the args with the controller's own `textToBuildOrder` and `durationError`; the other fields are null or empty; the controller is built in a mount effect, state copied from `getState()`, cleanup disposes. This matches design C6 "Ownership" word for word. The first-paint criterion and the hydration-error assertion in "first load runs once" cover it.
3. Select setter: closed. The handler calls `setSelected`, `editText(build.text)`, then `flush({...})`. An unknown name does only `setSelected`. `editText` exists on main (page line 174). An open-rows criterion is added.

Pass-2 notes are also folded in: paused clock for undo, the 500 ms constant allowed in docs, scroll read via `expect.poll` or one `evaluate`.

## Checks

1. Grounded: page symbols, `selectBuild`, `onSelectedChange`/`onTextChange`, `scrollIntoView`/`scrollMarginTop`, local `fetch(`, `stale` in `results.tsx` and CSS, and the docs phrases (lines 855-965) exist on main. New files are marked new.
2. Criteria are observable. The existing-test rule is stated (rule 6). No stale pins; the "15 specs" is qualified and backed by a grep rule.
3. No open questions.
4. Invariants S3, A3, S1 named; none contradicted.
5. Contracts match C6, the status table, and SGS-100 (`AutoRunDeps.post` adapter, `inputs.durationSeconds`, `readRejection`, failure messages).
6. Dependency on SGS-100 stated; ~200 LOC business logic.
7. Diagram present.
8. Lessons: nothing walked into (scroll-read note applied).
9. Decisions: body agrees with the design (tabs, scroll, pin, timeline, OD-6, OD-7).
10. On merge: none is correct.
11. Risk high is correct.
12. Docs: docs paragraphs, `results.tsx` alert, and CSS are in Scope. The docs grep `\bRun\b([^-]|$)` matches only lines the ticket rewrites (855-965 on main).
13. Input validation: no new trust-boundary input.

## Notes (non-blocking)

- First-paint criterion says "page load with JavaScript disabled or the first client render". Two checks joined by "or"; the implementer should do the JS-disabled load (it proves the prerendered HTML) and keep the hydration-error assertion.
- Compute the first-paint conversion in a `useMemo` keyed on text and catalog so each render does not reconvert; not required by the spec.
- The grep criteria were not executed against a built end state (SGS-100 unmerged); they were read for consistency with Scope only.
