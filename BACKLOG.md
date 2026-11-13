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

- (milestone) **AoE4 results charts: real table UI.** Render the chart rows as a real table so collapsed rows look cleaner.
  (owner UI/UX feedback, 2026-11-12)
- (standalone bug) **AoE4 Buildings line chart: overlapping lines.** Many buildings share the same count (1 or 2), so their lines Priority: medium
  stack on that value and the owner cannot tell which buildings are there. Adjust the chart so each building stays
  identifiable. (owner UI/UX feedback, 2026-11-12)
- (milestone) **AoE4 chart markers: one shared control.** Define the markers in one place for all charts; clicking a marker
  shows or hides its vertical line on every chart. (owner UI/UX feedback, 2026-11-12)
- (milestone) **AoE4 build order: one step, many of the same action.** Let a step repeat its action a set number of times
  (e.g. "build Farm from wood x9") instead of entering nine identical steps; the simulator runs each repetition
  as that many copies of the step. (owner feature request, 2026-11-13)
- (milestone) **AoE4 My builds: rename a saved build.** Let the owner rename a named build in the library without saving a
  copy; the new name shows everywhere the build is listed and links to it keep working. (owner feature request, 2026-11-13)
- (milestone) **AoE4 build order: research occupies its building.** Each research runs at a specific building (attack
  upgrades at the Blacksmith; spearman veterancy at the Barracks, archer upgrades at the Archery Range). The
  simulator should require that building to exist and should block its production queue for the research's
  duration, so units queued there pause until the research finishes. (owner feature request, 2026-11-13)
- `reread` (the My builds storage listener in the AoE4 build-order page) does not check `myBuildsAvailable(storage)` before rereading; unchanged from base. Found by SGS-147 implementer (reports/SGS-147-implementer-1.md).
- LESSONS candidate (acceptance/**): Playwright `hover()`/`focus()` smooth-scroll the page and the resulting `pointerenter` events change state after an assertion passed; scroll targets into view instantly before hover/focus sequences. From SGS-150 (reports/SGS-150-implementer-1.md).
- docs/aoe4-build-order.md pinned-series color: the doc omits that the palette index wraps by modulo (`pinnedColor`). Non-blocking note from SGS-152 review 2.
- `scripts/smoke-preview.mjs` route handler swallows `route.fetch`/`route.abort` errors in an empty catch, hiding a failed bypass reroute (SGS-153 implementer).
- `scripts/smoke-preview.mjs`: the `browser.close()` rejection path has no test (SGS-153 implementer).
- `acceptance/aoe4-results-split.spec.ts:41` (chart ids) fails at origin/main 5371c25 and at f55e0aa, reproducibly; a red acceptance spec on main (SGS-154 implementer).
- `acceptance/aoe4-build-order-step-band.spec.ts:143` failed at f55e0aa and passed once at 5371c25; possibly flaky, check whether SGS-150's settled-state waits (#160) covered it (SGS-154 implementer).
- SGS-154 acceptance-test: the idle-arrival test in the depletion-engine acceptance spec only asserts `at > 0`; a mutation keeping the latest arrival instead of the first still passes, so the first-arrival `at` rule is unpinned (reports/SGS-154-acceptance-test-1.md).
- (docs) **Combat simulator doc: remove stale "Current code" notes.** `docs/combat-simulator.md` still describes the
  one-battle code in three notes: "Number of battles N" (but `validateBattles` in `pages/api/fight.ts` accepts
  `battles`, 1..100000, default 1000), "Independence of battles" (but `simulateBattles` in
  `lib/combat-simulator/simulate.ts` builds a fresh `BaseArmy` per battle), and "Outcome reporting" (the response is
  now `FightResponse` with `battles`, `outcomes`, `rounds` stats, `survivors`, `hitsPerRound`). Reword the intro that
  introduces those notes. Review judges the simulator against this doc, so it currently flags shipped behavior as a
  defect. (discovery docs 2026-11-13, discovery/docs-20261113-1.md)
- (milestone) **AoE4 sim: measure accuracy against real games.** No M1-M9 criterion checks the simulator's timings against real
  play (e.g. age-up and unit-out times from pro-game replays or published builds). Wider than the existing
  provisional-gather-rates item above, which it would absorb. Recommended: milestone, priority high. (discovery
  milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (milestone) **AoE4: show and track the game patch on every result and saved build.** The game patches about monthly (17.0 on
  2026-10-22) while the snapshot (17.0.12182) is refreshed by hand, so old saved builds silently change meaning.
  Recommended: milestone (small), priority medium. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- **AoE4: optional spread of outcomes (several runs with a seed).** (milestone) Defer until the accuracy item above shows where
  the model is off. Recommended: milestone (defer), priority low. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (standalone bug) Priority: high **WOTR combat: dice hit on 6 only; the rules say 5 or 6.** `calculateCombatRollResults` in
  `lib/combat-simulator/battle.ts:110-115` uses `threshold = opts.threshold || 5` with `thisDice > threshold`, so only a 6
  hits; `docs/combat-simulator.md` says "A die hits on a 6 only" (also for re-rolls and the mermaid "Each 6 is a hit").
  War of the Ring 2E (Dized rules): "Each die rolled scores a hit on a result of '5' or '6.'" If so, every WOTR odds
  number is off (1/6 vs 1/3 per die). Owner to confirm the rule. Recommended: standalone bug, priority high (doc and
  code in one PR). (discovery milestone 2026-11-13, standard, discovery/milestone-20261113-2.md)