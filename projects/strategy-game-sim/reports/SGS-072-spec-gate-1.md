# SGS-072 spec gate 1

Verdict: NEEDS_SPEC (one small gap, no owner input needed)

## Gaps
1. Depends on / Acceptance criteria - the header and TASK-GRAPH row list only SGS-067 and SGS-069, but Scope 6 edits
   `results.tsx` "after SGS-070 and SGS-071", and the criterion `git grep -n "pinnedMarkers" -- results.tsx` finds three
   lines only holds once SGS-071 has merged. The ticket claims "the merge order on the page is enforced by SGS-067", but
   SGS-067 depends only on SGS-066, SGS-070 on SGS-056, SGS-071 on SGS-070; nothing orders SGS-072 after 070/071. A scheduler
   could run it first, and the implementer would then have no `pinnedMarkers` lines to keep and a failing criterion.
   Fix: add SGS-070 and SGS-071 to Depends-on (header and TASK-GRAPH row; SGS-073 already depends on all), and drop the
   claim that SGS-067 enforces the order.

## Checks passed
- Grounding (origin/main d5c2549): build-input.tsx (useState import, `selected` state, setSelected at lines 1, 19, 22: the
  3-line grep holds), compare-panel.tsx, results.tsx (3 SeriesChart calls), page state (`resultText`, `pinned`),
  docs/aoe4-build-order.md 814-820 ("survives later runs" at 816), `formatMinSec`, `SimulationResult.durationSeconds`
  exist. `textToBuildOrder` and pin-storage are new/in earlier tickets as stated.
- Contracts match design C13, C8, C11 and SGS-069 (which defers `pinnedName`/`alreadyPinned` to this ticket).
- Open questions none; design decisions (race, bad storage, name) agree with the design rules. Invariants S1, S3, A3 named
  and not contradicted. Diagram present. Risk standard is consistent (new contract has exact names in design, under 250 LOC).
- Existing-test rule is stated as a rule, not a list. Docs in Scope with greps. On merge none is fine.

## Notes
- Spec 1 "After a run, pin-run is enabled ... (a different duration ...)": say explicitly the run uses a changed duration;
  a run at the default 1200 after reload equals the pin and stays disabled.
- Existing-test list names pin-run clicks in m3-flow.spec.ts:26 and aoe4-build-order.spec.ts:461; the implementer should
  check them first (they may click Pin with the shown run equal to an existing pin).
