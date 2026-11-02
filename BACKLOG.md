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
- lib/aoe4-build-order/effects.ts activeEffects: applies every snapshot entry under a researched baseId, so a multi-tier tech would apply all tiers; decide whether `researched` holds baseIds or ids (relevant to SGS-032). Evidence: projects/strategy-game-sim/reports/SGS-027-review-1.md. Reported by SGS-027 review.
- `lib/aoe4-build-order/effects.ts` `conditionWeight` matches an overlay row age exactly, so a row meant as "from age N on" stops applying after N; confirm intent for SGS-030/032 (SGS-027 tech-lead).
- `tsconfig.json` has `strict: false`, so `if (!result.ok)` does not narrow discriminated unions (TS2339); use `result.ok === false`. Tell SGS-033/SGS-034 implementers, or consider a LESSONS entry (SGS-028 implementer).
- lib/aoe4-build-order/simulate.ts:212-215 throws a TypeError if a villager-producer hook disagrees with the data; simulate.ts:301 has a redundant condition; the supply-wait test assertion is weak. (SGS-030 review)
- lib/aoe4-build-order/simulate.ts:350-351: a unit with 0 production time finishes at the instant it starts; on a continuous order that loop never advances time. Check the data for zero-time units and keep hook-supplied times positive. (SGS-030 tech-lead)
- research.ts:65-67 takes the highest age over all entries of an upgrade while the handler checks only the first entry's age (research.ts:35,37); harmless while each tech has one entry, same assumption as effects.ts activeEffects. (SGS-032 review)
- research.test.ts:345: the test name claims a population check it does not make. (SGS-032 review)
- `lib/aoe4-build-order/research.ts` (~lines 86, 94) builds note messages from display names rather than ids; the page shows the id separately as a workaround. Reported by SGS-034.
- `lib/aoe4-build-order/parse-text.ts` has its own `GATHER_NODE_ORDER` and `validate.ts` its own `VILLAGER`; they could use the shared constants from `engine-common.ts`/model. Reported by SGS-035 (ticket excluded both).
- `parse-text.ts` formats `@m:ss` triggers with the shared `formatMinSec`; rounding may differ from the old inline formatter for non-integer trigger seconds and no test covers it. Reported by SGS-035.
- `lib/aoe4-build-order/modified-value.test.ts` keeps its own copy of `effectStateOf` (below the jscpd thresholds). Reported by SGS-035.
- `pages/api/aoe4-build-order/simulate.ts:57,64` `handler` narrows with `'issues' in` / `'order' in` rather than `ok`; works today. Reported by SGS-036.
- `lib/aoe4-build-order/gather.ts:6` uses a literal `'villager'` instead of `VILLAGER_ID`; `result-series.ts:4` `RESOURCE_ORDER` duplicates `RESOURCE_KINDS`; `type Resources` is declared in both `engine-common.ts` and `simulate.ts`. Reported by SGS-035 review.
- `lib/aoe4-build-order/depletion.ts` `drawDown` leaves out the snapped remainder (at most 1e-9) from the amount it reports as drawn; `STEP_NODE_FIELDS` (depletion.ts:25) is a hand-written list that must stay in step with the per-action node-field table at `validate.ts:66` when SGS-038/040 add node fields. Reported by SGS-037 review.
- `lib/aoe4-build-order/validate.ts:311` accepts `research X at B` if any entry of X lists B as a producer, but the research handler never checks `at` against the entry it picks; only matters if multi-tier data with different producers lands. Reported by SGS-041 review.
- `docs/aoe4-build-order.md` (~lines 64-66 and 548): the per-key input-merge sentence lists `trips` and `influenceCoverage` but not `nodeAmounts`; the walk sentence uses "idle" for two different things (walking villagers, and villagers stuck at a run-out node). Candidate for SGS-054's audit. Reported by SGS-038 review.
- `components/apps/aoe4-build-order/compare.ts` carries its own `AGE_NAMES`, a copy of the constant SGS-044 adds to `model.ts`; once both are merged compare.ts should import it. Reported by the M3 wave-4 simplify pass (SGS-048 / SGS-044).
- `docs/aoe4-build-order.md:147` ("Ordering and triggers" paragraph) says "Once armed, it waits until it is affordable and supply allows it, then starts", leaving out the builder, age and missing-instance waits; it should point at the wait-reasons table. Candidate for SGS-054's audit. Reported by SGS-042 review.
- `lib/aoe4-build-order/depletion.ts:146` `depletionResults` still sorts its own warnings and `simulate.ts` sorts the merged list again; the inner sort could be dropped. Reported by SGS-042 tech-lead.
- `lib/aoe4-build-order/simulate.ts` `houseGateOpen` counts a reaction `build house` step as "the last build house step"; if that reaction never fires and sits at the end of the list, auto-houses stay off for the whole run. **Owner decision (2026-11-02):** keep accepting the request, but the simulate response must carry a warning that no house will ever be built. Needs a ticket (warning code, docs, tests); the gate semantics themselves stay. Reported by SGS-039 review.
- **Owner feedback (2026-11-02): replace hand-rolled build parsing and validation with a schema library (zod).** The front end should convert the raw pasted build text into a zod-validated build object before POSTing, so the API takes structured input and the server checks it against the same schema. Migrate the relevant existing acceptance tests so they cover only that front-end conversion logic, and drop the tests that re-check the hand-rolled grammar and validation paths. Apply the same change to the data tests (the rules and aoe4world snapshot checks): validate the data files with a schema instead of per-field hand-written assertions. Reason: the hand-rolled parsing, validation and their tests make PRs too verbose to review. Touches `parse-text.ts`, `validate.ts`, the simulate route, and SGS-040's grammar work; triage at the next `plan`/`milestone` and decide whether SGS-040 should wait for it.
- `lib/aoe4-build-order/houses.ts` `planAutoHouse` (fed by `simulate.ts` `houseDemand`) counts the supply of buildings still under construction as already available. The King's Palace gives 10 supply and takes 220 s to build, so no auto-house is planned and population sits at 40 (the knight + longbow build spent nothing from 660 to 764 s without explicit houses). Idea: count pending supply only from items that finish within the house lead time. Reported by SGS-051 implementer.
- `simulate.ts` `houseGateOpen`: an explicit `build house` step late in the list keeps auto-houses off until it starts, so the build can stick at the population cap before reaching it (a test variant stuck at 452 s). The knight + longbow build puts its houses early to avoid this. Related to the reaction-house decision above. Reported by SGS-051 implementer.
- `acceptance/aoe4-build-order-pin-compare.spec.ts` and `acceptance/aoe4-step-table.spec.ts` each keep their own `openPage`; they could use the shared helper now exported from `acceptance/helpers.ts`. Reported by SGS-055 implementer.
