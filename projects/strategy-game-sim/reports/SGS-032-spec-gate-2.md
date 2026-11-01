# SGS-032 spec gate 2

Ticket: tickets/SGS-032-aoe4-research-veterancy.md (respec 2). Base 68e004a. Cross-read: tickets/SGS-031 (respec 2), gate-1 report.

## Verdict: READY

## Gate-1 gaps
1. Seam test breaks when research is registered: closed. Scope 2 edits the test in place (delete `stepHandlers.research`, assert research `waiting` and next `not-reached`, restore in `finally`); last criterion and a dedicated seam criterion cover it.
2. Third lookup (auto-house demand): closed. Scope 2 lists three sites, names the rule for whichever ticket merges second, and the Reuse criterion is now the `byBaseId.get(...unit)` grep over simulate.ts and houses.ts plus the `resolveUnitEntry(` line counts (2 / 3).
3. Research target missing from docs: closed. Docs bullet plus the `lowest-numbered` grep criterion.
Gate-1 notes also taken: wrapper method to observe the target, starting barracks, wood sufficiency, rejected gives no note, idle-target caveat, SGS-031 notes clause dropped.

## Cross-ticket agreement (SGS-031)
(a) Seam test, both orders agree.
- 031 first: 031 drops `build`/`move`, keeps the `research` no-handler case (031 Scope 5, AC last). 032 then replaces that case with delete-and-restore. Matches 032 Scope 2.
- 032 first: 032 replaces only the research case with delete-and-restore, leaves build/move. 031 then drops build/move and "keeps the research case as it is" (now delete-and-restore); 031's AC ("still asserts research waiting and blocks the next step") still holds. 031 also restores `stepHandlers.build` in `finally`; 032's `git grep stepHandlers.research` restore rule matches 031's "Reservation ignored" test, which saves and restores.
(b) Auto-house demand, both orders hold.
- 031 first: `currentUnitEntry` is the one `byBaseId.get(unit)?.[0]` site. 032 rewires it to `resolveUnitEntry`; the `byBaseId.get(...unit)` grep is then empty, and `resolveUnitEntry(` lines in simulate.ts are order payment, produce handler, and the wrapper (or direct call) = 3.
- 032 first: count is 2; 031 on rebase makes `currentUnitEntry` return `resolveUnitEntry(unit, state)`; count 3; grep empty. 031's "exactly two `currentUnitEntry` lines" is a gate-time check at 031's own merge and still holds when the wrapper is kept.
Both tickets name the same editor rule (second merger rewires). Counts come out the same whether the wrapper is kept or the call is inlined.

## Notes (non-blocking)
- 032 never names `currentUnitEntry`; 031 says both "return resolveUnitEntry" and "or replaces its one call", then "keep the name". Counts are the same either way, but one sentence in 032 Scope 2 ("the wrapper `currentUnitEntry` may stay and return `resolveUnitEntry(unit, state)`") would remove the guess. If 032 is second and deletes the wrapper, 031's "exactly two lines" grep no longer applies; 031's own text already allows this ("may also find that ticket's edit").
- 032 Scope 2 site 3 describes the demand entry with "availability at state.age"; 031 says no availability check is needed (an order exists only after its unit was payable, ages only rise). Harmless; an implementer should not add a check. Consider dropping the phrase.
- 031's Reservation test on `research` when 032 is not yet merged "puts back" an undefined value; restore should delete the key in that case (as 031 Scope 5 says for `build`). Cosmetic.
