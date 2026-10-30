# SGS-006: Publish the /api/fight OpenAPI spec, export shared types, and check both against the endpoint

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.7
- **Priority**: medium
- **Risk**: high (respec 1)
  <!-- strongModelTriggers: "changes a public schema, API, or cross-component contract" applies: this ticket
       creates the checked-in public contract that agents and future apps read, and the check that enforces it.
       It is also adjacent to S3, W1, W2 and adds a devDependency. No runtime behavior or wire shape changes. -->
- **LOC estimate**: ~375 total (respec 2): `docs/api/openapi.json` ~235 (data, not logic), acceptance spec ~120, `lib/combat-simulator/fight-api.ts` ~40, type-only edits in `pages/api/fight.ts` (and `lib/combat-simulator/simulate.ts` if it declares its own result type) ~10, JSDoc lines in two `.js` files ~4, package.json/lock for one devDependency. Business logic (types plus test code) ~160; under the ~400 split threshold.
- **Depends on**: SGS-002 (Playwright harness and `acceptance/helpers.ts` default armies), SGS-005 (pinned response shape, `battles`, `lib/combat-simulator/simulate.ts`; SGS-005 depends on SGS-004, which depends on SGS-003, which defines the request encodings, validation order and the 400/405 contract). Delivered last.
- **Source**: M1.7; Outline F and spec gaps 6 and 7 in `plans/M1-20261028.md`; CONTEXT.md Decisions (API documentation, error body, malformed JSON, `/api/models/army`, outcomes, response carries results only, JSON field names set by the Monte Carlo ticket, caps, N, time budget, WOTR extensibility); SGS-005 Scope section 1 (response shape); SGS-003 Scope section 1 (request rules); ARCHITECTURE.md on `main` (`lib/<app>/`, `docs/api/openapi.json`); spec gates `reports/SGS-006-spec-gate.md`

## Context

`/api/fight` has no written contract. On `main` (d54af2e) the request is JSON with form-named fields, and the
response is an unexported `BattleStats` interface in `pages/api/fight.ts`, read by
`components/apps/combat-simulator/results.js` through an untyped page. SGS-003 adds validation (400/405), and
SGS-005 replaces the response with the pinned N-battle summary and adds `battles`. M1.7 asks for a reviewable
API surface: an OpenAPI JSON spec that agents read with `jq`, checked against the running endpoint, plus
exported shared TypeScript types kept consistent with it (CONTEXT.md Decisions). ARCHITECTURE.md already names
`docs/api/openapi.json` as the one API spec and `lib/<app>/` as the home for code that API routes use.

## Scope

Write against the code as merged by SGS-003/004/005, not `main` (`main` returns the single-battle
`BattleStats` with no validation). The request rules and response shape below are copied from the SGS-003 and
SGS-005 tickets, which pin them. If the merged handler differs from them, do not change the handler and do not
document the merged behavior silently: stop and bounce to `needs_spec` naming the difference.

### 1. OpenAPI spec `docs/api/openapi.json` (respec 2)

One file for the whole site's API, so later apps add paths to it. JSON, not YAML, so `jq` reads it. OpenAPI
3.1.x (schemas are JSON Schema 2020-12, which the contract check validates with Ajv).

- `info`: `title`, `version`, and a `description` stating that `/api/models/army` is served by Next.js only
  because the file sits under `pages/api/`, is not part of the API, and may change or disappear. The spec does
  not list that path.
- `paths."/api/fight".post`, `operationId: "runFight"`.
  - `requestBody`: required, `content."application/json".schema` = `$ref` `FightRequest`, plus one `example`
    at the media-type level (not inside the schema).
  - `responses`:
    - `200`: `content."application/json".schema` = `$ref` `FightResponse`, plus one media-type `example`.
    - `400`: `content."application/json".schema` = `$ref` `FightError`, with media-type `examples` (one per
      400 class below). Its `description` states the one exception: a body that is not valid JSON is rejected
      by the framework before the handler runs, with status 400 and the plain-text body `Invalid JSON` (no JSON
      content type), which does not match `FightError`. (Next 12.1.6 `sendError` calls `res.end(message)` with no
      `Content-Type`.)
    - `405`: `content."application/json".schema` = `$ref` `FightError`, one `example`, and
      `headers.Allow` with schema `{ "type": "string", "const": "POST" }`.
