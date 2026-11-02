# SGS-058: Check the shipped rules and snapshot data files with zod schemas in data.test.ts

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.1
- **Priority**: medium
- **Risk**: low
  <!-- one component; a new test-time-only module with no runtime importer; no public surface change; no
       adjacent invariant; about 90 lines of business logic. -->
- **Invariants**: none (A1 is adjacent only in that the data files stay the single source of game numbers; the schemas check shape, hold no game value, and run in tests only)
- **LOC estimate**: about 90 (business logic only: `data-schema.ts` three schemas plus the shared `HandValue` and source shapes). Tests excluded.
- **Depends on**: SGS-057 only, not SGS-075 (the zod dependency, `strictNullChecks` through SGS-056, and the `z.ZodType<T>` annotation convention used by `schema.ts`)
- **On merge**: none
- **Source**: M4 design contract C2 "Data files" and module table row `data-schema.ts`, "M4.1 ticket order" row 2c (`design/M4.md`); plan outline C (`plans/M4-20261102.md`) and its question 7, accepted by designer pass 3 (`reports/M4-designer-3.md`) as its own ticket after the schema ticket

## Context

`lib/aoe4-build-order/data.test.ts` checks the shape of the shipped data by hand, field by field (the
snapshot `source` strings, the 40-hex `commit`, the `http` `patchSource`, and a `source` and `unverified`
on every hand value found by walking the rules files). The design replaces those per-field assertions
with zod schemas of the three data files, typed against the existing `data.ts` types, so a malformed
data file fails one test with a path instead of a loop of `expect`s. The schemas are test-time only; no
runtime code imports them.

## Scope

All paths are relative to the repo root. Facts below are from origin/main `d5c2549`; line numbers will
have moved after SGS-056 and SGS-057 and are only locators.

**1. `lib/aoe4-build-order/data-schema.ts` (new).** Imports `zod` (v4, `from 'zod'`) and types only from
`./data` and `./model` (`import type`); it imports no JSON file and no `fs` or `node:` module. Exports
exactly three schemas, with the names of design C2:
- `snapshotFileSchema: z.ZodType<Snapshot>` for `data/aoe4-build-order/aoe4world/english.json`: `source`
  (`SnapshotSource`: `repo`, `commit`, `committedAt`, `fetchedAt`, `patch`, `patchSource`, each a non-empty
  string; `commit` matches `^[0-9a-f]{40}$`; `patchSource` starts with `http`) and the arrays `units`,
  `buildings`, `technologies`, `upgrades` of `SnapshotEntry` (`id`, `baseId`, `name`, `type` of the four
  literals, `civs`, `age`, `classes`, `producedBy`, `costs` with `food`, `wood`, `gold`, `stone`, `popcap`,
  `time`, optional `effects` of `SnapshotEffect`, optional `description`). Upstream entries carry many more
  fields (`pbgid`, `attribName`, and so on); the schema ignores unknown keys and does not use `strict`.
- `baseRulesFileSchema: z.ZodType<BaseRules>` for `rules/base.json`: `gatherNodes` with one `GatherNodeRules`
  per `GatherNodeId` (`resource`, `rate`, `capacity`, `rateProperties`, `capacityProperties`, `dropOffs`,
  `trip` with three `HandValue<number>`, optional `amount`, optional `createdBy`), `builderScaling`,
  `maxPopCap`, `walkSeconds`.
- `civRulesFileSchema: z.ZodType<CivData>` for `rules/english.json`: `startingState` (`age`, `resources`,
  `villagers`, `units`, `buildings`, each a `HandValue`), `supply` (record of `HandValue<number>`),
  `effects` (`OverlayEffect`: the `SnapshotEffect` fields plus `grantedBy`, optional `condition` with
  optional `age`, `nearBuilding`, `producer`, `source`, `unverified`), `upgradeTargets` (record of
  `HandValue<string>`).
- One shared `HandValue` schema: `value`, `source` a non-empty string, `unverified` a boolean. The only
  game-data literals allowed in the file are the enum members the existing types already name (the four
  entry types, the eight `GatherNodeId`s, the four `ResourceKind`s); derive them from `model.ts` constants
  (`GATHER_NODES`, `RESOURCE_KINDS`) rather than retyping them. No amounts, rates, ids or ages appear.
- Each schema is annotated `z.ZodType<T>` so a field added to a `data.ts` type without a schema change
  fails `tsc`. Internals (`z.object` vs shared fragments, `z.record` over an enum) are the implementer's
  choice.

