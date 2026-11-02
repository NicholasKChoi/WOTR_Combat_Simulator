# SGS-054: Audit the M3 docs and OpenAPI for completeness, write the cross-cutting M3 doc sections, and pin the schema names

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.9 (docs and OpenAPI half; the Playwright flow is SGS-055); backlog: spec-surface pinned names, OpenAPI `ResourceKind` unreferenced
- **Priority**: medium
- **Risk**: standard
  <!-- Plan said low. No business logic and no new contract, but the audit may edit docs/api/openapi.json
       (the public contract) and the change edits the fight spec-surface acceptance spec, which spans the
       WOTR and AoE4 schemas. "When in doubt, pick the higher tier." -->
- **Invariants**: none changed. Adjacent only in prose: A1 (game numbers from versioned data; the doc names the `base.json` amounts as owner-supplied, unverified), A2 (the doc's bank rules), A3 (determinism statement stays true).
- **LOC estimate**: 0 business logic. About 120 lines of prose in `docs/aoe4-build-order.md`, about 30 lines in `acceptance/fight-api-spec-surface.spec.ts`, and whatever description or reference fixes the OpenAPI audit finds (each a line or two).
- **Depends on**: SGS-038, SGS-039, SGS-040, SGS-041, SGS-042, SGS-043, SGS-044, SGS-045, SGS-046, SGS-047, SGS-048, SGS-049, SGS-050, SGS-051 (plan outline T: D to Q). SGS-036 and SGS-053 are also dependencies (the graph row lists them). Transitively SGS-035, SGS-037.
- **On merge**: `MILESTONES.md` M3.9: mark satisfied once this ticket and SGS-055 have both merged (this ticket completes the docs, OpenAPI and contract-check half; SGS-055 the Playwright half). No REPO.md or CONTEXT.md change.
- **Source**: M3.9; `design/M3.md` ("Left to tickets": the M3.9 doc and OpenAPI split, and the list of what the doc must state; Contracts: OpenAPI; Severity; Markers; Node references); `plans/M3-20261101.md` outline T and owner-approved answers to design questions 8 (each ticket updates its own doc sections, T audits) and 4 (the paste round-trip belongs to SGS-040); backlog items for `acceptance/fight-api-spec-surface.spec.ts` and `ResourceKind`.

## Context

Every earlier M3 ticket changes `docs/aoe4-build-order.md` and `docs/api/openapi.json` for its own behavior, so no
ticket sees the whole. This ticket is the last pass: it checks that the finished doc and spec cover every M3
input, trigger, warning, severity, step wait, timeline, chart marker, deposit form and reaction, writes the
cross-cutting text that no earlier ticket owns, and pins the schema names so a missing or stray schema fails a test.

Written before any M3 ticket has merged: every line number below is from `origin/main` f078c11 and will have moved.
Re-read both files on the merged tree before editing.

## Scope

### 1. Audit `docs/aoe4-build-order.md` against this checklist

For each row, find where the merged doc states the item (the grep token is a quick check, not a substitute for
reading the sentence). A row the doc lacks, states differently from the code and the tickets named, or states in
two places that disagree, is fixed in this ticket. Do not rewrite a section an earlier ticket wrote and got right.

| M3 item | owner ticket | doc must state | grep token (0 hits on `main` unless noted) |
|---|---|---|---|
| Finite nodes, default amounts (owner-supplied, unverified), `null` = infinite, `farm` and `wood` never run out | SGS-038, SGS-039 | where amounts come from, the override, which nodes are infinite | `nodeAmounts` |
| Run-out, idle villagers, idle arrivals, `depletions` | SGS-038 | stock, run-out instant, idle accounting, result fields | `idle-arrival` |
| Numbered gold deposits, `move all`, `build ... then` = created node | SGS-038, SGS-040 | node refs, `move all`, no second walk | `gold#2`, `move all` |
| `depleted` and `bank` triggers, reactions (JSON and paste) | SGS-039, SGS-040 | four trigger kinds, reaction ordering, `triggerAtLeast` bound, issue rows | `reaction` |
| Step wait status, `step-stuck` | SGS-042 | `waitingOn`, `waitBreakdown`, check order, horizon rules | `waitBreakdown`, `step-stuck` |
| Spend and population series | SGS-043 | `spent`, `spawnedPopulation`, `populationCapReachedAt` | `spawnedPopulation` |
| Chart markers (data and drawing) | SGS-044, SGS-049 | `markers` bullet, marker lines and legend on the page | `markers` |
| Note ids, multi-tier tech, note severity | SGS-041 | notes name the tech by `baseId`, tier pick, `info` | read the research and Outputs `notes` text |
| Message lists | SGS-045 | warnings list, collapsed info list, toggle, 400 shows only the error | read the Page section |
| Step table, timeline, pin and compare | SGS-046, SGS-047, SGS-048 | Page section | `timeline` |
| Issue cap | SGS-036 | `omittedIssues`, 100, "N more issues not shown." | `omittedIssues` |
| Prebuilt builds | SGS-039, SGS-040, SGS-050, SGS-051 | the bar (five parts, both horizons) and the three builds | read the section |
| Duplication check | SGS-035 | lives in `ARCHITECTURE.md`, not this doc | none |

Also re-read the places a feature ticket tends to leave stale and fix any that remain:

- the intro and "Purpose and model" (`:1-30`): the result description ("graphs over time of units produced, gather rates and floating resources") and the model bullets;
- the bounds table (`:44-56`): `nodeAmounts` (int 0..100000, `null`), `Trigger.atLeast` (int 0..100000), `move.count` `all`, the 100 issue cap;
- the Issue codes table (`:429-435`): every new `invalid`, `out-of-range`, `unknown-id`, `syntax` row from the design tables, and the count word in "The six `invalid` rules";
- the Outputs list and the sentence after it ("The page draws three graphs ..."), the step-state diagram and table, and the "A step waits while ..." paragraph;
- the Extension points table (`:603-619`): "Event or resource triggers, combinators", "Depletion, positions, per-trip deposits", "More series or notes", "More technology effects, combat";
- no ticket id (`SGS-...`), milestone id (`M3.x`) or pointer into a factory file appears in the doc.

### 2. Write the cross-cutting sections (the only new prose this ticket owns)

Earlier tickets deliberately left these to this one (SGS-037, 040, 044, 049, 050, 051 name it). Put each in one place
and make every other mention agree with it or point to it by section name.

1. **Node references** (in "Build order input"): the design's node-ref table in full (`gold`, `gold#2`..`gold#8` valid; `gold#1` invalid; `gold#0`/`gold#9` out-of-range; `wood#2`, `berry#2`, `stone#2` invalid; `iron` unknown-id; `gold#02`, `gold#`, `gold#x`, `gold#2#3` syntax; `farm`/`wood` invalid where the position needs a finite node). State where a ref is accepted (every node field of every step, `start`, the `depleted` trigger, `nodeAmounts` keys), that deposit 1 is plain `gold`, that paste passes the token through to validation unchanged, that every node position gives the same issue for the same value (`nodeRefIssue` returns a problem with a `code` of `syntax`, `unknown-id`, `out-of-range` or `invalid` and a `reason` clause that quotes the value; the issue message is `<reason> in <path>`, as in `unknown node "iron" in start.rally`; a non-string value is `syntax`), that `trips` and `houseBuilderSource` stay per node kind, and that every deposit shares `trips.gold`. Confirm the JSON examples in "Build order input" and the paste examples agree with this table.
2. **Severity**: a section with the scale (`error`, `warning`, `info`, most severe first), the design's per-code table (request issues are `error` and have no field; `tech-effect-ignored` and `tech-effect-unmodeled` are `info`; `node-depleted` is `warning` when `idleVillagers > 0`, else `info`; `idle-arrival` and `step-stuck` are `warning`), the sentence that no result item has `error` in M3, and how the page lists them (a pointer to the Page section).
3. **Unit combat stats are not modeled**: state it plainly in "Purpose and model" and again in "Technologies": there is no combat, and blacksmith and other combat technologies and unit upgrades cost resources and queue time and mark the charts, but change no unit stat (hitpoints, attack, armor or similar). Update the "Out:" line (`:323`, which still says resource depletion is out) and the "More technology effects, combat" Extension points row so neither contradicts it.
4. **Marker classification order**: confirm there is exactly one statement of the order. It lists the four rules in the design's order (`economy` if `classes` includes `economic_upgrade`; `unit-tier` if `type === 'upgrade'` or `classes` includes `scar_unit_upgrade`; `blacksmith` if `producedBy` includes `blacksmith`; `other`), says the first match wins, that `age-up` comes only from a landmark, and the label rule. If SGS-044's bullet states it loosely, tighten it there; do not add a second copy.
5. **Prebuilt builds**: the section names all three builds and states the bar. If SGS-050 or SGS-051 left it unlisted, list them.

### 3. Audit `docs/api/openapi.json`

The earlier tickets changed it in their own diffs. Check, on the merged tree, with `jq`:

- Schema names equal the TypeScript names. There are 27 AoE4 schemas: the 16 on `main` (`BuildOrder`, `BuildOrderIssue`, `BuildOrderNote`, `BuildStart`, `BuildStep`, `CivId`, `GatherNodeId`, `ResourceKind`, `SimInputOverrides`, `SimulateError`, `SimulateRequest`, `SimulationResult`, `StepTiming`, `Trigger`, `TripInputOverrides`, `UnitSeries`) plus the 11 M3 adds (`FiniteGatherNodeId`, `DepositRef`, `NodeRef`, `FiniteNodeRef`, `Severity`, `SimWarning`, `StepWait`, `SpendCategory`, `NodeDepletion`, `ChartMarkerKind`, `ChartMarker`). A name from the design that is missing is added; a name the design lacks is removed or reported.
- Every M3 input and field is present (the table in step 1 maps each to its ticket): `SimulateError.omittedIssues`; `SimInputOverrides.nodeAmounts`; `BuildStep` node fields `$ref` `NodeRef`; `move.count` integer or `all`; `reaction` on all six `BuildStep` variants; the `depleted` and `bank` `Trigger` variants; `StepTiming.waitingOn` and `waitBreakdown`; `BuildOrderNote.severity`; `SimulationResult.depletions`, `warnings`, `spent`, `spawnedPopulation`, `populationCapReachedAt`, `markers`, each in `required`.
- The 200 example and any other example carry every new required field (the contract spec validates them), and the fields a reader would look for in the examples (a deposit ref, a `reaction` step, a warning, a marker) appear in at least one example or description.
- Every schema is referenced by a path or another schema, with no exemption. On `main` only `ResourceKind` is unreferenced (the `bank` trigger's `resource` fixes that, SGS-039). The design fixes the references: `NodeRef` is a `oneOf` of `GatherNodeId` and `DepositRef`; `FiniteNodeRef` a `oneOf` of `FiniteGatherNodeId` and `DepositRef`; `SimulationResult.spent` has `propertyNames` `$ref` `SpendCategory`; `SimInputOverrides.nodeAmounts` has `propertyNames` `$ref` `FiniteNodeRef`. Check they landed (SGS-037, SGS-038, SGS-043); if one is missing, add it here without changing any accepted or emitted value.
- No description is stale: the two lines that say "neither time nor villagers" / "other than time or villagers" (`Trigger` and `BuildOrderIssue.code`) are gone, and no description says a list is "empty today" or a node "never runs out".

### 4. Pin the schema names in `acceptance/fight-api-spec-surface.spec.ts`

Today the test "has exactly the pinned fight schema names" (`:46-58`) only filters the schemas to the fight names, so
a stray or missing AoE4 schema passes. Add `AOE4_SCHEMA_NAMES` (the 27 names above, `DepositRef` included) beside `FIGHT_SCHEMA_NAMES` and a test
that `Object.keys(schemas).sort()` equals the fight names (all of `FIGHT_SCHEMA_NAMES` except `ArmyCount`, which the spec
does not define and the existing test already skips) plus `AOE4_SCHEMA_NAMES`, sorted: 9 + 27 = 36 names after, 25 on
`main`. Add a test that every schema in `components.schemas` is the target of at least one `$ref` in the spec (the backlog's
`ResourceKind` item, stated generally). Both read the JSON file only.

**Out of scope:** any engine, parser, validator, page or data change; the Playwright flow (SGS-055); the `design/M2.md` and
M2 doc wording fixes (SGS-053); rewriting sections the feature tickets wrote correctly; the `m:ss` formatter question
(SGS-042 / SGS-047) and the other `designer` questions recorded on earlier tickets, which stay as written; ARCHITECTURE.md
and README.md (SGS-035 owns the duplication-check line); verifying the prebuilt builds' numbers (SGS-050, SGS-051).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

Commands run from the repo root under Node 24 (`source ~/.nvm/nvm.sh && nvm use 24`). "On `main`" values were measured on
`origin/main` f078c11.

- [ ] Schema count and names: `jq '.components.schemas | length' docs/api/openapi.json` prints 25 on `main` and 36 after; `jq -r '.components.schemas | keys[]'` lists exactly the 9 fight names (without `ArmyCount`) and the 27 AoE4 names in Scope 3.
- [ ] `SimulationResult.required` has 10 entries on `main` and 16 after (`jq '.components.schemas.SimulationResult.required | length'`), the six new ones being `depletions`, `warnings`, `spent`, `spawnedPopulation`, `populationCapReachedAt`, `markers`.
- [ ] `ResourceKind` is referenced: `grep -c '#/components/schemas/ResourceKind' docs/api/openapi.json` prints 0 on `main` and at least 1 after, and no schema is unreferenced, `FiniteGatherNodeId`, `DepositRef` and `SpendCategory` included, with no exemption list (the new test in Scope 4 passes).
- [ ] Coverage tokens: for each of `nodeAmounts`, `gold#2`, `move all`, `node-depleted`, `idle-arrival`, `step-stuck`, `waitingOn`, `waitBreakdown`, `spawnedPopulation`, `populationCapReachedAt`, `markers`, `omittedIssues`, `reaction`, `severity`, `timeline`: `grep -c -F -- '<token>' docs/aoe4-build-order.md` prints 0 on `main` and at least 1 after (`reaction` and `severity` also match prose, so read the hit).
- [ ] No stale statements: `grep -c -E "Resources are infinite|never runs out|resource depletion|At most one step is armed|is not .time. or .villagers.|Its controls are" docs/aoe4-build-order.md` prints 5 on `main` and 0 after; `grep -c -E "neither time nor villagers|other than time or villagers" docs/api/openapi.json` prints 2 on `main` and 0 after.
- [ ] No factory references: `grep -c -E "SGS-[0-9]+|M[0-9]\.[0-9]+" docs/aoe4-build-order.md` prints 0 on `main` and 0 after.
- [ ] Combat statement: `grep -c -i "unit combat stats are not modeled" docs/aoe4-build-order.md` prints 0 on `main` and at least 1 after, and the sentence beside it says combat technologies and unit upgrades cost resources and queue time, mark the charts, and change no unit stat.
- [ ] The severity section lists every code and its rule: `node-depleted` (`warning` when `idleVillagers > 0`, else `info`), `idle-arrival`, `step-stuck`, `tech-effect-ignored`, `tech-effect-unmodeled`, and request issues as `error`. Each row agrees with the `severity` the engine sets (`grep -n "severity" lib/aoe4-build-order/depletion.ts lib/aoe4-build-order/research.ts lib/aoe4-build-order/simulate.ts`).
- [ ] The node-reference section reproduces every row of the design table, and a spot check through `POST /api/aoe4-build-order/simulate` gives the documented issue code for `gold#1` (`invalid`), `gold#9` (`out-of-range`), `wood#2` (`invalid`), `iron` (`unknown-id`) and `gold#02` (`syntax`) in a `move` step's `to`.
- [ ] The marker classification order is stated once and equals the code: `economy`, `unit-tier`, `blacksmith`, `other`, first match wins (compare with `researchMarkerKind` in `lib/aoe4-build-order/markers.ts`).
- [ ] `acceptance/fight-api-spec-surface.spec.ts` has the two new tests. Mutation checks: deleting the `Severity` schema (or adding a throwaway schema) from a copy of `docs/api/openapi.json` fails the name-equality test, and removing the only `$ref` to a schema fails the reference test; run both in a throwaway worktree and report the result. Note: the name-equality assertion was checked on `main` with a Node script only (16 AoE4 names + 9 fight names equal the 25 keys today); the Playwright test itself needs Node 24.
- [ ] Contract check: `npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts acceptance/fight-api-spec-surface.spec.ts` passes, and the full `npm run acceptance` shows no new failure beyond the SGS-055 specs.
- [ ] `npm test` and `npx tsc --noEmit && npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
