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
- design/M4.md step-table rows: "drops `start` (civ default)" is misleading for English (English requires `start.rally`, so a build with no start line is rejected on Run; the user fixes it with Customize start); "Add the pair at the end" conflicts with the formatter, which writes villager pairs in its fixed node order (a new pair can appear first). Reported by SGS-068 review.
- OpenAPI `BuildOrderIssue.message` description says "names the step", loose for start/inputs/request issues; design C4 says the 400 response description lists the two new messages (they are in the examples only). Reported by SGS-061 review (the edges-spec issue-count part is already done).
- Workbench step table: `NumberControl`'s local `draft` in `components/apps/aoe4-build-order/step-table.tsx` (an unsaved invalid entry in a required number field) is lost when the table remounts on the Text/Table toggle; and no spec covers resizing the window while the Results panel is hidden (recharts sees width 0). Left out of SGS-088. Reported by SGS-066 tech-lead.
- `pages/apps/aoe4-build-order.tsx` pin restore: in dev Strict Mode the restore POSTs twice. Left out of SGS-088. Reported by SGS-072 tech-lead.
- `lib/aoe4-build-order/schema.ts`: an issue `path` such as `inputs.nodeAmounts.<ref>` still carries a long object key in full; SGS-091 truncates only the quoted id in the message. Reported by SGS-091 ticket.
- acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts: `MAN_AT_ARMS_STEP` is a hard-coded step index (now 34); find the step by action+unit instead so the next spear-build edit cannot stale it. Source: SGS-093 review-1.
- lib/aoe4-build-order/schema.test.ts (SGS-091 table): `%#` in the test title prints the row index ("…is quoted as 2"), and the messages are computed at describe-collection time instead of inside `it`, so a schema error shows as a collection error. Source: SGS-091 review-1.
- `lib/aoe4-build-order/simulate-house-warnings.test.ts:167`: the comment "Re-pinned for the house lead-time rule" no longer explains the spear pin, which SGS-093 re-pinned after it removed a rally step (SGS-093 tech-lead).
