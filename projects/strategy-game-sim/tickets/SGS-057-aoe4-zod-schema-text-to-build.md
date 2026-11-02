# SGS-057: Replace the hand-rolled build validator with a shared zod schema and a text-to-build conversion

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.1
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: existing public schema/API behavior changes (route validation swaps, issue order and
       combined-issue behavior change, `BuildOrderIssue.suggestion` added to the OpenAPI schema); over 250 lines
       of business logic. No REPO.md critical path symbol changes. -->
- **Invariants**: S3 (every request bounded: `SIM_INPUT_BOUNDS` and the 20000-character text cap must still be enforced on every path that reaches the engine), A1 (the catalog is derived from the data files; no game number is written into schema code), A3 (checking is pure: same value and catalog, same issues in the same order)
- **LOC estimate**: about 620 added, about 533 deleted (business logic only: `schema.ts` about 450 including catalog, shapes, refinements, inputs and `nearestId`; `text-to-build.ts` about 35; `step-options.ts` `names` about 15; route about -30; `model.ts` type declarations about -60 replaced by re-exports; `acceptance/helpers.ts` `buildOrderFrom` about 15). Tests, OpenAPI and docs excluded. Over the ~400 line sizing guide, see Open questions 1.
- **Depends on**: SGS-056 (`strictNullChecks`; `z.infer` needs it)
- **On merge**: `REPO.md schemaLibrary: zod`; `CONTEXT.md Key surfaces`: add `lib/aoe4-build-order/schema.ts` (`checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`) and `lib/aoe4-build-order/text-to-build.ts` (`textToBuildOrder`); `acceptance/helpers.ts` `buildOrderFrom` is the one way specs convert paste (no `REPO.md` command changes)
- **Source**: M4 design contracts C1, C2, C3, C4a, Behavior rules "Validation (M4.1)", "Docs and OpenAPI (M4.14)" and "M4.1 ticket order" row 2 (`design/M4.md`); plan outline B (`plans/M4-20261102.md`) as amended by designer pass 3 (`reports/M4-designer-3.md`: DQ1, Spec gaps 1, "Outline changes" 2); `BACKLOG.md` line 42 (owner: replace hand-rolled parsing/validation with zod; front end converts the paste before POST)

## Context

`lib/aoe4-build-order/validate.ts` (533 lines on origin/main `d5c2549`) is a hand-rolled validator over the
5-field threshold, and the route is the only place the paste is converted. The owner decided one zod schema
factory built from a JSON-serializable catalog of the English data replaces it, and one shared
`textToBuildOrder` turns a paste into a checked build, so the browser and the server run the same checks.
This ticket adds both, re-points every importer, deletes the validator and its tests, and leaves the route
accepting `text` and `buildOrder` exactly as today (the break comes in a later ticket).

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
  rally, start villager sum, required `start.rally`, reaction trigger rule, rejected techs). Schemas are
  annotated `z.ZodType<T>` where a `T` exists. Internals (`superRefine` vs `check`, how node refs are typed)
  are the implementer's choice provided the inferred types match C2.
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

**5. `lib/aoe4-build-order/model.ts`.** `BuildOrder`, `BuildStep`, `Trigger`, `BuildStart` become
`export type { ... }` re-exports of `z.infer` types from `schema.ts` (the inferred types equal today's
declarations; node fields infer `NodeRef` / `FiniteNodeRef`, id fields `string`, `move.count` `number |
'all'`). `BuildOrderIssue` gains `suggestion?: string`. `BuildOrderLines` stays. The existing test
`data.acceptance.test.ts` "model.ts exports exactly the 29 documented types" matches `^export (?:type|interface)
<Name>` and so stops seeing the four moved names; update its expected list (the four names leave it) and say so
in the summary of edited tests.

**6. Route `pages/api/aoe4-build-order/simulate.ts`.** Replace `validateBuildOrder` / `resolveSimInputs` with
`checkBuildOrder` / `checkSimInputs`, using a catalog built from `loadGameData('english')` once per process.
Behavior is otherwise unchanged: still exactly one of `text` and `buildOrder` (`request: send exactly one of
text and buildOrder`), `text: must be a string`, order issues before inputs issues, both parts always run,
issue cap `MAX_REPORTED_ISSUES`, 400 body shape, 405, non-object body. The `text` branch calls
`textToBuildOrder(text, catalog)`; the 20000 check and `parseBuildOrderText` call leave the route (they now
live in `textToBuildOrder`). The `buildOrder` branch calls `checkBuildOrder(buildOrder, catalog)` without
`lines`. `lib/aoe4-build-order/api.ts` is not changed in this ticket.

**7. `acceptance/helpers.ts`.** Add `export function buildOrderFrom(text: string): BuildOrder` (C4a): calls
`textToBuildOrder` with the English catalog, built lazily on first call and reused (so the WOTR specs that
import `helpers.ts` do not load AoE4 data), and throws an `Error` whose message joins the issue messages when
the text does not convert. No other helper is added and no spec is migrated to it here.

