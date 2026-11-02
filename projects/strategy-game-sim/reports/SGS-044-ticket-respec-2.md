# SGS-044 ticket re-spec 2
Fixes for spec-gate-1:
1. Blocking: new Scope item 7 adds `markers: []` to the `result()` literal in components/apps/aoe4-build-order/result-series.test.ts (the only typed SimulationResult literal outside lib/, checked against main). Out of scope now carves that one line out of `components/**`. The tsc criterion names the file.
2. "Deep-equal with push lines removed" criterion is now: existing unit tests stay green with no assertion edits, and the only existing-test edit is that `markers: []` line.
3. The `researchMarker(` grep criterion now says it counts call sites (exactly one; the import line has no paren; finds none on main today).
Grep criteria re-run on main: ages.push 1 (simulate.ts:333), researched.add 1 (research.ts:27), researchMarker( 0, docs `markers` empty.
Open questions: none.
