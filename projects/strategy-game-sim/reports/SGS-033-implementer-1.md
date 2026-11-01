# SGS-033 implementer report 1

- Ticket: SGS-033 (POST /api/aoe4-build-order/simulate route and OpenAPI)
- Branch: `sgs-033-aoe4-simulate-route`, base origin/main a714a23
- Tip: aed8cad65cecf4c6246a735f9aa21342145d1797 (one commit, authored choinickolas@gmail.com, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-033-aoe4-simulate-route

## Files touched

- `lib/aoe4-build-order/api.ts` (new, 19 lines): the five types (TripInputOverrides, SimInputOverrides, SimulateRequest, SimulateResponse = SimulationResult, SimulateError), plus the "openapi.json is the contract; keep the two in step" header.
- `pages/api/aoe4-build-order/simulate.ts` (new, 66 lines): a thin handler. 405 with `Allow: POST`. A body that is not an object gets one `syntax` issue. `checkOrder` does exactly-one (undefined means absent, null counts as present), then text must be a string, then the `textChars` cap on `text.length` with no parse, then parse and `validateBuildOrder` with `{ lines }`. A `buildOrder` gets `validateBuildOrder` with no lines. After that `resolveSimInputs(inputs ?? {})` always runs, issues are concatenated with order issues first, `error = issues[0].message`, otherwise 200 `simulateBuildOrder`. No try/catch and no bodyParser config. Imports nothing from `lib/combat-simulator/`.
- `docs/api/openapi.json` (+1237, insertions only): the path `simulateBuildOrder` with 200/400/405 and 16 component schemas, named exactly as the ticket lists them. There are no SimulateResponse, SimInputs or TripInputs schemas. Request schemas are open and response schemas closed, and every property and oneOf variant has a description. The operation prose covers issue ordering, issue location, defaults at any depth, Invalid JSON 400 and the 413. Examples come from real responses.
- `docs/aoe4-build-order.md` "Route" (l.436-458 on this base; the ticket said l.343-357): SimInputOverrides at any depth, the null-counts-as-present rule, the text cap without parsing, issue ordering and the non-object body rule, issue location, and the 413 beside Invalid JSON.
- `acceptance/fight-api-spec-surface.spec.ts`: the paths test now expects both paths. The pinned-name, every-property-required and open-schema tests are scoped to `FIGHT_SCHEMAS` (ArmyCount plus the nine Fight* names). The inline-object test still walks all paths.
- `acceptance/fight-api-contract.spec.ts`: **not named in the ticket, but the change was needed.** Its test `expect(keys(typeKeys)).toEqual(keys(schemas))` compared the fight types against *all* component schemas, so it fails once any AoE4 schema exists. It now compares against the schemas reachable by `$ref` from `paths['/api/fight']`, using a `referencedSchemas` walker. The fight assertion is no weaker (both directions are still checked), but this means "every other fight spec passes unchanged" is not literally true.
- `acceptance/helpers.ts`: added `SIMULATE_PATH`, `postSimulate` and `postSimulateRaw` (sends a Buffer, for bare JSON values and malformed JSON).
- `acceptance/aoe4-simulate-api.spec.ts` (new, 45 tests): the HTTP acceptance cases.
- `acceptance/aoe4-simulate-api-contract.spec.ts` (new, 48 tests): the Ajv2020 contract checks.

## Tests

- `npx tsc --noEmit` (lint): clean.
- `npm test`: 20 files, 555/555 pass. No unit tests were added because the route is a thin handler and the ticket puts its tests in acceptance.
- `npm run acceptance`: 302/302 pass, including the 93 new tests and every fight spec.
- `npx next build`: succeeds and lists `ƒ /api/aoe4-build-order/simulate`.
- What the HTTP spec covers:
  - text and JSON give deep-equal unitsProduced, steps and times (A3), and two identical requests give byte-identical bodies;
  - `inputs: {}` and omitted inputs give the same body;
  - `durationSeconds` 300 makes the last sample time 300;
  - `trips.farm.walkSecondsCamp` 3 returns 200, and 999 gives exactly one out-of-range issue naming the full path;
  - every issue code appears: syntax for neither, both, `text: null` with buildOrder, non-string text, array body, non-object step, and an unparsable paste line (which carries its line). The others are unknown-trigger-kind, unknown-id, unsupported-tech (military-academy), unknown-tech-effect (forestry), out-of-range (inputs, 201 steps, 20,001 chars as exactly one issue), and invalid;
  - 20,000 chars (padded with a `#` comment) is not rejected;
  - eight invalid rules, each with a passing neighbour (start sums to 6, kings-palace, wheelbarrow at mill);
  - location rules (paste: line+step; JSON: step only; start and inputs: neither);
  - order and inputs issues both appear, order first;
  - `[]`, `"x"` and `null` each give one syntax issue with no location;
  - GET, PUT and DELETE return 405 with `Allow: POST`;
  - plain-text Invalid JSON;
  - a body just over 1 MB returns a non-JSON 413.
- What the contract spec covers:
  - structure, and which schema names are present or absent;
  - request schemas open, response schemas closed and required;
  - descriptions everywhere;
  - prose assertions;
  - every SIM_INPUT_BOUNDS row equals the schema's min, max and integer-or-number at every place it appears, plus the text maxLength and steps maxItems;
  - all examples validate, both request examples return exactly the 200 example, each 400 example equals the real response, and the 405 example equals a real GET;
  - a real 200 validates while extra-prop, missing-`times` and nested-extra variants do not; a real 400 validates while an extra prop on an issue does not;
  - the schema and the server agree on: unknown trigger kind (schema-invalid, and the server returns unknown-trigger-kind, a rule written in the Trigger description), a time trigger, text over maxLength, and both keys present;
  - the exported TS type keys equal the schema properties for 11 schemas.

## Mutation checks

Run in a throwaway detached worktree with its own `npm ci`, against the two new specs. Nothing was committed, and the worktree was removed afterwards.

1. textChars check skipped (`if (false && text.length > maxChars)`): 2 failed. These were `out-of-range: text of 20,001 characters is rejected without parsing` and contract `text over maxLength is schema-invalid and the server rejects it`.
2. `lines` passed on the JSON path: 5 failed:
   - `issue location > a paste step issue carries line and step; the same fault as JSON carries step and no line`
   - `a JSON start issue and an inputs issue carry neither step nor line`
   - `syntax: a step that is not an object`
   - `invalid rules > walkSeconds on a produce without rally`
   - contract `the stepAndInputs 400 example equals the real response`
3. inputs stage dropped (`resolveSimInputs({}, data)`): 8 failed, among them:
   - `issue ordering > order and inputs issues are both reported, the order issue first`
   - `out-of-range: inputs.durationSeconds 59`
   - `durationSeconds sets the horizon and the last sample time`
   - `an out-of-range trip field is one issue naming its full path`
   - contract request-example 200s and stepAndInputs

   3b. inputs resolved only when the order passed: 2 failed, the issue-ordering test and contract stepAndInputs.

## Invariants

- S3: `text` is capped at the route before parsing. Steps and every numeric input are bounded by `validateBuildOrder` and `resolveSimInputs` before `simulateBuildOrder` runs, and nothing is simulated if there is any issue.
- A3: the route has no clock or randomness. Determinism is asserted over HTTP.
- S1: the route imports only `lib/aoe4-build-order/*`. The 405 response schema `$ref`s the existing `FightError` (`{ error }`), which is spec-level reuse only; the TS response type uses `Pick<SimulateError,'error'>`.

## Notes and deviations

- Request examples sit under `examples` (`buildOrder` and `text`), not a single `example`. The JSON example is the paste-free order the ticket asks for, and the text one is its equivalent; both return the identical 200 example.
- The 405 response schema reuses `FightError` rather than adding a schema the ticket does not list.
- 413 was seen on Next 16.4.3: 1,048,577 bytes gives `413 Body exceeded 1mb limit` as plain text, and 1,048,576 bytes reaches the handler.
- Throwaway worktrees cannot symlink node_modules: Turbopack fails with "Could not find the Next.js package". They need a real `npm ci`.

## Out-of-scope findings

- No cap on the number of issues: `start.villagers`, `inputs.trips` and `inputs.influenceCoverage` each yield one issue per bad key with no limit on key count (lib/aoe4-build-order/validate.ts). The 1 MB body limit bounds it in practice. I did not invent a cap.
- `simulate.ts` was not touched (SGS-031/032 run in parallel).

## On merge (manager)

- Update CONTEXT.md Key surfaces with `POST /api/aoe4-build-order/simulate` (`operationId: simulateBuildOrder`).

## Processes

My hand-started dev server on port 3987 and the mutation runs' servers are stopped, the ports are free, and the mutation worktree is removed.

Status: needs_review
