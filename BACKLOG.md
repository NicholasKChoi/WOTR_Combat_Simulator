# Backlog

Follow-ups noticed during work that are not yet tickets. `/code-factory:new-project` and milestone planning
pull from here; triage moves an item into a milestone or deletes it.

- **AoE4 data freshness check (CI).** Add a scheduled CI job that compares the pinned aoe4world snapshot
  under `data/aoe4-build-order/` (its recorded aoe4world/data commit) with the latest upstream and fails or
  opens an issue when it is out of date. Note: the repo has no GitHub Actions yet (REPO.md CI behavior), so
  this would be the first workflow. Depends on M2's data snapshot existing. (owner, 2026-10-29)
- **AoE4 base gather rates are provisional.** Replace the unverified values copied from
  SichYuriy/aoe4-production-calculator with measured or citable ones, labeled with a patch. (owner, 2026-10-29)
- **AoE4 English economy and Blacksmith tech gaps (owner review of rules/english.json, 2026-10-31).** Owner flagged
  wood and food gather upgrades, Wheelbarrow and the basic Blacksmith upgrades
  (https://ageofempires.fandom.com/wiki/Blacksmith_(Age_of_Empires_IV)) as missing; owner accepts them as follow-ups.
  Checked against `data/aoe4-build-order/aoe4world/english.json` on main 68e004a: wheelbarrow, crosscut-saw,
  lumber-preservation, horticulture, fertilization, survival-techniques, professional-scouts and all twelve Blacksmith
  techs plus siege-works are in the snapshot; `rules/english.json` holds only the hand-entered overlay. Real gaps:
  `double-broadax-2` is in the snapshot too (age 2, 50 food 100 gold, 45 s, wood gather x1.15; matches the owner's cost). (2) `forestry` effect is `unknown`, so
  the engine rejects it; (3) crosscut-saw's +5 wood carry is not modeled (SGS-014 known data gap); (4) Blacksmith
  techs are combat-only, so by the v1 coverage decision they cost resources and queue time but their effects are
  ignored. Decide whether a follow-up adds overlay rows for (2)-(3).

- AoE4 acceptance coverage removed by SGS-098 (owner chose deletion over re-pin, Q14): pinned timelines and bank values (prebuilt English build, house lead time, spend/population, depletion-engine vs pre-depletion engine), veterancy-conversion counts, the contract 200-body example, edges result-shape, markers at a truncated horizon, triggers infinite-node timings, the house-warnings knight/longbow held warning, spear/longbow men-at-arms timing and 1200 s gold. Uncovered at acceptance level; unit pins are current. Source: reports/SGS-098-ticket-1.md.
- acceptance/aoe4-small-screen.spec.ts:42 "run bar at 360x760 ... scrolls the results heading into view" failed once in a full npm run acceptance (1/734), passed 5/5 alone and on a second full run; likely load flake. (SGS-095 implementer-2)
- design/M6.md:627 still says the smoke script sets the bypass header via browser extraHTTPHeaders; SGS-106 now requires context.route scoped to the deployment origin. Fix on the next M6 designer pass. (SGS-106 spec-gate 2)