**8. Delete and re-point.** Delete `lib/aoe4-build-order/validate.ts`, `validate.test.ts`,
`validate.acceptance.test.ts`. Re-point every importer (13 import lines in 12 files today, found with
`git grep -nE "from '[^']*/validate'" -- '*.ts' '*.tsx'`): `acceptance/aoe4-simulate-api-contract.spec.ts`
(`SIM_INPUT_BOUNDS`), `components/apps/aoe4-build-order/step-table-model.test.ts`,
`lib/aoe4-build-order/build-move.acceptance.test.ts`, `builds.test.ts` (checks every shipped build with
`checkBuildOrder(build, buildOrderCatalog(ENGLISH))`), `parse-text.test.ts`, `research.acceptance.test.ts`,
`simulate-triggers.test.ts`, `step-options.test.ts`, `test-helpers.ts`, and the route. `validateBuildOrder(order,
data)` calls become `checkBuildOrder(order, buildOrderCatalog(data))`; `resolveSimInputs` calls keep their
signature.

**9. Tests.**
- `schema.test.ts` (new): JSON-only cases (wrong types per field, `walkSeconds: 0.5` valid, unknown keys
  dropped and never an issue, non-object root, `steps` length 201 invalid and 200 valid, empty `steps` valid);
  issue ordering and the field vs cross-field rule (a step with a bad field reports no cross-field issue; a
  bad step suppresses cross-step issues; a bad `start` suppresses the villager sum); `suggestion` only where
  specified; `nearestId` table (match, case-insensitive, tie to earliest, over-threshold gives `undefined`,
  exact-different-case); `OPTIONAL_STEP_FIELDS` agrees with the schema (omitting each listed field is valid,
  omitting any other field is `syntax` `missing <field>`); `checkSimInputs` bounds (59 and 3601 invalid, 60
  and 3600 valid), defaults (`INPUT_DEFAULTS`), unknown node and building ids; catalog is JSON-serializable
  and deterministic; `SIM_INPUT_BOUNDS` and `INPUT_DEFAULTS` have the values listed in `validate.ts` today.
- `text-to-build.test.ts` (new): every issue case in the design's Behavior rules "Validation" table that can
  be written as paste is tested once, as text in and issues out with its `line`; 20000 characters accepted,
  20001 rejected with the `text:` message and not parsed; parse issues have no `lines`; check issues have
  `lines`; `''` returns what `parseBuildOrderText('')` returns; repeat gives equal results.
- Every case in the two deleted validate test files is either migrated to one of the two new files, covered
  by `parse-text.test.ts`, or dropped because the design's rules remove it (for example a combined
  field and cross-field assertion). The implementer lists each dropped or re-specified case in the PR body.
- `acceptance/aoe4-build-order-from.spec.ts` (new, Playwright, no page): `buildOrderFrom` returns the checked
  order for each prebuilt build's formatted text (via `formatBuildOrderText` of `listBuilds()`), and throws an
  error whose message contains an issue message for text with an unknown unit.
- Rule for existing tests (the issue-order and combined-issue behavior changes): a test whose expected issue
  list changes only because of the field vs cross-field rule or the new issue order gets the new expected list;
  any other test keeps its expected value. The implementer lists every test it edits. No API acceptance spec
  is rewritten to `buildOrder` here.

**10. OpenAPI and docs.**
- `docs/api/openapi.json`: add `suggestion` (optional string, description: the nearest valid id, present
  only on `unknown-id` and `unknown-trigger-kind` issues) to `BuildOrderIssue.properties`, not `required`.
  `info.version` stays `1.0.0`.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: import `SIM_INPUT_BOUNDS` from `schema`; `buildOrderIssue`
  `Record<keyof BuildOrderIssue, true>` gains `suggestion: true`; the `optional` map (line 122 on
  origin/main) gains `suggestion` for `BuildOrderIssue`.
- `docs/aoe4-build-order.md`: the Issues section (line 564 on origin/main) adds `suggestion?` to the issue
  shape and says when it is set; the validation text states that a step's cross-field rules run only when its
  fields passed, cross-step rules only when every step passed, and start rules only when `start` passed, and
  the issue order; the data-flow diagram (lines 614 to 619) renames `validateBuildOrder + resolveSimInputs` to
  `checkBuildOrder + checkSimInputs` and shows `textToBuildOrder` as the paste path; line 270's "validation
  rules in Issues" and line 877's "validation kind table" keep their meaning and are reworded only if they name
  the removed validator. Grep `docs/` and `data/aoe4-build-order/README.md` for `validateBuildOrder`,
  `validate.ts` and the old combined-issue wording and fix each hit. The Route section is not changed (the
  route still accepts `text`).

