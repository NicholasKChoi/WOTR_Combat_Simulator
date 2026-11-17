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

- (milestone) **AoE4 build order: one step, many of the same action.** Let a step repeat its action a set number of times
  (e.g. "build Farm from wood x9") instead of entering nine identical steps; the simulator runs each repetition
  as that many copies of the step. (owner feature request, 2026-11-13)
- (milestone) **AoE4 My builds: rename a saved build.** Let the owner rename a named build in the library without saving a
  copy; the new name shows everywhere the build is listed and links to it keep working. (owner feature request, 2026-11-13)
- (milestone) **AoE4 sim: measure accuracy against real games.** No M1-M9 criterion checks the simulator's timings against real
  play (e.g. age-up and unit-out times from pro-game replays or published builds). Wider than the existing
  provisional-gather-rates item above, which it would absorb. Recommended: milestone, priority high. (discovery
  milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (milestone) **AoE4: show and track the game patch on every result and saved build.** The game patches about monthly (17.0 on
  2026-10-22) while the snapshot (17.0.12182) is refreshed by hand, so old saved builds silently change meaning.
  Recommended: milestone (small), priority medium. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- **AoE4: optional spread of outcomes (several runs with a seed).** (milestone) Defer until the accuracy item above shows where
  the model is off. Recommended: milestone (defer), priority low. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
(standalone chore) Priority: low - **Bump next 16.4.3 to 16.4.6.** Moderate advisory GHSA-mfr8-8qww-v76h covers next 16.3.0 to 16.4.4; the code uses neither `use cache` nor `unstable_cache`, so it is not reachable. Recommended: standalone chore, Priority: low. (discovery standalone 2026-11-16, standard, discovery/standalone-20261116-1.md)

