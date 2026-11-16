# SGS-168: Cut the roadmap claim from the combat rules doc

- **Type**: Docs
- **Component**: wotr-combat-simulator
- **Milestone**: none
- **Priority**: low
- **Risk**: standard
  <!-- CONTEXT.md names docs/combat-simulator.md authoritative for input bounds and the other combat contracts, and reviews judge W1 against it, so not low. The change removes two sentences that state no rule. -->
- **Invariants**: W1 (the doc is what combat behavior is judged against; no combat behavior changes)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only, about 4 lines of `docs/combat-simulator.md` removed or reworded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "(docs) `docs/combat-simulator.md` \"Not modeled\"", found by the SGS-164 docs agent (reports/SGS-164-docs-1.md)

## Context

`docs/combat-simulator.md` is the rules doc: "Each section states a rule, and the code follows it." Two sentences
state no rule and no code or design doc backs them, so a reviewer cannot check either against behavior.

### Decision per claim (default: cut what code does not state)

| Claim | Where | Code or design evidence | Resolution |
|-------|-------|-------------------------|------------|
| "Support for them is planned for a later release." | section "Not modeled", bullet "Character and Nazgul leadership" | None in code. Leadership is only the `leaders` count: `lib/combat-simulator/army.ts` `BaseArmy.leaders`, used in `lib/combat-simulator/battle.ts` `resolveRound` (leader rerolls capped by `MAX_LEADER_REROLLS`). The roadmap lives in PROJECT.md Out of scope ("a later milestone"), not in a rules doc. | Cut the sentence. Keep the rest of the bullet: that Companions, Minions, and Nazgul that add leadership are not modeled and leadership comes only from the leaders count is what the code does. |
| "A request for N = 100,000 completes within 10 seconds." | section "Number of battles N" (it sits under "Not modeled" in the backlog text, but it is in the N section) | `lib/combat-simulator/simulate.ts` `MAX_BATTLES = 100000` states the cap, which the doc already gives in the previous sentence. `acceptance/fight-api-battles.spec.ts:5,219-231` asserts a 10 s budget at 100000 battles (the first draft missed `acceptance/`). | Keep the sentence (rework 1): `acceptance/fight-api-battles.spec.ts` `time budget` (TIME_BUDGET_MS = 10_000) runs worst-case matchups at 100000 battles and enforces it, per SGS-005 (S3). |

## Scope

- `docs/combat-simulator.md`, section "Number of battles N": leave the 10-second sentence (rework 1). The default and maximum of N must still match `MAX_BATTLES` and the default in `lib/combat-simulator/simulate.ts`.
- `docs/combat-simulator.md`, section "Not modeled", bullet "Character and Nazgul leadership": remove the sentence
  that says support is planned for a later release. The statement of what is not modeled stays.
- Re-read the rest of `docs/combat-simulator.md` for other roadmap or future-tense claims ("planned", "later", "will") and for
  other timing claims, and cut any the code or a design doc does not state. The "Extension points" section already says none of
  those rules is modeled today and names real symbols (`shouldStop`, `BattleOptions`, `OUTCOME_KINDS` in
  `lib/combat-simulator/battle.ts`); verify those still exist and leave the section if they do.
- Other docs that repeat either claim: a grep of `docs/`, `README.md`, `ARCHITECTURE.md`, and `docs/api/openapi.json` found
  none outside `docs/combat-simulator.md`. Re-grep before editing and fix any copy that appeared since.

**Out of scope:** any code change; adding a performance test or target; changing PROJECT.md Out of scope; implementing
Character or Nazgul leadership.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/combat-simulator.md` still states that a request for N = 100,000 completes within 10 seconds, the limit `acceptance/fight-api-battles.spec.ts` `time budget` enforces (S3). (rework 1)
- [ ] `docs/combat-simulator.md` makes no claim about future support or a later release for leadership or any other rule;
      "Not modeled" still says Companions, Minions, and Nazgul leadership are not modeled and leadership comes only from the
      leaders count.
- [ ] The section "Number of battles N" still gives the default N and the maximum N, and both equal the values in
      `lib/combat-simulator/simulate.ts`.
- [ ] Only docs change: no file under `lib/`, `app/`, `acceptance/`, or any test is modified, so existing tests keep their assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Rework 1 - 2026-11-15 (tech-lead, text)

### Findings

- `docs/combat-simulator.md` "Number of battles N": the commit deleted "A request for N = 100,000 completes within 10 seconds." The claim is backed and enforced by `acceptance/fight-api-battles.spec.ts:5` and the `time budget` tests at `:219-231` (SGS-005 criterion, invariant S3). The ticket's evidence missed `acceptance/`.

### Required fixes

- [ ] (text) Restore the sentence "A request for N = 100,000 completes within 10 seconds." in "Number of battles N" exactly as it was on main. Keep the cut of "Support for them is planned for a later release."
