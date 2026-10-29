# SGS-001 spec gate

Verdict: NEEDS_SPEC (no owner-only gaps; all fixable by editing the ticket)

Checked against origin/main d54af2e. Every named file/function exists (Battle, rollDice,
calculateCombatRollResults, BattleResult.getStats, parseFightForm, BaseArmy, army.js UI ranges 0-9/0-9/0-5,
results.js Shadow/Free labels). `docs/` does not exist on main, as the ticket says. Risk `high` is right
(W1 trigger). Dependencies none; size is prose only.

## The "Still open" item does not block
Fight-to-elimination, no cards, no sieges and Shadow/Free hard-coded describe current behavior the doc can
state with a tag. The ticket says what to do meanwhile ("owner to confirm"). No later ticket's main path
depends on them. Not a gap.

## Gaps
1. Scope 4 / criterion 7 vs resolved casualty question. Scope says ">5 units: a hit removes a regular" and
   the criterion says the doc must match `BaseArmy.takeHit`. But takeHit with >5 units and 0 regulars drives
   regulars negative, and the owner resolved that case as "downgrade an elite to a regular". Section 10
   forbids documenting the negative path. Literal compliance cannot yield the resolved rule.
   Fix: rewrite section 4: ">5 units: a hit removes a regular; with no regulars it downgrades an elite to a
   regular. <=5 units: an elite becomes a regular, else a regular is removed." Add a "current code" note that
   takeHit does not handle the 0-regular case. Reword the criterion to "matches takeHit except the 0-regular
   case, which follows the rule above". Note that elite->regular leaves combat strength unchanged.
2. Stale references. Section 4 says the reroll cap value is "Open question 1"; section 6 says per-field limits
   and leader counting are "Open question 2". Both are resolved. Fix: reroll = min(misses, leaders, 5);
   section 6 = regulars + elites <= 10 per side, leaders 0-5 not counted toward the 10. Add the reroll cap
   and leaders cap of 5 to criterion 3's settled list (leaders cap is in no criterion today).
3. Nazgul/character leadership is tagged "owner to confirm" in section 5 and criterion 6, but is settled as
   "not modeled" (resolved questions; CONTEXT.md Out of scope). Fix: remove from the confirm list; state as
   settled.
4. Outcome stats: owner "confirmed as written", yet section 8 and criterion 6 still demand the tag
   "proposal, owner to confirm". Mutual elimination is named "tie" but criterion 6 only maps it to `n/a`.
   Section 8 also leaves two choices open (survivors split by regulars/elites or combined; hits per round
   kept or dropped). Fix: drop the tag, name the outcome "tie" (today's `n/a`), pick survivors split
   (regulars and elites separately) or combined, and keep hits per round (CONTEXT.md Decisions lists it).
5. Time budget (N=100,000 within 10 s) is settled but only in the ticket's resolved list; unclear whether the
   doc records it. Fix: add to section 7 and the N criterion.
6. Diagram mismatch. Scope requires a Mermaid flowchart; Diagrams section says none required; no criterion
   checks it. Fix: add a criterion (flowchart steps match section 3) or drop it from scope.

## Notes (non-blocking)
- Section 3 round order should mark the 5-die and reroll caps as planned steps (or point to section 4) so
  the flowchart does not contradict the settled rules.
- `npx tsc --noEmit` criterion is trivially true for a docs-only diff.
- No LESSONS.md entries exist (repo or project). W1/W2 named; S3 is adjacent (input bounds, N cap) and could
  be listed. No invariant contradicted. No new contract names beyond "tie", which CONTEXT.md already has.
