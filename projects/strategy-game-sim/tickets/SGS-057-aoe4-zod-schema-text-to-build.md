# SGS-057: Add the shared zod build schema and text-to-build conversion

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.1
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: existing public schema/API behavior changes (`BuildOrderIssue.suggestion` added to the OpenAPI schema); over 250 lines
       of business logic. No REPO.md critical path symbol changes. The route and every validator caller behave as before. -->
- **Invariants**: S3 (every request bounded: `SIM_INPUT_BOUNDS` and the 20000-character text cap are defined once in `schema.ts` and enforced by `textToBuildOrder`; the route keeps enforcing them until the route swap), A1 (the catalog is derived from the data files; no game number is written into schema code), A3 (checking is pure: same value and catalog, same issues in the same order)
- **LOC estimate**: about 500 added, about 150 deleted (business logic only: `schema.ts` about 450 including catalog, shapes, refinements, inputs and `nearestId`; `text-to-build.ts` about 35; `step-options.ts` `names` about 15; `validate.ts` about -150 for its own copies of `SIM_INPUT_BOUNDS`, `INPUT_DEFAULTS`, `TRIP_FIELDS`, `nodeRefIssue`, `NodeRefProblem` and `resolveSimInputs`, replaced by an import and re-export). Tests, OpenAPI excluded. Above the ~400 line guide; design "M4.1 ticket order" row 2a fixes this scope after splitting the caller swap into SGS-075, and the new module cannot be split further without leaving `checkBuildOrder` and `textToBuildOrder` unusable.
- **Depends on**: SGS-056 (`strictNullChecks`; `z.infer` needs it)
- **On merge**: `REPO.md schemaLibrary: zod`; `CONTEXT.md Key surfaces`: add `lib/aoe4-build-order/schema.ts` (`checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`) and `lib/aoe4-build-order/text-to-build.ts` (`textToBuildOrder`) (no `REPO.md` command changes)
- **Source**: M4 design contracts C1, C2, C3, C4a, Behavior rules "Validation (M4.1)" and "M4.1 ticket order" row 2a (`design/M4.md`); designer pass 4 (`reports/M4-designer-4.md`, Q1: split into 2a, 2b, 2c); plan outline B (`plans/M4-20261102.md`) as amended by designer pass 3 (`reports/M4-designer-3.md`: DQ1, Spec gaps 1, "Outline changes" 2); `BACKLOG.md` line 42 (owner: replace hand-rolled parsing/validation with zod; front end converts the paste before POST)

## Context

`lib/aoe4-build-order/validate.ts` (533 lines on origin/main `d5c2549`) is a hand-rolled validator over the
5-field threshold, and the route is the only place the paste is converted. The owner decided one zod schema
factory built from a JSON-serializable catalog of the English data replaces it, and one shared
`textToBuildOrder` turns a paste into a checked build, so the browser and the server run the same checks.
This ticket adds both as new code beside the old validator and changes no caller: `validate.ts` stays, the
route and the docs are untouched. SGS-075 re-points every caller and deletes the validator.

## Scope

All paths are relative to the repo root. Contract names are exactly those of C2, C3 and C4a in
`design/M4.md`; do not rename them.

**1. Dependency.** `package.json` `dependencies`: `"zod": "^4.6.7"`; update `package-lock.json`. Import from
`'zod'` (the v4 API; not `zod/v3`, not `zod/mini`). This is the only ticket that edits `package.json` in M4.1.

**2. `lib/aoe4-build-order/schema.ts` (new).** Exports exactly the C2 list: `BuildOrderCatalog`,
`buildOrderCatalog(data)`, `buildOrderShape`, `buildOrderSchema(catalog)`, `simInputsSchema(catalog)`,
`checkBuildOrder(value, catalog, lines?)`, `checkSimInputs(value, catalog)`, `resolveSimInputs(partial, data)`,
`nearestId(value, choices)`, `OPTIONAL_STEP_FIELDS`, `SIM_INPUT_BOUNDS`, `INPUT_DEFAULTS`, plus `nodeRefIssue`
and `NodeRefProblem` moved from `validate.ts` unchanged (the node-ref reasons are reused by the schema).
- `SIM_INPUT_BOUNDS` (including `textChars` 0..20000) and `INPUT_DEFAULTS` keep their values from
  `validate.ts` lines 15 to 52. `resolveSimInputs(partial, data)` keeps its name and signature and returns
  `checkSimInputs`'s result for `buildOrderCatalog(data)`.
