# SGS-039 ticket re-spec 3

Ticket: tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md (id, file and graph row kept). Input: reports/SGS-039-spec-gate-1.md (NEEDS_SPEC).

## Gaps resolved
1. "Depletion is on by default" criterion (respec 3): ENG 1TC at 3600 s reports `sheep` and `gold` run out and no `gold#2` entry (ENG 1TC does not name `gold#2` until SGS-040). "`gold#k` starts at 4000" and the `nodeAmounts: { gold: null }` case are tested with an order that names `gold#2`.
2. `data/aoe4-build-order/README.md` added to Scope. "Prebuilt builds" (`:36-40`) is rewritten to the bar as checked after this ticket: parts 1-3 at 1200 s and 3600 s, gold parts 4-5 at 1200 s, with no ticket ids in the file. "Known data gaps" (`:70-71`) says sheep is a finite node with an owner-supplied, unverified total and that herding is still not modeled. New criterion: `git grep -n "never depleted"` and `git grep -n "keep running by 3600 s"` on the README each find 1 line on main f078c11 (I ran both) and must find 0 after.

## Notes folded in
- `triggerWakeAt(trigger: Trigger | undefined, state, income)` returns `null` for `undefined`, so `nextWake` needs no guard. Its unit-test criterion covers that case.
- ENG 1TC unchanged criterion now carries its basis: last non-reaction step at 508 s, sheep runs out near 760-770 s, gold deposit 1 near 3305 s.
- SGS-042's horizon `waitingOn` and `step-stuck` tests are edited in place in this diff ("cursor step" now means the first unstarted non-reaction step), and the reaction cases are added to those same tests.

## Criteria checked on main
- `git grep -n "never depleted" -- data/aoe4-build-order/README.md`: 1
- `git grep -n "keep running by 3600 s" -- data/aoe4-build-order/README.md`: 1
- `git grep -nF "trigger?.kind === 'time'" -- lib/aoe4-build-order/simulate.ts`: 1

## Follow-ups for the manager (other tickets)
- SGS-040: when it extends bar parts 4-5 to 3600 s, it must also change the README "Prebuilt builds" sentence from "at 1200 s" to both horizons. SGS-040's Scope does not list the README today. SGS-039's Scope names this hand-off.
- SGS-050 (`:49`): its note assumes "SGS-039's docs" rewrote the README bar sentence. That is now true, so SGS-050 only adds its entry and does not need to rewrite the paragraph.

Open questions: none.
