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
- (milestone) **AoE4 sim: measure accuracy against real games.** No M1-M9 criterion checks the simulator's timings against real
  play (e.g. age-up and unit-out times from pro-game replays or published builds). Wider than the existing
  provisional-gather-rates item above, which it would absorb. Recommended: milestone, priority high. (discovery
  milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (milestone) **AoE4: show and track the game patch on every result and saved build.** The game patches about monthly (17.0 on
  2026-10-22) while the snapshot (17.0.12182) is refreshed by hand, so old saved builds silently change meaning.
  Recommended: milestone (small), priority medium. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- **AoE4: optional spread of outcomes (several runs with a seed).** (milestone) Defer until the accuracy item above shows where
  the model is off. Recommended: milestone (defer), priority low. (discovery milestone 2026-11-13, discovery/milestone-20261113-1.md)
- (milestone) **Remove mobile support for the AoE4 build-order page (owner, Q101, 2026-11-15: "Remove mobile support, it should be its own milestone").** Replaces the 360 px tooltip item: (from SGS-157 review 2) AoE4 series charts at 360 px: a tooltip shown near the chart's right edge cuts off its text (e.g. "Capital Town Center : 1"); recharts tooltip placement, on main too (`components/apps/aoe4-build-order/line-chart.tsx`). Evidence: reports/SGS-157-review-2.md.
- (milestone) **AoE4 results charts: control the time window (owner, 2026-11-15).** Let the owner zoom into and focus on a specific window of game time on the results charts, Grafana-style: for example drag-select a range to zoom, scroll or pinch to zoom, pan, and reset to the full game. Each chart zooms on its own; zooming one chart leaves the others unchanged (owner, 2026-11-15). The chosen window is not persisted: a page reload resets every chart to the full game (owner, 2026-11-15). Source: owner request in chat.
- (standalone chore) Priority: low. **AoE4: move "effect is not simulated" research notes to a new `debug` severity (owner, 2026-11-15).** The sim is mostly an economy simulator, so notes like "bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time." (also fitted-leatherwork, decarbonization, insulated-helm, balanced-projectiles, wedge-rivets, textiles) are noise in the results. Add a `debug` severity below `info`, emit the `tech-effect-ignored` and `tech-effect-unmodeled` notes (`lib/aoe4-build-order/research.ts:105-123`, today `severity: 'info'`) at it, and hide `debug` from the default results list (cost and queue-time handling unchanged). Update `research.test.ts:640-641` and any UI that lists notes by severity. Source: owner request in chat.
- (milestone) **AoE4 build order: a "How this page works" tutorial modal (owner, 2026-11-15).** One modal, opened from a help button on the page, that explains the page and holds the explanations now repeated around the UI (e.g. the step-kind legend, what the yellow step tint means: a wait of `LONG_WAIT_SECONDS` = 60 s or more, or a step still waiting or never reached at the end of the simulation, `components/apps/aoe4-build-order/step-annotation.tsx` `annotationToneClass`). Goal is to simplify the page: move inline legends and hints into the modal instead of adding more. Source: owner request in chat after the yellow 14:54 highlight in a named build had no explanation.
- (milestone) **AoE4 build order: name the actual blocker of a waiting step (owner, 2026-11-15).** Today the wait reasons are generic categories (`resources`, `villagers`, `population`, `prerequisite`; `components/apps/aoe4-build-order/step-annotations.ts` `blockedByText`), so a crossbowman waiting on Castle Age shows "prerequisite 1:54". Show the specific blocker instead, e.g. "waiting for Castle Age (The White Tower)", "waiting for 50 gold", "waiting for a free Archery Range". Needs the engine to report which prerequisite or resource it waited on, not just the category. Example: named build `7yr4zFK1eyeB4Y021UFaHw`, step 43 (produce crossbowman), waited 1:54 on prerequisite. Source: owner request in chat.
- (standalone chore) Priority: medium. **AoE4 build order: custom hover popover for step annotations (owner, 2026-11-15).** The editor gutter's step details use the native `title` attribute (`components/apps/aoe4-build-order/build-text-editor.tsx` `AnnotationLine`), which appears only after a browser delay and looks like nothing happens on hover. Replace it with a custom hover element that appears right away on pointer enter (and on keyboard focus) with the same text: waited time and blocked-by. Source: owner request in chat.
