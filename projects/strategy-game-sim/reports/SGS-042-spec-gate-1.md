# SGS-042 spec gate 1

Verdict: NEEDS_SPEC (two small gaps, no owner questions)

Checked: grounded scope (simulate.ts, research.ts, model.ts, docs, openapi, contract spec all read on main; the 5
`{ started: false }` sites, produce/build/move/research handler ranges, tests at simulate.test.ts:404/438, contract
spec line 324 all match), contracts (StepWait, StepStart, accrueWait, step-stuck text, sort rule match design/M3.md and
SGS-037/039), criteria testable, no open questions, invariants A2/A3 fit, risk high correct (lib/** critical path),
diagram present, size ~130, LESSONS files empty, On merge none is right.

## Gaps

1. Docs / scope (item 10, 8) - SGS-037 writes into docs/aoe4-build-order.md and the openapi `warnings` description
   that "both lists are always empty today". After this ticket `warnings` is non-empty whenever a step is stuck, so that
   sentence is untrue, but the ticket only says to "document step-stuck next to the warnings section". An implementer
   may leave the stale sentence. Fix: add to item 10 (and item 8 if the openapi description repeats it) "remove or
   reword SGS-037's 'empty today' statement for `warnings`; `depletions` stays empty until SGS-038", and a grep
   criterion (`git grep -n "empty today"` on docs finds nothing about warnings).

2. Dependencies / contracts (items 2, 4) - SGS-041 (rewrites `researchHandler` to `researchEntry`, drops the
   `entry.age > state.age` check, pays via `payCost`) and SGS-038 (re-keys `gatherers` by NodeRef and widens
   `move.count` to `number | 'all'`) are not dependencies of this ticket and edit the same handlers. The ticket
   describes only the main-tree research check and mentions only the build/availableAt rebase. Fix: state that whichever
   of 041/038/042 merges second rebases, and give the target-tree meaning: research `prerequisite` = no producing
   instance OR `researchEntry` returns undefined (041); move returns `villagers` only for a numeric `count` and never for
   `'all'` (design/M3.md StepWait table, 038); the villagers check uses `availableAt` (038). Alternatively add SGS-041 and
   SGS-038 to Depends-on if the manager wants a fixed order. Also re-anchor the `simulate.ts:683-685` and
   `research.ts:36-45` line cites by function name: on main the finalStatus loop is at 693-695 and they shift again after
   SGS-035.

## Notes (non-blocking)

- docs/aoe4-build-order.md line 38 and the "Ordering and triggers" paragraph (~143) say a step "waits until it is
  affordable and supply allows it"; not false, but could point to the new reasons table.
- `acceptance` criterion 125 (sum equals waitSeconds) relies on every wake being an event/sample instant; the
  ticket's accrual placement (just before `engine.time = next`) guarantees it. Good.
- Consider naming the ordering of `step-stuck` append versus 038's `warnings` fill (both go through the one
  `sortWarnings` call) in item 7 so the two tickets do not each add a sort.