**Out of scope:** `data-schema.ts` and the `data.test.ts` rewrite (next ticket); the page, `PageProps`, the
`StepTable` prop rename, `IssueList` and `runRejected` (page ticket); rewriting any API spec body to
`buildOrder` and any spec edit beyond the contract spec import and the `BuildOrderIssue` rows (specs ticket);
removing `text` from the route, `api.ts`, OpenAPI `2.0.0` (remove-`text` ticket); the paste grammar
(`parse-text.ts` is unchanged); engine, data files and `simulate.ts`; `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm ls zod` shows zod 4.x and `jq -r .dependencies.zod package.json` prints `^4.6.7`; no file imports `zod/v3` or `zod/mini` (`git grep -nE "zod/(v3|mini)" -- '*.ts' '*.tsx'` prints nothing).
- [ ] `git grep -nE "from '[^']*/validate'" -- '*.ts' '*.tsx'` prints nothing (13 lines in 12 files before the change), and `lib/aoe4-build-order/validate.ts`, `validate.test.ts`, `validate.acceptance.test.ts` do not exist.
- [ ] `git grep -n "validateBuildOrder" -- . ':!golang'` prints nothing (37 lines in 10 files for `validateBuildOrder|validate\.ts|validate\.test|validate\.acceptance` before the change).
- [ ] `schema.ts` exports exactly the C2 names listed in Scope 2 (plus `nodeRefIssue`, `NodeRefProblem`); `text-to-build.ts` exports `textToBuildOrder` and `TextToBuildResult`; neither imports `data.ts` as a value or any `fs` / `node:` module (`git grep -nE "^import [^t].*'(\./data|fs|node:[a-z]+)'" -- lib/aoe4-build-order/schema.ts lib/aoe4-build-order/text-to-build.ts` prints nothing).
- [ ] `checkBuildOrder` of the pasted knight + longbow build text via `textToBuildOrder` with the English catalog returns `ok: true` with `lines`; `checkBuildOrder` returns `ok: true` for every build in `listBuilds()`.
- [ ] `textToBuildOrder` of a paste with unit `knigt` produced at `stable` returns one `unknown-id` issue with `line` set to that paste line, message `line N: unknown unit "knigt" in unit`, and `suggestion: "knight"`; with `trigger kind` `soon` it returns `unknown-trigger-kind` with the `nearestId` suggestion or none when over the threshold.
- [ ] A text of 20000 characters is accepted for conversion; 20001 gives one `out-of-range` issue `text: 20001 characters, more than 20000` and is not parsed (unit test); `POST /api/aoe4-build-order/simulate` with a `text` of 20001 characters still returns 400 with that issue (existing spec unchanged).
- [ ] A step whose field fails (for example `unit: "knigt"`) reports no cross-field issue for that step, and a build with a field issue in any step reports no cross-step issue (`research` twice); both asserted in `schema.test.ts`.
- [ ] `checkSimInputs` rejects `durationSeconds` 59 and 3601 with `out-of-range` `inputs.durationSeconds: 59 is outside 60..3600`, accepts 60 and 3600, and an empty `inputs` resolves to `INPUT_DEFAULTS` plus the data defaults; `resolveSimInputs(partial, data)` returns the same result.
- [ ] `buildOrderCatalog(ENGLISH)` is deep-equal after a JSON round trip and `StepOptions.names` maps `knight` to the entry's display name (unit test).
- [ ] `docs/api/openapi.json` `BuildOrderIssue.properties.suggestion` exists, is a string, and is not in `required`; `info.version` is still `1.0.0`; `npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts` passes.
- [ ] `buildOrderFrom` exists in `acceptance/helpers.ts`, returns the order for valid text, and throws with the joined issue messages for text that does not convert (`aoe4-build-order-from.spec.ts` passes); `git grep -n "aoe4-build-order/data'" -- acceptance/helpers.ts` finds nothing outside the lazy catalog path (the WOTR specs importing `helpers.ts` do not load AoE4 data at import time).
- [ ] The route behaves as before for requests that are valid and for every `text` / `buildOrder` / `inputs` rule except the documented issue-order and combined-issue change: the existing `aoe4-simulate-api*.spec.ts` suite passes, with every edited expectation listed in the PR body.
- [ ] `docs/aoe4-build-order.md` and `data/aoe4-build-order/README.md` name no removed symbol (`git grep -nE "validateBuildOrder|validate\.ts" -- docs data` prints nothing); the Issues section documents `suggestion`.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` pass; `npm test` passes; `npm run acceptance` passes (Node 24).
- [ ] No INVARIANTS.md regressions

## Open questions

1. `owner`/`designer`: size. The ticket is about 620 added business-logic lines against the ~400 sizing guide (the design fixes it as one ticket, row 2 of "M4.1 ticket order", because the schema, the deleted validator and its importers must change together). If the manager prefers a split, a candidate is B1 (zod dependency, `schema.ts`, `text-to-build.ts`, `step-options` `names`, `schema.test.ts`, `text-to-build.test.ts`, with `validate.ts` still present and `SIM_INPUT_BOUNDS` / `INPUT_DEFAULTS` / `nodeRefIssue` moved so there is one copy) and B2 (re-point importers, delete `validate.*`, route swap, `model.ts` re-exports, `buildOrderFrom`, OpenAPI `suggestion`, docs). Not split here; designer to decide.
