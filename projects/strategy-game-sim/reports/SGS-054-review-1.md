# SGS-054 review 1

Branch `sgs-054-aoe4-m3-docs-openapi-audit`, tip 0093867f926a041d9d33b42dbbfcceef2d8f4abc, base main d90d91a.
Full diff reviewed: `acceptance/fight-api-spec-surface.spec.ts` (+49) and `docs/aoe4-build-order.md` (+100/-47). No change to `docs/api/openapi.json`.

## Verdict: REQUEST CHANGES

Two sentences the diff adds or edits are contradicted by the code. Each is a one-line doc fix.

## Blocking findings

1. `docs/aoe4-build-order.md:669` - contract - The diff changes "`spawnedPopulation`: the popcap of villagers and units" to "the count of villagers and units". The code adds each unit's population cost, not 1 per unit: `lib/aoe4-build-order/simulate.ts:280` `state.spawnedPopulation += entry.costs.popcap`. The data has units with popcap 2, 3, 5 and 6 (`springald-3`, `mangonel-3`, `bombard-4`, `carrack-4`, `wynguard-*-4` in `aoe4world/english.json`). `design/M3.md:596` ("the summed popcap") and the OpenAPI description ("Popcap of spawned villagers and units") both say the sum. The doc now disagrees with the code, the design and the spec, and `populationCapReachedAt` (compared against the 200 cap) only makes sense as a population sum. Fix: revert to wording such as "the population (summed `popcap`) of villagers and units that have spawned".

2. `docs/aoe4-build-order.md:488` - contract - "The issue message is `<reason> in <path>`". The paragraph above names `inputs.nodeAmounts` keys as one of the node positions, but those issues use `inputIssue` (`lib/aoe4-build-order/validate.ts:417-418`, `:474`), which gives `inputs.<path>: <reason>` with no "in <path>". Seen live: `{"code":"unknown-id","message":"inputs.nodeAmounts.iron: unknown node \"iron\""}` and `inputs.nodeAmounts.farm: node "farm" never runs out`. Step and start messages also have a `<label>: ` prefix (`line 1: unknown node "iron" in to`), so the "as in" example is only a substring. That part is acceptable because the doc says elsewhere that a message names its step or line. Fix: limit the `<reason> in <path>` form to step fields, `start` and the trigger, and say a `nodeAmounts` key issue reads `inputs.nodeAmounts.<ref>: <reason>`. The table's codes are correct. Only the message form is wrong.

## Spec gaps

None.

## Acceptance criteria

