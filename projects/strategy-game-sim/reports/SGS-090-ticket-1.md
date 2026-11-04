# SGS-090 ticket report 1

Ticket: projects/strategy-game-sim/tickets/SGS-090-aoe4-multi-tier-research-site-and-unit-tier.md
Risk: high (what a run computes; only for data shipped files lack). dependsOn: none. LOC ~20.

Triage on main ee7ecb9 (backlog lines 22, 23, 26, 35, 43; line 35 cites validate.ts, now schema.ts):
- L22 activeEffects all tiers: FIXED. EffectState.researchedIds; activeEffects maps researchedIds; test "applies only the effects of the researched entry".
- L23 conditionWeight exact age: INTENDED. Four farmGatherRate rows age 1..4 (1.2, 1.25, 1.3, 1.3) replace, not stack; docs say "exactly this age". Drop.
- L26 research.ts age max vs first entry: FIXED. researchEntry picks highest entry <= age; handler uses it.
- L35 `research X at B`: STILL HOLDS (schema.ts crossFieldProblems via techSites union; researchHandler targets [step.at] without checking entry.producedBy). Ticket Scope 1.
- L43 resolveUnitEntry fallback to entries[0]: STILL HOLDS for synthetic data (two upgrades, higher one without entry). Ticket Scope 2.

Shipped data: all 69 technologies and 11 upgrades have exactly one entry per baseId; all 11 upgradeTargets have a unit entry at the upgrade age. So the remaining two are purely theoretical today; the owner can discard the ticket (Open question 1) and the two backlog bullets.

Shipped results unchanged: checked by saving simulateBuildOrder JSON for the three builds under data/aoe4-build-order/builds (plus a variant with `at` added to every research step) before and after, requiring byte-identity (first criterion).

Diagrams: none. Open questions: two, both owner. Overlap: none with open tickets; SGS-080/081 touch farms/builds only (run the differential on main after they merge, or on the branch base).
Not run: no commands were executed against the code (search/test criteria are new tests); code read via git show main:.
