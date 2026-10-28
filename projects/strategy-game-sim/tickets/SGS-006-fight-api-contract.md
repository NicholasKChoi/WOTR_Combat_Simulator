# SGS-006: Publish the /api/fight OpenAPI spec, export shared types, and check both against the endpoint

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.7
- **Priority**: medium
- **Risk**: high (respec 1)
  <!-- strongModelTriggers: "changes a public schema, API, or cross-component contract" applies: this ticket
       creates the checked-in public contract that agents and future apps read, and the check that enforces it.
       It is also adjacent to S3, W1, W2 and adds a devDependency. No runtime behavior or wire shape changes. -->
- **LOC estimate**: ~330 total (respec 1): `docs/api/openapi.json` ~200 (data, not logic), acceptance spec ~80, `fight-api.ts` ~30, import edits in `pages/api/fight.ts` ~10, package.json/lock for one devDependency. Business logic (types plus test code) ~120; under the ~400 split threshold.
- **Depends on**: SGS-002 (Playwright harness, added by respec 1), SGS-005 (success schema and `battles`; SGS-005 depends on SGS-004, which depends on SGS-003, which define the 400/405 contract and caps). Delivered last.
- **Source**: M1.7; Outline F and spec gaps 6 and 7 in `plans/M1-20261028.md`; CONTEXT.md Decisions (API documentation, error body, `/api/models/army`, outcomes, caps, N); owner answers 2026-10-28

## Context

`/api/fight` has no written contract. Today the request is JSON with form-named fields, and the response is an
unexported `BattleStats` interface in `pages/api/fight.ts`, read by `components/apps/combat-simulator/results.js`
through an untyped page. M1.7 asks for a reviewable API surface. The owner decided it is an OpenAPI JSON spec
that agents read with `jq`, checked against the running endpoint, plus exported shared TypeScript types kept
consistent with it.

## Scope

Write against the code as merged by SGS-003/004/005, not current `main` (`main` returns the single-battle
`BattleStats` with no validation and no 405/400). Read the merged `pages/api/fight.ts` first. The spec records
what the merged handler does; where the merged code differs from this description, the merged code and the
combat design doc win, and this ticket records the difference rather than changing behavior.

1. **OpenAPI spec** `docs/api/openapi.json` (respec 1). One file for the whole site's API, so later apps add
   paths to it. JSON, not YAML, so `jq` reads it. Use OpenAPI 3.1 (its schemas are plain JSON Schema 2020-12,
   which the harness validates with Ajv; see item 5).
   - `info`: title, version, and a description stating that `/api/models/army` is served by Next.js only
     because the file sits under `pages/api/`, is not part of the API, and may change or disappear. The spec
     does not list that path.
   - `paths."/api/fight".post` with stable `operationId: "runFight"`. Responses: `200` (schema ref
     `FightResponse`), `400` and `405` (both schema ref `FightError`; `405` documents the `Allow: POST` header).
   - Everything reusable lives under `components.schemas` and is referenced by `$ref`, so
     `jq '.components.schemas'` and `jq '.paths'` each give the contract directly with no inline duplicates.
     Schemas: `FightRequest`, `FightResponse`, `FightError`, plus a named schema for each nested object the
     response contains (names per the merged code).
   - `FightRequest`: the fields the merged handler accepts: `attack-regs`, `attack-elts`, `attack-ldrs`,
     `defend-regs`, `defend-elts`, `defend-ldrs`, `battles`. Per field state type, `minimum`/`maximum`, and
     whether required. Ranges: regulars and elites 0 to 10, leaders 0 to 5, `battles` 1 to 100000 with
     `default: 1000` (optional; absent means 1000). The cross-field rules (regulars + elites <= 10 per side;
     0 regulars + elites on a side is invalid) are stated in the schema description, and may also be encoded in
     JSON Schema if it stays readable. Express the field type exactly as the merged parser accepts it
     (JSON numbers, numeric strings, or both). If the handler accepts only numeric strings, JSON Schema
     `minimum`/`maximum` cannot apply to a string, so give each field a `pattern` plus `x-minimum` and
     `x-maximum`, and say so in the field description.
   - `FightError`: `{ error: string }`, `error` required, no other properties. Document one example per error
     class the merged handler defines (non-POST 405; out-of-range field 400; zero-fighting-units side 400;
     invalid `battles` 400).
   - `FightResponse`: the SGS-005 success schema, with field names and units as the merged code and design doc
     define: attacker win / defender win / tie counts and frequencies (and the relation: counts sum to N),
     rounds mean, median, p10, p90, surviving-unit distribution, hits per round, and N. Every property has a
     `description`; `required` lists every property; `additionalProperties: false` on each object, so the spec
     and a real response must agree in both directions.
   - One `example` for the request and one for the 200 response, produced by running the endpoint (use a small
     `battles`, such as 20, to keep the file small), not hand-typed.