- Every schema lives under `components.schemas` and is referenced by `$ref`; no object schema is defined inline
  under `.paths`. Schema names (pinned here):
  `FightRequest`, `FightResponse`, `FightError`, `FightOutcomes`, `OutcomeTally`, `RoundStats`,
  `FightSurvivors`, `SurvivorCombination`, `HitsPerRound`, and one shared field schema for the army count
  encoding if the implementer wants to avoid repeating it (for example `ArmyCount`; optional).
- Every object schema has `type: "object"`, `required` listing every property except `FightRequest.battles`,
  and a `description` on every property. Every object schema except `FightOutcomes` has
  `additionalProperties: false`. (respec 2) `FightOutcomes` is the one exception: it has
  `additionalProperties: { "$ref": "#/components/schemas/OutcomeTally" }`, so a later outcome kind (for example
  from a max-rounds or retreat termination rule) is a non-breaking addition. The response otherwise contains no
  keyed maps (SGS-005 section 1).

**`FightRequest`** (from SGS-003 section 1 and SGS-005 section 3):

- Properties `attack-regs`, `attack-elts`, `attack-ldrs`, `defend-regs`, `defend-elts`, `defend-ldrs`
  (all required) and `battles` (optional, `default: 1000`).
- Each field's schema is `oneOf` two branches, matching the handler's two accepted encodings:
  - JSON number: `{ "type": "integer", "minimum": <min>, "maximum": <max> }`;
  - digit-only string: `{ "type": "string", "pattern": "^[0-9]+$", "x-minimum": <min>, "x-maximum": <max> }`
    (JSON Schema cannot range-check a string, so the range is an annotation; the field `description` says the
    string is read as a decimal integer, leading zeros allowed, and must fall in the same range).
- Ranges: regulars and elites 0 to 10; leaders 0 to 5; `battles` 1 to 100000.
- `FightRequest.description` states the cross-field rules (per side, regulars + elites <= 10, leaders not
  counted; regulars + elites = 0 is invalid), that unknown extra keys are ignored, and the validation order:
  method, body is a JSON object, the six army fields in the order listed (first failing field wins), per-side
  rules attack then defend, then `battles`. Do not encode the cross-field rules in JSON Schema.