- `BuildOrderCatalog extends StepOptions` with `civ`, `startVillagerTotal`, `defaultStart`,
  `startVillagerProducers`, `rejectedTechs` as in C2. It is built only from `GameData` (A1) and
  `JSON.parse(JSON.stringify(catalog))` deep-equals it. `buildOrderCatalog` reuses `stepOptions(data)`; it does
  not copy its id lists.
- `buildOrderShape` is data-free (types, enums, bounds, discriminators). `buildOrderSchema(catalog)` adds the
  id checks and cross-field checks that `OrderChecker` makes today (producer can produce unit, rally rules,
  `walkSeconds` without `rally`, research `at` site, repeated research, build of a villager producer with no
  rally, start villager sum, required `start.rally`, reaction trigger rule, rejected techs). Every schema for
  a build order type is annotated `z.ZodType<T>` against the declaration that `model.ts` still holds
  (`BuildOrder`, `BuildStep`, `Trigger`, `BuildStart`), so schema drift fails at compile time. Internals
  (`superRefine` vs `check`, how node refs are typed) are the implementer's choice provided the types match.
- Behavior (design "Validation (M4.1)"): issue order is `civ`, `name`, `steps` count, `start`, then steps by
  index, within a step in `STEP_FIELDS` order (trigger first), then that step's cross-field issues, then
  cross-step issues by the later step's index. A step's cross-field checks run only when that step's fields
  passed; cross-step checks only when every step passed its field checks; start checks only when `start`
  passed its field checks. Unknown keys are ignored and dropped from the returned order. Empty `steps` is
  valid; 201 steps is `out-of-range` (`steps: 201 steps, more than 200`); `walkSeconds: 0.5` is valid.
- Issue mapping (C3): code enum stays the seven values; every message keeps today's text (see the C3 table and
  the Behavior rules case table); the label is `line N` when `lines` is given, else `steps[i]`; order-level labels
  `civ`, `steps`, `start`; inputs `inputs.<path>`. With `lines`, step issues carry `lines.steps[step]` as `line`
  and start issues carry `lines.start`; order-level issues carry no `line`.
- `BuildOrderIssue.suggestion` is set only on `unknown-id` issues for `unit`, `building`, `producer`, `tech`,
  `at` and node fields, and on `unknown-trigger-kind`: the `nearestId` of the given value among that kind's
  catalog ids (trigger kinds: `time`, `villagers`, `depleted`, `bank`).
- `nearestId`: case-insensitive Levenshtein distance (no dependency); returns the least-distance choice when
  the distance is at most `max(1, floor(value.length / 3))`, ties to the earliest choice in catalog order;
  distance 0 with different case returns the choice (`"Knight"` returns `knight`); otherwise `undefined`.
