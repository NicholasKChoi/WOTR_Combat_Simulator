# SGS-005 re-spec 1 (ticket author)

Ticket: tickets/SGS-005-n-battle-outcome-frequencies.md. Base: origin/main d54af2e. Branch not created.

## Gate findings addressed
1. Statistic shape: response JSON names pinned in Scope section 1 (below), with nearest-rank percentiles,
   survivor array encoding, fixed 6-element hit arrays.
2. "No other statistics": now "exactly the statistics in CONTEXT.md Decisions / the doc", hits per round included.
3. Submitted armies: response carries none; page snapshots its own FormData; criteria fixed (no `attack`/`defend` keys;
   W2 checked by unit loop-independence test and a 5v5 HTTP no-carry-over test).
4. Key surfaces: Scope section 7 lists the lines for the manager to copy into CONTEXT.md.
5. Time budget: pass/fail harness spec, 10 000 ms timeout, matchups 0/10/0 vs 0/10/0 and 0/10/5 vs 0/10/5 at N=100,000;
   over budget = stop and report, cap unchanged.
6. Misattributions fixed: validation, 405, `{ error }`, caps are SGS-003.
7. `battles` parsing: SGS-003 rule, 1..100,000, absent = 1000; `""`, `"1e3"`, `null`, `true`, `" 5"`, `"+5"` etc. 400;
   checked after SGS-003's checks.
8. Tests: unit tests (SGS-007 runner) for accumulator/percentiles/survivors/hit shares/W2; HTTP + UI specs in SGS-002
   harness; existing single-battle specs (SGS-002 smoke, SGS-003 success, SGS-004 averages) updated, not deleted.

## Pinned response fields
battles; outcomes.{attacker,defender,tie}.{count,frequency}; rounds.{mean,median,p10,p90};
survivors.{attacker,defender}[].{regulars,elites,count,frequency}; hitsPerRound.{attacker,defender} (6 numbers, index = hits 0-5).

Aligned with re-specced SGS-001: nearest-rank, rank ceil(p/100*N), whole rounds; survivors per winning side, ties none.

## Size / risk / deps
~265 business LOC; Risk high; Depends on SGS-001, SGS-002, SGS-004, SGS-007 (SGS-003 transitively).

## Open questions
- Owner-confirm (non-blocking, default stated): survivor `frequency` denominator = that side's wins.
- Pinned encoding choices: hits shares pooled over all rounds; survivor sort order.

## Overlap / manager actions
- SGS-006 copies section 1 names; its FightRequest already matches `battles` 1..100000 default 1000.
- SGS-004 must expose an injectable dice source and fresh-army-constructible battle function in lib/combat-simulator/.
- SGS-002/003/004 harness specs asserting `survivor`/averages get rewritten by this ticket.
- TASK-GRAPH dependsOn for SGS-005 should become SGS-001, SGS-002, SGS-004, SGS-007.
- CONTEXT.md Key surfaces update (section 7).

## Addendum: aligned to SGS-004 final layout
- `lib/combat-simulator/simulate.ts` builds fresh `BaseArmy` (from `lib/combat-simulator/army.ts`) per battle and calls
  `Battle(attack, defend, roll)` from `battle.ts`; outcome/survivors read from the armies, per-round hits from the BattleResult, then discarded.
- Unit tests: `lib/combat-simulator/simulate.test.ts` (Vitest, `npm test`) with a scripted roller in Battle's call order.
- Removed "moving `pages/api/models/army.ts`" from Out of scope (SGS-004 does it). No FormParseResult wording remains.