- (respec 2) No termination-rule fields in M1: the battle's options argument (`BattleOptions`, SGS-004) is
  internal and empty, and the request does not expose it. When a later ticket adds a termination option (max
  rounds, retreat), it lands as an optional `FightRequest` property (not in `required`, with a default that
  keeps today's behavior), so existing requests stay valid. This ticket adds no such property, placeholder, or
  "reserved" text to the spec.

**`FightError`**: `{ "error": string }`, `error` required with `minLength: 1`, no other properties. Examples
(produced by real requests, not hand-typed): 405 for a GET; 400 for an out-of-range field; 400 for a side with
zero regulars and elites; 400 for an invalid `battles`; 400 for a body that is not a JSON object.

**`FightResponse`** and nested schemas: exactly SGS-005 section 1, no added or renamed fields, no armies.

| Schema | Properties |
|--------|------------|
| `FightResponse` | `battles` (integer, minimum 1, maximum 100000: N actually run), `outcomes` ($ref `FightOutcomes`), `rounds` ($ref `RoundStats`), `survivors` ($ref `FightSurvivors`), `hitsPerRound` ($ref `HitsPerRound`) |
| `FightOutcomes` | (respec 2) `attacker`, `defender`, `tie` (all required), each $ref `OutcomeTally`; `additionalProperties` $ref `OutcomeTally` (not `false`); `description` states later versions may add outcome kinds with the same `{count, frequency}` shape and clients must tolerate unknown keys |
| `OutcomeTally` | `count` (integer, minimum 0), `frequency` (number, 0 to 1; `count / battles`, unrounded) |
| `RoundStats` | `mean` (number, minimum 1; unrounded), `median`, `p10`, `p90` (integers, minimum 1; nearest-rank) |
| `FightSurvivors` | `attacker`, `defender`, each an array of $ref `SurvivorCombination` (empty when that side never won) |
| `SurvivorCombination` | `regulars`, `elites` (integers, 0 to 10), `count` (integer, minimum 1), `frequency` (number, 0 to 1; share of that side's wins) |
| `HitsPerRound` | `attacker`, `defender`, each an array of exactly 6 numbers (`minItems`/`maxItems` 6, items 0 to 1); index k = share of all rounds with exactly k hits |

Descriptions carry SGS-005's definitions (outcome meaning; counts sum to `battles`; nearest-rank method;
survivor sort order count, regulars, elites descending; leaders not in survivor combinations; hits pooled across
all battles). Do not restate dice or casualty rules; the design doc owns them.

**Examples**: the request example is the SGS-002 default armies (3/1/1 per side) with `battles: 20`; the 200
example is the body a real request with that example returned (pasted, not hand-typed). The error examples come
from real requests the same way.

### 2. Shared types `lib/combat-simulator/fight-api.ts` (respec 2)

Per ARCHITECTURE.md, code imported by an API route lives in `lib/<app>/` (plain TypeScript, no React or Next
imports), not under `components/` and not under `pages/api/` (which would become a route). Export one named
type per schema in item 1, with the same name and the same property keys:
`FightRequest` (army fields `number | string`, `battles?: number | string`), `FightResponse`, `FightError`,
`FightOutcomes`, `OutcomeTally`, `RoundStats`, `FightSurvivors`, `SurvivorCombination`, `HitsPerRound`
(`attacker`/`defender` as `number[]`). Hand-written; no code generation. Types only, no runtime code.

(respec 2) `FightOutcomes` does not restate the three outcome names. It derives from the outcome kinds that
`lib/combat-simulator/battle.ts` exports (SGS-004: the `OutcomeKind` type and the `OUTCOME_KINDS` constant),
for example `export type FightOutcomes = Record<OutcomeKind, OutcomeTally>`, with `import type` so the file
stays runtime-free. Adding a kind to `OUTCOME_KINDS` then changes `FightOutcomes` without editing this file. If
SGS-004 merged without exporting both the `OUTCOME_KINDS` runtime constant (case 8 imports it) and the
`OutcomeKind` type (or `OutcomeKind` is not `(typeof OUTCOME_KINDS)[number]`), stop and bounce to
`needs_spec`; do not declare the union or the list here.
The type stays closed to the three kinds (no index signature): the server only produces kinds it knows, and the
open-ended `additionalProperties` in the spec is a promise to clients, not a TypeScript shape.

### 3. Use the types in the route and lib (respec 2)

- `pages/api/fight.ts`: type the handler as `NextApiResponse<FightResponse | FightError>` and type the request
  body as `FightRequest` where the handler reads it, importing from `lib/combat-simulator/fight-api`. Remove any
  local duplicate response or request type left after SGS-005. Type-only edits: no change to runtime behavior
  or wire shape.
- `lib/combat-simulator/simulate.ts` (SGS-005): if it declares its own result type for the section 1 object,
  replace that declaration with `FightResponse` (and the nested types) from `fight-api.ts`, so the shape is
  declared once. Type-only edit.

### 4. JSDoc references in `.js` files

`pages/apps/combat-simulator.js` and the `results.js` JSDoc reference `FightResponse` via a JSDoc
`import('../../lib/combat-simulator/fight-api').FightResponse` typedef (path relative to each file). This is
documentation, not a compiler gate (`tsconfig.json` has `allowJs` but no `checkJs`). Do not add `checkJs` or
convert files to TypeScript.

### 5. Contract check `acceptance/fight-api-contract.spec.ts` (respec 2)

Run by `npm run acceptance` (SGS-002) against the same dev server, using Playwright's `request` fixture. One
new devDependency: `ajv` (8.x, which ships the 2020-12 build `ajv/dist/2020`), in `package.json` and
`package-lock.json`.

**Loading the spec and resolving refs.** Read `docs/api/openapi.json` with `fs.readFileSync` + `JSON.parse`.
Create one `Ajv2020({ strict: false })` (OpenAPI-only keywords such as `x-minimum` are then ignored), register
the whole spec as one root document with `ajv.addSchema(spec, 'openapi.json')`, and get each validator by
reference, for example `ajv.getSchema('openapi.json#/components/schemas/FightResponse')`, so the internal
`#/components/schemas/X` refs resolve against that root. A helper that throws when `getSchema` returns
`undefined` keeps an unresolved ref from passing silently. (This pattern was checked with ajv 8.20.0: refs
resolve, a 1-item `HitsPerRound` array and an extra key are both rejected.)

**Timeouts.** `test.setTimeout(60_000)` for the file, and `timeout: 10_000` on every request (the CONTEXT.md
time budget for the largest N; every request here uses N <= 1000). No request in this file uses
`battles` 100000.

**Baseline body.** The SGS-002 default armies from `acceptance/helpers.ts` (3 regulars, 1 elite, 1 leader per
side, as strings) plus `battles: 20`. Each boundary case changes one field from the baseline (plus the paired
field noted below), sent as a JSON number via `data:`. Use the shared post helper if it accepts a body;
otherwise call `request.post` directly.

Cases:

1. **Spec structure** (no HTTP): `paths["/api/fight"].post.operationId === "runFight"`; the `responses` keys
   are exactly `200`, `400`, `405`; the 405 response declares `headers.Allow`; the request example and each
   response example validate against their schemas with Ajv.
   (respec 2) Outcome extensibility, all against the `FightResponse` validator using a deep copy of the 200
   example: deleting any one of `outcomes.attacker`, `outcomes.defender`, `outcomes.tie` is rejected (one
   assertion per kind); adding `outcomes.<new kind>` = `{ "count": 0, "frequency": 0 }` is accepted; adding
   `outcomes.<new kind>` = `{ "count": 0 }` is rejected (unknown kinds must still match `OutcomeTally`).
2. **Real 200**: POST the spec's own request example; status 200; body validates against `FightResponse`;
   the body's key set equals the 200 example's key set at every object level (top level, `outcomes` and each
   tally, `rounds`, `survivors`, each `SurvivorCombination` present, `hitsPerRound`). Values are random and are
   not compared.
3. **Real 400**: one baseline body with `attack-ldrs: 6`; status 400; body validates against `FightError`.
4. **Real 405**: GET `/api/fight`; status 405; header `allow` equals `POST`; body validates against `FightError`.
5. **Malformed JSON**: POST the raw string `{"attack-regs":` with `Content-Type: application/json`; status
   400; body text is `Invalid JSON`; the spec's 400 `description` contains `Invalid JSON`.
6. **Boundaries driven from the spec.** For each `FightRequest` property, read `minimum` and `maximum` from its
   integer branch. Each case expects 200 or a 400 whose `error` contains the field key:
   - regulars field (`attack-regs`, `defend-regs`): max with that side's elites set to 0 is 200; max + 1 with
     elites 0 is 400; min (0) with the baseline elites (1) is 200; min - 1 (-1) is 400.
   - elites field: max with that side's regulars set to 0 is 200; max + 1 with regulars 0 is 400; min (0)
     with the baseline regulars (3) is 200; min - 1 is 400.
   - leaders field: max (5) is 200; max + 1 is 400; min (0) is 200; min - 1 is 400.
   - `battles`: min (1) is 200 with `battles` 1 in the body; min - 1 (0) is 400; max + 1 is 400 (rejected
     before any battle runs). Max itself is not posted here: SGS-005's HTTP criteria already assert
     `battles` 100000 returns 200 within 10 s, and this file must not duplicate that run.
7. **Cross-field rules** (stated in prose in the spec, so explicit cases): attack 10 regulars + 1 elite is 400
   with `error` containing `attack`; defend 0 regulars + 0 elites (leaders 1) is 400 with `error` containing
   `defend`; omitting `battles` returns 200 with `battles` equal to `FightRequest.properties.battles.default`.
8. **Type/spec key-set drift**: the spec file declares, for each of the nine exported types, a
   `Record<keyof T, true>` object literal listing its keys (a missing or extra key is a `tsc --noEmit` error),
   and asserts at runtime that each literal's keys equal the matching schema's `properties` keys. Value types
   are covered by Ajv validation of real responses (cases 2-4), not by this check.
   (respec 2) Also assert that `OUTCOME_KINDS` imported from `lib/combat-simulator/battle.ts` equals, as a set,
   `FightOutcomes.required` in the spec, and that the real 200 body's `outcomes` keys (case 2) equal
   `OUTCOME_KINDS` as a set. A kind added in code but not in the spec (or the reverse) then fails here.

### 6. Design doc link (optional)

If `docs/combat-simulator.md` has merged, add one line linking to `docs/api/openapi.json`. Do not restate the
contract there. No `docs/api.md` is created.

### 7. `/api/models/army`

Unchanged. Do not modify `pages/api/models/army.ts`; the only mention is the `info` description in item 1.

The shipped spec, doc line, and code comments must not mention ticket ids, invariant numbers, or factory files.

**Out of scope:** any change to `/api/fight` runtime behavior, validation, caps, or response shape
(SGS-003/004/005); wrapping Next's malformed-JSON 400 (CONTEXT.md: kept for now); moving
`pages/api/models/army.ts`; generating types or clients from the spec; runtime request validation with Ajv
inside the handler; changing the error body; a rendered Swagger UI page or route; the CONTEXT.md "Key surfaces"
update (manager action after merge); `checkJs` or TypeScript conversion of the page and components; a
committed negative test; StarCraft helper and `golang/`; (respec 2) any termination rule (max rounds,
retreat), a new outcome kind, or a request field exposing `BattleOptions`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `docs/api/openapi.json` parses with `jq .`, and `jq -r '.openapi'` prints a `3.1.` version.
- [x] `jq '.paths | keys'` prints exactly `["/api/fight"]`; `jq '.info.description'` states that
      `/api/models/army` is not part of the API.
- [x] (respec 2) `jq '.components.schemas | keys'` includes exactly the nine names in Scope item 1 (plus the
      optional shared field schema, if used), and `jq '[.paths | .. | objects | select(.type? == "object")] | length'`
      prints `0` (no inline object schemas under `.paths`).
- [x] (respec 2) `FightRequest` has the seven properties, `required` lists the six army fields and not
      `battles`, `battles.default` is 1000, each field's integer branch has the Scope ranges and its string
      branch has pattern `^[0-9]+$`, and the description states the cross-field rules and validation order.
- [x] (respec 2) Every property has a `description`, and `FightOutcomes` is the only object schema without
      `additionalProperties: false`:
      `jq -c '[.components.schemas | to_entries[] | select(.value.type=="object" and .value.additionalProperties != false) | .key]'`
      prints `["FightOutcomes"]`, and `jq -c '.components.schemas.FightOutcomes.additionalProperties'` prints
      `{"$ref":"#/components/schemas/OutcomeTally"}`.
- [x] (respec 2) `jq -c '.components.schemas.FightOutcomes.required | sort'` prints
      `["attacker","defender","tie"]`, and `FightOutcomes.description` says later versions may add outcome kinds
      and clients must tolerate unknown keys.
- [x] (respec 2) The contract check rejects a 200 example with any one of `attacker`, `defender`, `tie`
      removed from `outcomes`, accepts one with an extra `{count, frequency}` outcome kind, and rejects one with
      an extra kind missing `frequency` (Scope item 5 case 1). Adding `additionalProperties: false` to
      `FightOutcomes`, or dropping `tie` from its `required`, makes `npm run acceptance` fail.
- [x] (respec 2) `FightRequest` gains no termination-rule property (`jq '.components.schemas.FightRequest.properties | keys | length'`
      prints `7`).
- [x] (respec 2) The `FightResponse` tree has exactly SGS-005 section 1's keys at every level, and
      `HitsPerRound` arrays have `minItems` and `maxItems` 6.
- [x] (respec 2) The 400 response `description` documents the plain-text `Invalid JSON` exception; the 405
      response declares `headers.Allow` with `const: "POST"`.
- [x] (respec 2) `npm run acceptance` runs `acceptance/fight-api-contract.spec.ts` covering Scope item 5 cases
      1-8 and exits 0. Ajv validators are obtained by `$ref` from one root document (`addSchema` of the whole
      spec), and a missing validator throws.
- [x] (respec 2) The contract spec sets a file timeout and a per-request timeout, and no request in it sends
      `battles` 100000 (`grep -n 100000 acceptance/fight-api-contract.spec.ts` shows none in a request body).
- [x] (respec 2) The examples are real output: posting the spec's request example returns 200 whose body
      validates against `FightResponse` and has the same key sets as the 200 example (case 2); every example
      validates against its own schema (case 1).
- [ ] (respec 2) Each of these makes the contract check fail, verified once locally and noted in the PR (no
      committed negative test): removing a property from a `FightResponse` schema in the spec; the handler
      returning an extra top-level key; lowering `attack-ldrs` maximum in the spec to 4 (max + 1 = 5 is then
      accepted); raising it to 6 (max = 6 is then rejected); renaming a key in an exported type only (`tsc`
      fails); renaming the same key in the spec only (`npm run acceptance` fails).
- [x] (respec 2) `FightOutcomes` in `fight-api.ts` is derived from `OutcomeKind` imported (type-only) from
      `lib/combat-simulator/battle.ts`; `grep -n "'tie'\|\"tie\"" lib/combat-simulator/fight-api.ts` finds
      nothing. The contract check asserts `OUTCOME_KINDS` equals `FightOutcomes.required` and the real 200
      body's `outcomes` keys as sets (case 8).
- [ ] (respec 2) `lib/combat-simulator/fight-api.ts` exports the nine types; `pages/api/fight.ts` imports
      `FightResponse` and `FightError` from it and declares no local response type; if `simulate.ts` had its own
      result type, it now uses `FightResponse`. Changing a field name in `FightResponse` makes `npx tsc --noEmit`
      fail in `fight.ts` or `simulate.ts` (verify once, note in the PR).
- [x] No new file under `pages/api/`; `npx next build` succeeds and its route list shows no new API route;
      `docs/api/openapi.json` is not served (GET `/docs/api/openapi.json` is 404).
- [x] (respec 2) Wire behavior unchanged: `git diff` of `pages/api/fight.ts` and `simulate.ts` contains only
      imports and type annotations, and the SGS-003 and SGS-005 acceptance specs pass without edits.
- [x] `ajv` is the only new dependency, a devDependency, with `package-lock.json` updated.
- [x] `npx tsc --noEmit` passes.
- [x] Neither the spec, the doc link line, nor any changed code or comment references ticket ids, invariant
      numbers, or factory files.
- [x] No INVARIANTS.md regressions (adjacent: S3 caps are documented as enforced, W1 the spec does not restate
      or contradict the design doc's rules, W2 untouched).

## Open questions

Resolved by the owner (2026-10-28):
1. `/api/models/army` stays where it is, unlisted, with a description stating it is not part of the API.
2. "Reviewable" means an OpenAPI JSON spec read with `jq`, checked against the running endpoint by the
   acceptance harness, plus exported shared types consistent with the spec.
3. `docs/api/openapi.json` replaces a prose API doc; the design doc may link to it.
4. The `{ error: string }` body for 400 and 405 is accepted for now.
5. Malformed JSON keeps Next's plain-text 400 for now; the spec documents the exception on the 400 response.

Open: none for the owner. If the merged code differs from the SGS-003/SGS-005 contract copied here (a field
name, encoding, range, or error status), bounce to `needs_spec`; do not pick one. The same applies if SGS-004 merged
without exporting `OUTCOME_KINDS` and `OutcomeKind` from `lib/combat-simulator/battle.ts` (respec 2).

## Re-spec 2026-10-28

**Underspecified:** the first version read "reviewable" as a prose doc plus TypeScript types, left
`/api/models/army` and the doc location as open questions, and verified the doc only by hand with curl.

**Changed (owner answers 2026-10-28):** the prose doc is replaced by `docs/api/openapi.json` (OpenAPI 3.1,
JSON, `components.schemas`, stable `operationId` `runFight`, `jq`-readable). Added a contract spec in the
SGS-002 harness that validates real 200/400/405 responses with Ajv and checks boundaries from the spec, plus a
key-set drift check between the exported types and the spec. `/api/models/army` is left in place and mentioned
only in the spec description. Added SGS-002 to Depends on, added the `ajv` devDependency, raised Risk from
standard to high, LOC from ~60-120 to ~330 total (~120 business logic).

**Branch work that still stands:** none; this ticket was not started.

## Re-spec 2026-10-28 (2)

Re-spec 2, from `reports/SGS-006-spec-gate.md` and the CONTEXT.md Decisions updated 2026-10-28.

**What was underspecified**
- Example and wire-unchanged criteria asked for body comparison on a random endpoint.
- `operationId` was to be asserted "against a real GET", which HTTP cannot show.
- Boundary cases had no baseline body, so setting one field could trip another rule; the below-min rule was
  convoluted; no timeouts; the `battles` max case would run 100,000 battles in this file.
- Response nested field names and encodings were left to "the merged code", and a possible keyed map
  conflicted with `additionalProperties: false` and the key-set drift check.
- Ajv was told to compile `components.schemas.*` individually, which leaves `#/components/schemas/X` refs
  unresolved.
- Malformed JSON's plain-text 400 was not documented.
- Types were placed in `components/apps/combat-simulator/`, against ARCHITECTURE.md's `lib/<app>/` rule.

**What changed**
- Scope 1: response fields and encodings copied from SGS-005 section 1 (no keyed maps, so
  `additionalProperties: false` everywhere, no armies); nested schema names pinned; request encodings, ranges,
  cross-field rules and validation order copied from SGS-003 (`oneOf` integer / digit-string per field);
  `battles` 1-100000, default 1000; 400 description documents `Invalid JSON`; examples at media-type level.
- Scope 2: types move to `lib/combat-simulator/fight-api.ts`. Scope 3 adds the `simulate.ts` type-only edit.
- Scope 5: one Ajv root document (`addSchema(spec, 'openapi.json')`, `getSchema` by ref, verified with ajv
  8.20.0); explicit timeouts; baseline = SGS-002 default armies + `battles: 20`, one field varied with its
  pair held legal; `battles` max not posted (SGS-005 covers it); operationId asserted from the file, `Allow`
  over HTTP; malformed-JSON case; key-set comparison instead of body comparison.
- Criteria rewritten (tagged `(respec 2)`); a mismatch with the SGS-003/005 contract now bounces instead of
  being documented as merged. Open question 5 (malformed JSON) recorded as resolved. LOC ~330 -> ~360
  (~150 business logic). Risk stays high.

**Existing branch work that still stands:** none; branch `sgs-006-fight-api-contract` has not been created.

## Manager notes - 2026-10-28 (from spec-gate pass 2, non-blocking)

- `FightRequest` description states the schema is deliberately stricter than the server, which ignores extra keys.
- Case 2 checks each `SurvivorCombination` only when the array is non-empty.
- Type the request body with a cast at the existing read sites in `fight.ts`; that counts as a type annotation.
- Case 6 finds the integer branch by `type`, not `oneOf` index, and also checks `x-minimum`/`x-maximum` on the string branch.
- Import Ajv as `ajv/dist/2020`; use `import type` for the shared types in specs; state the request example encoding and `info.version`.

## Re-spec 2026-10-28 (2, addendum: WOTR extensibility)

Folded into re-spec 2 from the CONTEXT.md Decisions entry "WOTR extensibility" (owner, 2026-10-28): leave seams
for later termination rules (max rounds, retreat) without building them.

**What was underspecified:** the spec closed `FightOutcomes` with `additionalProperties: false` like every other
object, so a later outcome kind would be a breaking contract change; the shared types restated the three
outcome names instead of deriving them from the battle code; nothing said where later termination options
would enter the request.

**What changed (all tagged `(respec 2)`):**
- Scope 1: `FightOutcomes` requires `attacker`, `defender`, `tie` and allows additional properties matching
  `OutcomeTally`; its description tells clients to tolerate unknown kinds. It is the only object without
  `additionalProperties: false`. The request gains no field; later termination options land as optional
  `FightRequest` properties.
- Scope 2: `FightOutcomes` type = `Record<OutcomeKind, OutcomeTally>` with `OutcomeKind` imported type-only from
  `lib/combat-simulator/battle.ts` (SGS-004, re-specced in parallel); bounce if those exports are missing. The
  schema and type name stays `OutcomeTally` (pinned in Scope 1).
- Scope 5: case 1 adds Ajv checks that a missing required kind is rejected, an extra well-formed kind is
  accepted, and a malformed extra kind is rejected; case 8 checks `OUTCOME_KINDS` against
  `FightOutcomes.required` and the real 200 body's `outcomes` keys.
- Criteria: the `additionalProperties` jq check now expects exactly `["FightOutcomes"]`; four criteria added
  (outcomes required and description, extensibility checks, no new request field, type derivation). Out of
  scope and the bounce note extended.
- LOC ~360 -> ~375 (~150 -> ~160 business logic). Risk stays high. Depends on unchanged (SGS-004 is reached
  through SGS-005).

**Existing branch work that still stands:** none; branch `sgs-006-fight-api-contract` has not been created.

## Manager note - 2026-10-29 (spec gate 2, non-blocking)

- Case 8 runtime-imports `lib/combat-simulator/battle.ts` into a Playwright spec. If the import fails, fix the import path or config; do not copy the kind list.