- [pass] Schema count and names: 36 schemas, keys equal the 9 fight names (no `ArmyCount`) plus the 27 AoE4 names.
- [pass] `SimulationResult.required` has 16 entries, including `depletions`, `warnings`, `spent`, `spawnedPopulation`, `populationCapReachedAt`, `markers`.
- [pass] `ResourceKind` is referenced (grep count 1, from the `bank` trigger). The reference test finds no unreferenced schema and has no exemption list.
- [pass] Coverage tokens: all 15 are at least 1 (nodeAmounts 9, gold#2 10, move all 5, node-depleted 7, idle-arrival 6, step-stuck 4, waitingOn 6, waitBreakdown 4, spawnedPopulation 3, populationCapReachedAt 2, markers 10, omittedIssues 4, reaction 27, severity 10, timeline 2).
- [pass] Stale statements: doc grep 0, openapi grep 0.
- [pass] Factory references: 0.
- [pass] Combat statement: 2 hits, at `:16` (Purpose and model) and `:441` (Technologies). Both say the techs cost resources and queue time, mark the charts and change no unit stat. The Out line and the Extension points row agree.
- [pass] Severity section: every row matches the code (`depletion.ts:114` sets `idle > 0 ? 'warning' : 'info'`, `:125` warning; `simulate.ts:835` step-stuck warning; `research.ts:92,101` info; `BuildOrderIssue` has no severity field).
- [fail] Node-reference section: every design row is reproduced and the spot check matches. On `next dev` port 3918, a `move ... to <v>` step gives `gold#1` invalid, `gold#9` out-of-range, `wood#2` invalid, `iron` and `iron#2` unknown-id, `gold#02` syntax; `houseBuilderSource: "gold#2"` gives unknown-id. The criterion stays unticked because of the message-form sentence in finding 2.
- [pass] Marker order is stated once (Outputs `markers` bullet) and matches `researchMarkerKind` (`markers.ts:5-16`). The bullet also says `age-up` comes only from a landmark and that the first match wins.
- [pass] Two new tests are present. Mutation checks: the implementer reports failures for a stray schema, a deleted `Severity`, and a removed `ResourceKind` ref. I re-ran the reference-test logic with Node on mutated copies: removing the bank `resource` `$ref` leaves `['ResourceKind']` unreferenced, and a schema whose only ref is to itself is flagged. I did not re-run the name-equality mutation through Playwright. That assertion is a plain sorted-array equality, so a missing or extra key fails it.
- [pass] Contract check: `npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts acceptance/fight-api-spec-surface.spec.ts` gave 99 passed (ACCEPTANCE_PORT=3917). I did not run the full `npm run acceptance`. The implementer reports 548 passed.
- [pass] `npm test`: 40 files, 1076 passed, 8 skipped. `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- [pass] No INVARIANTS.md regressions (no code change).

Criteria not ticked because of the REQUEST CHANGES verdict.

## Invariants touched

- A1: the doc still names the `base.json` amounts as owner-supplied and unverified. Holds.
- A2: the bank and wait prose is unchanged in meaning. "Waits while any check in the wait reasons table fails" matches the handlers. Holds.
- A3: the determinism statement is unchanged. Holds.
- S3: the 100-issue cap is still stated. Holds.

## Other doc sentences checked against code (all hold)

- `nodeAmounts` per-key merge (`validate.ts` `resolveNodeAmounts`: defaults first, then overrides per key).
- The `build`/`move` wait counts gathering plus idle villagers (`simulate.ts:148-150` `availableAt`, `:403`, `:415-418`). `move all` never waits.
- `depletions` holds the six finite nodes plus the deposits the order names (`depletion.ts` `runRefs`). A `nodeAmounts` key alone does not add a ref, which matches "the order names".
- `trips` and `houseBuilderSource` are checked against the gather node ids only (`validate.ts:451-452`, `:510-512`).
- The paste parser's `NODE_TOKEN` accepts any `<id>#<chars>` and reports no node classification (`parse-text.ts:16,80`).
- The `unknown-id` row includes resource (`validate.ts:199-202`). `atLeast` is bounded to 0..100000 (`validate.ts:24`).
- The `IGNORED_EFFECT_PROPERTIES` contents include hitpoints, attack and armor (`effects.ts:19-33`). University techs carry only ignored properties.
- The page splits messages by severity into a warnings list and an info list (`messages.ts:11-13`). The compare table uses `spent.military` and `populationCapReachedAt` (`compare.ts:25,33,50`).
- The prebuilt build names match `data/aoe4-build-order/builds/*.json` `name`.
- Markdown tables: every table row has the same pipe count as its header (awk check across the whole doc). There are no bare pipes in cells.

## OpenAPI audit (no diff; verified on the tree)

- `NodeRef` is a oneOf of `GatherNodeId` and `DepositRef`. `FiniteNodeRef` is a oneOf of `FiniteGatherNodeId` and `DepositRef`. `spent.propertyNames` refs `SpendCategory`. `nodeAmounts.propertyNames` refs `FiniteNodeRef`.
- `omittedIssues` is present. `reaction` is on all 6 `BuildStep` variants. `Trigger` has 4 kinds. `StepTiming` requires `waitingOn` and `waitBreakdown`. `BuildOrderNote` requires `severity`.
- No "empty today" or "never runs out" in any description. `Severity`'s "No result item is error today" is accurate.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. No rules file.

## Non-blocking notes

- `docs/aoe4-build-order.md:12`: the intro says the result holds "graphs over time of ... spending and population", while `:711-713` says `spawnedPopulation` has no graph. Consider "series over time".
- `:711`: "The page draws three graphs ... with the markers and warnings" can read as warnings drawn on the charts. Warnings are lists (Page). Consider "beside the warnings".
- `:395`: "Every message the simulator returns has a severity" sits next to the row "request issues ... have no `severity` field". Consider "has a severity level".
- `:443`: "never read" is loose. `classifyTech` reads the properties to name them in `tech-effect-ignored` notes. "never applied" is exact.
- `:357`: list item "Resource depletion" is capitalized while its siblings are lowercase.
- `:73` and `:630-631`: rewrapped lines are uneven (one line is over 180 chars; "per\nkey). A key\nwhose value"). Cosmetic only.

## Conventions

The new tests follow the existing `spec file shape` describe block: inline walk helper like the "defines no object schema inline under paths" test (`fight-api-spec-surface.spec.ts:107-116`), and the name-constant pattern beside `FIGHT_SCHEMA_NAMES`. The test names match their assertions, and both tests can fail (shown above).

## Coverage

Reviewed: the whole diff, plus the doc sections it touches read in full on the tree (`:1-75`, `:345-445`, `:445-560`, `:640-760`, `:830-845`, Extension points). Code checked: `validate.ts`, `parse-text.ts`, `depletion.ts`, `simulate.ts` (wait, spawn and severity paths), `effects.ts`, `markers.ts`, `research.ts`, `messages.ts`, `compare.ts`, `line-chart.tsx`, `results.tsx`, `docs/api/openapi.json` (jq).

REPO.md review checklist, Every diff: `npx next build` was not run and no page was loaded, because the diff touches no page or code (docs and one acceptance spec only). The AoE4 section's path list does not include `docs/` or `acceptance/`. I applied its "doc sentence contradicted by the code is blocking" rule anyway.

Not run: full `npm run acceptance`. The implementer reports 548 passed.

Processes: `next dev` on 3918 and the Playwright server on 3917 were stopped. Nothing is listening on either port.
