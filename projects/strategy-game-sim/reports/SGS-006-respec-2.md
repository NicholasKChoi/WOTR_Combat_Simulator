# SGS-006 re-spec 2 (addendum): WOTR extensibility

Ticket: /home/choin/git/WOTR_Combat_Simulator-factory/projects/strategy-game-sim/tickets/SGS-006-fight-api-contract.md
Trigger: CONTEXT.md Decisions "WOTR extensibility" (owner, 2026-10-28). Base main 8532a0b (only
`docs/combat-simulator.md` under docs/lib; no `lib/combat-simulator/` yet, so nothing in code to re-explore).

## Changes (tagged `(respec 2)`)

1. Spec `FightOutcomes`: `required` = attacker, defender, tie; `additionalProperties: {$ref OutcomeTally}`
   (not false); description says later versions may add outcome kinds and clients must tolerate unknown keys.
   It is the single exception to the all-objects-closed rule; the jq criterion now expects `["FightOutcomes"]`.
2. Types: `FightOutcomes = Record<OutcomeKind, OutcomeTally>`, `OutcomeKind` imported type-only from
   `lib/combat-simulator/battle.ts`. Type stays closed (no index signature). Bounce to needs_spec if SGS-004
   merges without exporting both `OUTCOME_KINDS` and `OutcomeKind`.
3. Request: no new field; Scope notes later termination options land as optional `FightRequest` properties
   with a behavior-preserving default. No placeholder text in the spec. Criterion: `FightRequest` has 7 properties.
4. Contract check: case 1 adds Ajv assertions on copies of the 200 example (each missing required kind
   rejected; extra `{count, frequency}` kind accepted; extra kind without `frequency` rejected). Case 8 asserts
   `OUTCOME_KINDS` equals `FightOutcomes.required` and the real 200 `outcomes` keys, as sets.
5. Four criteria added, one rewritten; out-of-scope and bounce note extended; re-spec section appended.

LOC ~360 -> ~375 total (~150 -> ~160 business logic). Risk high (unchanged). Depends on unchanged.

## Notes for the manager

- Kept the pinned schema/type name `OutcomeTally` rather than the brief's example `OutcomeStat`. SGS-004 must
  not export a conflicting `OutcomeTally`/`OutcomeStat` name expectation; if SGS-004's re-spec names a stat
  type, align there or here.
- Cross-ticket dependency on SGS-004's re-spec: it must export a runtime `OUTCOME_KINDS` constant (case 8
  imports it into the acceptance spec) and `OutcomeKind = (typeof OUTCOME_KINDS)[number]`.
- SGS-005 section 1 should agree that `outcomes` may grow later; its key-set-exact criterion is fine for M1.
- Diagrams: none (single component, outside the core loop). Open questions for the owner: none.