**2. `lib/aoe4-build-order/data.test.ts`.** Add a `describe('data file schemas')` that imports the three JSON
files (the file already imports all three) and:
- parses each file with its schema and expects success; on failure the test prints the zod issues with
  their paths (`result.error.issues`);
- for each schema, parses a `structuredClone` with one defect and expects failure, the defects being: a
  `commit` that is 39 hex characters, a `patchSource` that does not start with `http`, an empty `source` on a
  hand value, a hand value with a missing `unverified`, a hand value with a string `value` where a number is
  required (for example `gatherNodes.sheep.rate.value`), a missing `gatherNodes` node, an overlay effect
  without `grantedBy`, a snapshot entry with `type: 'hero'`.
- Remove what the schemas replace: the `source` string, 40-hex and `http` assertions in the `snapshot`
  test (keep the `holds only English entries, each id unique` test), and the `labels every value with a
  source and whether it is verified` test in `hand-entered values`.
- Keep every other test unchanged: the `handValues` walk and its counts (`finds every value in both rules
  files`), the owner-observed verified set, node amounts, all `rules references` cross-file checks,
  `loadGameData` and `buildGameData` tests. Value assertions and cross-file reference checks stay as tests
  (design C2). The implementer lists every assertion it removes or moves.

**3. No other edits.** No runtime file (`data.ts`, `schema.ts`, the route, a page) imports `data-schema.ts`.
`data.ts` types are not changed; if a schema cannot satisfy `z.ZodType<T>` because of a type (for example an
optional field typed `T | undefined`), report it in the PR rather than loosening the type. No docs name
`data.test.ts` or per-field data assertions today (`git grep` of `docs/` and `data/aoe4-build-order/README.md`
for `data.test` finds nothing), so no doc changes.

**Out of scope:** `schema.ts`, `text-to-build.ts`, the route, `package.json` (SGS-057 added zod); changing
any data file or value; schema checks at runtime or in `loadGameData` / `buildGameData`; the value and
cross-file assertions in `data.test.ts`; `data.acceptance.test.ts`; `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `lib/aoe4-build-order/data-schema.ts` exports exactly `snapshotFileSchema`, `baseRulesFileSchema`, `civRulesFileSchema`, each annotated `z.ZodType<Snapshot>`, `z.ZodType<BaseRules>`, `z.ZodType<CivData>` (`git grep -n "z.ZodType<" lib/aoe4-build-order/data-schema.ts` prints three lines); `npx tsc --noEmit` passes.
- [ ] No runtime importer: `git grep -ln "data-schema" -- lib components pages acceptance ':!lib/aoe4-build-order/data-schema.ts' ':!*.test.ts'` prints nothing (it prints nothing today and must still print nothing), and the file imports `./data` and `./model` only with `import type` and no JSON, `fs` or `node:` module (`git grep -nE "^import [^t].*'(\./data|\./model|fs|node:[a-z]+)'|\.json'" -- lib/aoe4-build-order/data-schema.ts` prints nothing, except `./model` imports of the constants `GATHER_NODES` and `RESOURCE_KINDS`, which are the one allowed value import).
- [ ] `data.test.ts` parses the three shipped files with their schemas and each succeeds (unit test).
- [ ] Each of these defects fails the matching schema, one test per defect in `data.test.ts`: 39-hex `commit`; `patchSource` not starting `http`; empty hand-value `source`; hand value without `unverified`; string `value` at `gatherNodes.sheep.rate.value`; a missing `gatherNodes` node; overlay effect without `grantedBy`; snapshot entry `type: 'hero'`. Reverting the schema's `commit` rule makes the 39-hex test fail.
- [ ] The per-field assertions the schemas replace are gone from `data.test.ts`: `git grep -nE "0-9a-f\]\{40\}|startsWith\('http'\)|typeof value\.unverified|typeof value\.source" -- lib/aoe4-build-order/data.test.ts` prints nothing (4 lines on origin/main `d5c2549` before the change; none of the new defect tests may use these patterns, they assert through `safeParse`).
- [ ] Every other `data.test.ts` test and the count thresholds of `finds every value in both rules files` are unchanged and pass; the PR body lists every removed or moved assertion.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint:dup` pass; `npm run acceptance` still passes (Node 24).
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: the ticket split of SGS-057 (designer pass 4); this ticket is row 2c of the M4.1 order.
- Changed: Source row 2b to 2c; Depends on stays SGS-057 only (independent of SGS-075).
- Stands: all Scope and criteria.