- `OPTIONAL_STEP_FIELDS` has the same set as today's `STEP_FIELDS` `opt` entries: produce `instance, count,
  rally, walkSeconds`; rally `instance, walkSeconds`; pause `instance`; build `builders, then, walkSeconds`;
  research `at`; move `walkSeconds`.
- Browser-safe: `schema.ts` imports `data.ts` only as `import type`, and imports no `fs` or `node:` module.

**3. `lib/aoe4-build-order/text-to-build.ts` (new).** `TextToBuildResult` and
`textToBuildOrder(text, catalog)` exactly as C4a: (1) `text.length > SIM_INPUT_BOUNDS.textChars.max` gives one
`out-of-range` issue `text: <n> characters, more than 20000` and stops (20000 is accepted); (2)
`parseBuildOrderText`, parse issues returned as they are (no `lines`); (3) `checkBuildOrder(order, catalog,
lines)`, issues returned with `lines`. Imports only `parse-text.ts`, `schema.ts` and types; never `data.ts` as a
value or `fs`.

**4. `lib/aoe4-build-order/step-options.ts`.** `StepOptions` gains `names: Readonly<Record<string, string>>`
(baseId to the entry's display `name`, for every id in `buildings`, `producers`, the ids in
`unitsByProducer` and `techs`). `stepOptions(data)` fills it. Update `step-options.test.ts` (covers `names`,
including surviving JSON) and the `StepOptions` fixtures in `components/apps/aoe4-build-order/step-table-model.test.ts`
if they build an object literal.

**5. `lib/aoe4-build-order/validate.ts` (kept).** Delete its own copies of `SIM_INPUT_BOUNDS`,
`INPUT_DEFAULTS`, `TRIP_FIELDS` (and any helper only the moved code used), `nodeRefIssue`, `NodeRefProblem` and
`resolveSimInputs`; import them from `./schema` and re-export `SIM_INPUT_BOUNDS`, `nodeRefIssue`,
`NodeRefProblem` and `resolveSimInputs` (the four it exports today) so every importer keeps working. A helper
both files need lives only in `schema.ts`. `validateBuildOrder`, `ValidateOptions` and its behavior are
unchanged. `validate.ts` and its two test files are otherwise untouched; SGS-075 deletes them.

**6. `lib/aoe4-build-order/model.ts`.** `BuildOrderIssue` gains `suggestion?: string`. `BuildOrder`,
`BuildStep`, `Trigger`, `BuildStart` stay declared here (SGS-075 turns them into `z.infer` re-exports), so
`data.acceptance.test.ts` is not edited.

**7. Tests (all new files written fresh: no block copied from `validate.test.ts` or
`validate.acceptance.test.ts`, because the `lint:dup` jscpd threshold is 0).**
- `lib/aoe4-build-order/schema.test.ts`: JSON-only cases (wrong types per field, `walkSeconds: 0.5` valid,
  unknown keys dropped and never an issue, non-object root, `steps` length 201 invalid and 200 valid, empty
  `steps` valid); issue ordering and the field vs cross-field rule (a step with a bad field reports no
  cross-field issue; a bad step suppresses cross-step issues; a bad `start` suppresses the villager sum);
  `suggestion` only where specified; `nearestId` table (match, case-insensitive, tie to earliest,
  over-threshold gives `undefined`, exact-different-case); `OPTIONAL_STEP_FIELDS` agrees with the schema
  (omitting each listed field is valid, omitting any other field is `syntax` `missing <field>`);
  `checkSimInputs` bounds (59 and 3601 invalid, 60 and 3600 valid), defaults (`INPUT_DEFAULTS`), unknown node
  and building ids; catalog is JSON-serializable and deterministic; `SIM_INPUT_BOUNDS` and `INPUT_DEFAULTS`
  have the values listed in `validate.ts` today; `checkBuildOrder` returns `ok: true` for every build in
  `listBuilds()`; `resolveSimInputs` returns what `checkSimInputs` returns.
- `lib/aoe4-build-order/text-to-build.test.ts`: every issue case in the design's Behavior rules "Validation"
  table that can be written as paste is tested once, as text in and issues out with its `line`; 20000
  characters accepted, 20001 rejected with the `text:` message and not parsed; parse issues have no `lines`;
  check issues have `lines`; `''` returns what `parseBuildOrderText('')` returns; repeat gives equal results.
- Rule for existing tests: no existing expectation changes, because `validateBuildOrder` and the route are
  unchanged. A test the move of constants breaks (an import path) is the only permitted edit. The implementer
  lists every existing test it edits.

**8. OpenAPI.**
- `docs/api/openapi.json`: add `suggestion` (optional string, description: the nearest valid id, present
  only on `unknown-id` and `unknown-trigger-kind` issues) to `BuildOrderIssue.properties`, not `required`.
  `info.version` stays `1.0.0`.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: the `buildOrderIssue` `Record<keyof BuildOrderIssue, true>`
  (line 490 on origin/main) gains `suggestion: true`; the `optional` map (line 122) gains `suggestion` for
  `BuildOrderIssue`. The `SIM_INPUT_BOUNDS` import stays on `validate` (SGS-075 re-points it).

**Out of scope:** the route, `api.ts`, `docs/aoe4-build-order.md` and `data/aoe4-build-order/README.md`
(SGS-075 and the remove-`text` ticket); re-pointing any importer, deleting `validate.ts` or its tests,
`model.ts` `z.infer` re-exports and the `data.acceptance.test.ts` list, `buildOrderFrom` (SGS-075);
`data-schema.ts` and the `data.test.ts` rewrite (SGS-058); the page, `PageProps`, the `StepTable` prop rename,
`IssueList` and `runRejected` (page ticket); rewriting any API spec body to `buildOrder` (specs ticket);
removing `text` from the route, OpenAPI `2.0.0`; the paste grammar (`parse-text.ts` is unchanged); engine,
data files and `simulate.ts`; `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm ls zod` shows zod 4.x and `jq -r .dependencies.zod package.json` prints `^4.6.7`; no file imports `zod/v3` or `zod/mini` (`git grep -nE "zod/(v3|mini)" -- '*.ts' '*.tsx'` prints nothing).
- [ ] `schema.ts` exports exactly the C2 names listed in Scope 2 (plus `nodeRefIssue`, `NodeRefProblem`); `text-to-build.ts` exports `textToBuildOrder` and `TextToBuildResult`; neither imports `data.ts` as a value or any `fs` / `node:` module (`git grep -nE "^import [^t].*'(\./data|fs|node:[a-z]+)'" -- lib/aoe4-build-order/schema.ts lib/aoe4-build-order/text-to-build.ts` prints nothing).
- [ ] One copy of each moved name: `git grep -nE "(const|function|interface) (SIM_INPUT_BOUNDS|INPUT_DEFAULTS|nodeRefIssue|NodeRefProblem|resolveSimInputs)\b" -- lib` prints 5 lines, all in `validate.ts`, today; after the change it prints 5 lines, all in `schema.ts`. `validate.ts` still exports `SIM_INPUT_BOUNDS`, `nodeRefIssue`, `NodeRefProblem`, `resolveSimInputs`, `validateBuildOrder` and `ValidateOptions`, and `validate.test.ts` and `validate.acceptance.test.ts` pass unedited.
- [ ] Mutation check: changing `SIM_INPUT_BOUNDS.durationSeconds.max` in `schema.ts` from 3600 to 3601 fails the `checkSimInputs` bounds case in `schema.test.ts`.
- [ ] `checkBuildOrder` of the pasted knight + longbow build text via `textToBuildOrder` with the English catalog returns `ok: true` with `lines`; `checkBuildOrder` returns `ok: true` for every build in `listBuilds()` (`schema.test.ts`).
- [ ] `textToBuildOrder` of a paste with unit `knigt` produced at `stable` returns one `unknown-id` issue with `line` set to that paste line, message `line N: unknown unit "knigt" in unit`, and `suggestion: "knight"`; with `trigger kind` `soon` it returns `unknown-trigger-kind` with the `nearestId` suggestion or none when over the threshold.
- [ ] A text of 20000 characters is accepted for conversion; 20001 gives one `out-of-range` issue `text: 20001 characters, more than 20000` and is not parsed (unit test). The route is unchanged: `git diff --stat origin/main -- pages/api` is empty, and `POST /api/aoe4-build-order/simulate` with a `text` of 20001 characters still returns 400 with that issue (existing spec unchanged).
- [ ] A step whose field fails (for example `unit: "knigt"`) reports no cross-field issue for that step, and a build with a field issue in any step reports no cross-step issue (`research` twice); both asserted in `schema.test.ts`.
- [ ] `checkSimInputs` rejects `durationSeconds` 59 and 3601 with `out-of-range` `inputs.durationSeconds: 59 is outside 60..3600`, accepts 60 and 3600, and an empty `inputs` resolves to `INPUT_DEFAULTS` plus the data defaults; `resolveSimInputs(partial, data)` returns the same result.
- [ ] `buildOrderCatalog(ENGLISH)` is deep-equal after a JSON round trip and `StepOptions.names` maps `knight` to the entry's display name (unit test).
- [ ] `docs/api/openapi.json` `BuildOrderIssue.properties.suggestion` exists, is a string, and is not in `required`; `info.version` is still `1.0.0`; `npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts` passes.
- [ ] No existing test outside `step-options.test.ts`, `step-table-model.test.ts` fixtures and the contract spec rows changes its expected values; `docs/aoe4-build-order.md` is unchanged.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` pass; `npm test` passes; `npm run acceptance` passes (Node 24).
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: the ticket bundled the new schema with the caller swap, deletion of `validate.ts` and the route change (about 620 lines added, 533 deleted); designer pass 4 split it (row 2a keeps this id, row 2b is SGS-075, row 2c is SGS-058).
- Changed: narrowed to the new modules, `StepOptions.names`, `BuildOrderIssue.suggestion` with OpenAPI and contract-spec rows, and `validate.ts` re-exporting the moved names; the importer re-pointing, deletions, route swap, `model.ts` `z.infer` re-exports, `buildOrderFrom` and docs text moved to SGS-075; open question 1 (size) is answered by the split.
- Branch work: none exists yet (status draft).
