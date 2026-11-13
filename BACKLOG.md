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

- design/M9.md M9.9 criteria-map row describes one Tab walk after Save as copy reaching save-build then the link controls; no page state allows it (save-build is disabled whenever the link shows). Change to the two-state version. Source: SGS-141 re-spec, reports/SGS-141-ticket-2.md
- design/M9.md row M9.12 (b): clearing the copy name (save-copy-name-error shown) is required for the (c) "notice below bar bottom at scrollTop 0" check (339px vs 306px content in a 287px bar); the ticket calls it optional. Make it required in the design row. Reported by SGS-133 review-1.
- **AoE4 results charts: real table UI.** Render the chart rows as a real table so collapsed rows look cleaner.
  (owner UI/UX feedback, 2026-11-12)
- **AoE4 Buildings line chart: overlapping lines.** Many buildings share the same count (1 or 2), so their lines
  stack on that value and the owner cannot tell which buildings are there. Adjust the chart so each building stays
  identifiable. (owner UI/UX feedback, 2026-11-12)
- **AoE4 chart markers: one shared control.** Define the markers in one place for all charts; clicking a marker
  shows or hides its vertical line on every chart. (owner UI/UX feedback, 2026-11-12)
- `reread` (the My builds storage listener in the AoE4 build-order page) does not check `myBuildsAvailable(storage)` before rereading; unchanged from base. Found by SGS-147 implementer (reports/SGS-147-implementer-1.md).
- LESSONS candidate (acceptance/**): Playwright `hover()`/`focus()` smooth-scroll the page and the resulting `pointerenter` events change state after an assertion passed; scroll targets into view instantly before hover/focus sequences. From SGS-150 (reports/SGS-150-implementer-1.md).
- docs/aoe4-build-order.md pinned-series color: the doc omits that the palette index wraps by modulo (`pinnedColor`). Non-blocking note from SGS-152 review 2.
- `scripts/smoke-preview.mjs` route handler swallows `route.fetch`/`route.abort` errors in an empty catch, hiding a failed bypass reroute (SGS-153 implementer).
- `scripts/smoke-preview.mjs`: the `browser.close()` rejection path has no test (SGS-153 implementer).
