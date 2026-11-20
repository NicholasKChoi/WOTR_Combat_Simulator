# Backlog

Follow-ups noticed during work that are not yet tickets. `/code-factory:new-project` and milestone planning
pull from here; triage moves an item into a milestone or deletes it.

- (milestone) **AoE4 base gather rates are provisional.** Replace the unverified values copied from
  SichYuriy/aoe4-production-calculator with measured or citable ones, labeled with a patch. (owner, 2026-10-29)
- (milestone) **AoE4 English economy and Blacksmith tech gaps (owner review of rules/english.json, 2026-10-31).** Owner flagged
  wood and food gather upgrades, Wheelbarrow and the basic Blacksmith upgrades
  (https://ageofempires.fandom.com/wiki/Blacksmith_(Age_of_Empires_IV)) as missing; owner accepts them as follow-ups.
  Checked against `data/aoe4-build-order/aoe4world/english.json` on main 68e004a: wheelbarrow, crosscut-saw,
  lumber-preservation, horticulture, fertilization, survival-techniques, professional-scouts and all twelve Blacksmith
  techs plus siege-works are in the snapshot; `rules/english.json` holds only the hand-entered overlay. Real gaps:
  `double-broadax-2` is in the snapshot too (age 2, 50 food 100 gold, 45 s, wood gather x1.15; matches the owner's cost). (2) `forestry` effect is `unknown`, so
  the engine rejects it; (3) crosscut-saw's +5 wood carry is not modeled (SGS-014 known data gap); (4) Blacksmith
  techs are combat-only, so by the v1 coverage decision they cost resources and queue time but their effects are
  ignored. Decide whether a follow-up adds overlay rows for (2)-(3).

- (milestone) **AoE4 sim: measure accuracy against real games.** No M1-M9 criterion checks the simulator's timings against real
  play (e.g. age-up and unit-out times from pro-game replays or published builds). Wider than the existing
  provisional-gather-rates item above, which it would absorb. Recommended: milestone, priority high. (discovery
  milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (milestone) **AoE4: show and track the game patch on every result and saved build.** The game patches about monthly (17.0 on
  2026-10-22) while the snapshot (17.0.12182) is refreshed by hand, so old saved builds silently change meaning.
  Recommended: milestone (small), priority medium. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- **AoE4: optional spread of outcomes (several runs with a seed).** (milestone) Defer until the accuracy item above shows where
  the model is off. Recommended: milestone (defer), priority low. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)

- [follow-up SGS-209] The acceptance test "after 30 writes across the three routes" in acceptance/aoe4-named-builds-api.spec.ts does not include the rename route (renameNamedBuild); only a unit test in lib/aoe4-build-order/named-builds-routes.test.ts covers the shared write budget for it. (SGS-209 implementer report)
- [follow-up SGS-209] acceptance/aoe4-named-builds-api-contract.spec.ts compares only example bodies, so a missing WWW-Authenticate header on the PATCH named-builds/{id} 401 is caught only by the unit test in named-builds-routes.test.ts. (SGS-209 implementer report)
- [follow-up SGS-212] `withMyBuilds` in `components/apps/aoe4-build-order/build-library.ts` still keeps the stored name over the server name when the My builds read lands after a load, so the stale label can survive depending on arrival order (D17 inversion); it should keep the listed `mine` name too. Evidence: reports/SGS-212-implementer-5.md.
- AoE4: import a build from, and export one to, the community overlay/guide format (AoE4_Overlay / aoe4guides JSON). Recommended: milestone, priority medium. The sim reads only its own JSON and paste format; first ticket should fetch a real RTS_Overlay export before designing the mapping. (discovery milestone 2026-11-20, standard; discovery/milestone-20261120-1.md)