2. **Shared types module** `components/apps/combat-simulator/fight-api.ts` (inside the component's paths, not
   under `pages/api/`, where Next.js would expose it as a route). Export named types `FightRequest`,
   `FightResponse`, `FightError`, and one named type per nested object schema, with the same names and shape as
   the spec's `components.schemas`. Hand-written; do not generate code from the spec (out of scope).
3. **`pages/api/fight.ts`** imports those types and uses them for the handler's request and response (for
   example `NextApiResponse<FightResponse | FightError>`), replacing the local unexported `BattleStats`. No
   change to runtime behavior or wire shape.
4. **`pages/apps/combat-simulator.js`** and the `results.js` JSDoc (which today says "should map to
   pages/api/fight.ts result") reference the exported response type via a JSDoc `import()` typedef. Both are
   `.js` and `tsconfig.json` does not set `checkJs`, so this is documentation, not a compiler gate. Do not add
   `checkJs` or convert files to TypeScript.
5. **Contract check in the SGS-002 harness** (respec 1): `acceptance/fight-api-contract.spec.ts`, run by the
   existing `npm run acceptance` against the same dev server, using Playwright's `request` fixture. Chosen as
   the lightest approach that fits: one spec file plus one devDependency (`ajv`, 2020-12 build
   `ajv/dist/2020`, declared in `package.json` and `package-lock.json`), no code generation, no new runner.
   It reads the spec with `fs.readFileSync` and `JSON.parse` (no `resolveJsonModule` or tsconfig change) and
   compiles `components.schemas.*` with Ajv (`strict: false` for OpenAPI-only keywords such as `example`).
   - Validates real responses against the schemas: the 200 body against `FightResponse`, a real 400 body
     against `FightError`, a real 405 body against `FightError`. With `required` plus
     `additionalProperties: false`, this fails on a documented field missing from a response and on a response
     field missing from the spec.
   - Boundary check driven from the spec: for each `FightRequest` property, the spec's maximum is accepted
     (200) and maximum + 1 is rejected (400); the minimum is accepted and minimum - 1 is rejected where the
     minimum is above the lowest legal value or the field is rejected below it. Cross-field rules get explicit
     cases (10 regulars plus 1 elite is 400; 0 regulars and 0 elites is 400; leaders 6 is 400;
     `battles` 100001 is 400; no `battles` returns the spec's default N).
   - Documented `operationId` and the `405` `Allow` header are asserted against a real GET.
   - Drift between the exported types and the spec: the spec file declares, for each of `FightRequest`,
     `FightResponse`, `FightError` and each nested type, a `Record<keyof T, true>` object literal listing the
     type's keys (a missing or extra key is a `tsc --noEmit` error), and asserts at runtime that those keys
     equal the spec schema's `properties` keys. Adding, removing, or renaming a field in either place and not
     the other fails `tsc` or `npm run acceptance`. This checks key sets only, not value types; value types are
     covered by the real-response validation above.
6. **Design doc link** (optional): if `docs/combat-simulator.md` has merged by implementation time, add one line
   linking to `docs/api/openapi.json`. Do not restate the contract there. No `docs/api.md` is created.
7. **`/api/models/army`**: unchanged. Do not modify `pages/api/models/army.ts`; the only mention is the `info`
   description in item 1.

The shipped spec, doc line, and code comments must not mention ticket ids, invariant numbers, or factory files.

**Out of scope:** any change to `/api/fight` runtime behavior, validation, caps, or response shape (SGS-003/004/005);
moving `pages/api/models/army.ts`; generating types or clients from the spec; runtime request validation
inside the handler; changing the error body from `{ error: string }`; a rendered Swagger UI page or route;
the CONTEXT.md "Key surfaces" update (manager action after merge); `checkJs` or TypeScript conversion of the
page and components; StarCraft helper and `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/api/openapi.json` exists, parses with `jq .`, and `jq '.openapi'` prints a 3.1.x version (respec 1).
- [ ] `jq '.paths | keys'` prints exactly `["/api/fight"]` (so `/api/models/army` is not listed), and
      `jq -r '.paths["/api/fight"].post.operationId'` prints `runFight` (respec 1).
- [ ] `jq '.paths["/api/fight"].post.responses | keys'` prints `["200","400","405"]`, each with a `$ref` into
      `components.schemas`, and `jq '.components.schemas | keys'` lists `FightError`, `FightRequest`,
      `FightResponse` and every nested schema, with no object schema defined inline under `.paths` (respec 1).
- [ ] `jq '.info.description'` states that `/api/models/army` is not part of the API (respec 1).
- [ ] `FightRequest` lists all seven fields with the min/max above, `battles` has `default` 1000, and the
      cross-field rules appear in the schema description. Every `FightResponse` and `FightRequest` property has
      a `description` (respec 1).
- [ ] `npm run acceptance` includes a contract spec that validates a real 200 body, a real 400 body, and a real
      405 body against the spec's schemas with Ajv, and exits 0 (respec 1).
- [ ] The contract spec fails when (check each once locally and note it in the PR; no committed negative test):
      a field is removed from `FightResponse.properties` in the spec; a new field is added to the handler's
      response; a spec maximum is changed to differ from the handler's cap (respec 1).
- [ ] The contract spec's boundary cases pass: for every request field the spec's max is accepted and max + 1 is
      a 400; regulars + elites 11 is 400; 0 regulars and 0 elites is 400; leaders 6 is 400; `battles`
      100001 is 400; omitting `battles` succeeds with N equal to the spec default (respec 1).
- [ ] One module `fight-api.ts` exports `FightRequest`, `FightResponse`, `FightError` and nested types, and
      `pages/api/fight.ts` imports them (no local duplicate `BattleStats` or equivalent remains).
- [ ] Type/spec drift is caught (respec 1): renaming a key in an exported type makes `npx tsc --noEmit` fail in
      the contract spec; renaming the same key only in the spec makes `npm run acceptance` fail. Verify each
      once locally and note it in the PR.
- [ ] `npx tsc --noEmit` passes and changing a field name in the exported response type makes `fight.ts` fail to
      compile (verify once locally, note in the PR).
- [ ] `npx next build` succeeds, `/api/fight` does not gain a new route (no types file under `pages/api/`), and
      `docs/api/openapi.json` is not served by the app.
- [ ] The wire behavior of `/api/fight` is unchanged by this ticket: the same requests produce the same
      status codes and bodies as before it (spot check three requests: valid, invalid field, GET).
- [ ] The spec's request and 200 examples are real endpoint output (re-run the request and compare), and the
      `FightResponse` example validates against its own schema.
- [ ] `ajv` is the only new dependency, declared as a devDependency with `package-lock.json` updated.
- [ ] Neither the spec, the doc link line, nor any changed code or comment references ticket ids, invariant
      numbers, or factory files.
- [ ] No INVARIANTS.md regressions (adjacent: W1, W2, S3; the spec must not contradict the combat design doc).

## Open questions

Resolved by the owner (2026-10-28):
1. `/api/models/army` stays where it is. The spec does not list it, and a description in the spec states it is
   not part of the API. (Was: move out of `pages/api/` versus document as unsupported.)
2. "Reviewable" (plan spec gap 7) means an OpenAPI JSON spec read with `jq`, checked against the running
   endpoint by the acceptance harness, plus exported shared types consistent with the spec.
3. Doc location: the spec file `docs/api/openapi.json` replaces both `docs/combat-simulator.md` section and
   `docs/api.md`. The design doc may link to it.
4. The `{ error: string }` body for 400 and 405 is accepted for now.

Open: none for the owner. Implementer judgment, not owner decisions: the exact property names and nested schema
names in `FightResponse` come from the merged SGS-005 code and the design doc, and the field type encoding in
`FightRequest` follows what the merged parser accepts (see Scope item 1). If the design doc and merged code
disagree on a response field name, bounce to `needs_spec`.

## Re-spec 2026-10-28

**Underspecified:** the first version read "reviewable" as a prose doc plus TypeScript types, left
`/api/models/army` and the doc location as open questions, and verified the doc only by hand with curl.

**Changed (owner answers 2026-10-28):** the prose doc (`docs/combat-simulator.md` section or `docs/api.md`) is
replaced by `docs/api/openapi.json` (OpenAPI 3.1, JSON, `components.schemas`, stable `operationId`
`runFight`, `jq`-readable). Added a contract spec in the SGS-002 harness that validates real 200/400/405
responses with Ajv and checks boundaries from the spec, plus a key-set drift check between the exported types
and the spec. Exported shared types stay. `/api/models/army` is left in place and mentioned only in the spec
description. Open questions are resolved. Added SGS-002 to Depends on, added the `ajv` devDependency, raised
Risk from standard to high (public API contract and schema), LOC from ~60-120 to ~330 total (~120 business logic).

**Branch work that still stands:** none known; this ticket was not started (status `needs_spec`). If a branch
exists, the `fight-api.ts` types module and the `fight.ts` import edits are reusable as is, and any prose doc is
discarded.
