# SGS-032 ticket re-spec 1

Ticket: tickets/SGS-032-aoe4-research-veterancy.md (rewritten in place; criteria tagged `(respec 2)`, appended `## Re-spec 2026-10-31 (2)`). Input: reports/SGS-032-spec-gate-1.md, SGS-030 and SGS-031 tickets, reports/SGS-031-spec-gate-1.md, design/M2.md "Research target" and "Auto-houses", 68e004a model.ts and docs.

## Blocking gaps folded in

1. Seam test. SGS-030 is not re-specced. SGS-031 drops `build`/`move` from the test and keeps `research`. SGS-032 removes the plain handler-less `research` assertion and replaces it with an equivalent check: save `stepHandlers.research`, delete it, assert a `research` step is `waiting` and the next step `not-reached`, then restore it in `finally`. No assertion is left that a real action has no handler. If SGS-032 merges first, it removes only the `research` part, and SGS-031 drops `build`/`move` on rebase and keeps the check. Any override of `stepHandlers.research` (for example SGS-031's "Reservation ignored" test) must restore the saved value, not `delete` it. A new criterion covers this.
2. Auto-house `populationPerSecond`. This is the third produced-unit lookup and it uses `resolveUnitEntry(order.unit, state)`. Demand is read per instant, so the current resolution is the right estimate. If SGS-031 lands first, SGS-032 changes that lookup in place. If SGS-032 lands first, SGS-031 calls `resolveUnitEntry` (from `./research`) on rebase. The Reuse criterion now has no `[0]` grep. Instead, `git grep -nE "byBaseId\.get\(([A-Za-z_.]*\.)?unit\)" -- simulate.ts houses.ts` must find nothing, and the `resolveUnitEntry(` count in simulate.ts must be 2 without SGS-031 and 3 with it.
3. Docs. Added a "Queues" Research target bullet and the criterion `git grep -niE "lowest-numbered" -- docs/aoe4-build-order.md`.

## Gate notes folded in

- Observing the target: a wrapper on `stepHandlers.research` calls `researchHandler`, records the instance whose `paid` grew, and is restored in `finally`. The `town-center` #2 idle case now uses `pause town-center` with `instance: 2` and `@0:30 research textiles at town-center`. The BuildOrder sets `start.rally`, and the ticket warns that textiles yields a `tech-effect-ignored` note.
- The unreached-age case has a starting `barracks`. The delay-and-tier case has enough wood.
- `researchNotes`: a `rejected` classification gives no note and does not throw.
- The wheelbarrow `completedAt` is stated for an idle mill.
- Dropped "SGS-031's notes, if any".

## Criteria run on 68e004a

- `git grep -niE "lowest-numbered" -- docs/aoe4-build-order.md`: no hits (as stated).
- `git grep -niE "resumes|fixed when paid" -- docs/aoe4-build-order.md`: no hits (as stated).
- `git grep -nE "byBaseId\.get\(([A-Za-z_.]*\.)?unit\)" -- lib/aoe4-build-order/`: no hits. simulate.ts and houses.ts do not exist yet.
- research.ts does not exist. The mutation criteria target code that is new in this ticket and cannot be run before it exists.

## Open questions

None.
