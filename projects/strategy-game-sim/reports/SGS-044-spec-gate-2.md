# SGS-044 spec gate 2

Verdict: READY

Gap from gate 1 is closed. Scope item 7 adds `markers: []` to the `result()` literal in
`components/apps/aoe4-build-order/result-series.test.ts`, and Out of scope carves that one line out of `components/**`.
I re-checked on main: that file (line 6) is the only typed `SimulationResult` literal outside `lib/`. The `run()` helpers in
`lib/**` test files only return `simulateBuildOrder` output. `ages.push` has one non-test site (`simulate.ts:333`),
`researched.add` has one (`research.ts:27`), and `docs/aoe4-build-order.md` has no `markers` today. The grep criteria hold.

The other checks passed in gate 1 and nothing in the re-spec touches them: grounded scope, design match, testable criteria,
invariants A1/A3/S3, risk high, size about 70 LOC, diagram, On merge none, docs scope, open questions none.

Notes (non-blocking)
- SGS-037 edits the same literal; the ticket says so and each ticket adds its own field, so a merge conflict is possible but trivial.
