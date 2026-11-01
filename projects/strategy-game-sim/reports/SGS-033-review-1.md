# SGS-033 review 1

- Ticket: SGS-033 (POST /api/aoe4-build-order/simulate route and OpenAPI), risk high, full review
- Branch: `sgs-033-aoe4-simulate-route` @ aed8cad (local, not pushed), base origin/main a714a23 (merge-base confirmed)
- Worktree: `$FACTORY_DIR/worktrees/review-sgs-033` (detached, removed after review)

## Verdict: APPROVE

No blocking findings.

## Blocking findings

None.

## Spec gaps

None that block. One piece of ticket wording can't be met as written (see AC 82 below): "every other existing fight spec passes unchanged" conflicts with adding any component schema, because `acceptance/fight-api-contract.spec.ts` on main compared the fight types against *every* component schema. The manager should record that the ticket accepts the edit (the reasoning is under Deviations).

## Commands

- `npx tsc --noEmit`: exit 0, no output.
- `npm test`: 20 files, 555/555 passed.
- `npm run acceptance`: 302/302 passed. This includes both new AoE4 specs and every fight spec.
- `npx next build`: succeeded, and the route list has `ƒ /api/aoe4-build-order/simulate`.
- OpenAPI validity: `jq empty` passes. `operationId` count is 1 on main and 2 on the branch. I resolved all 45 `$ref`s and none dangle. Every component schema compiled under Ajv2020 `strict: true` (with `example` added as a keyword). The only error was the existing `x-minimum` on `FightRequest`, which is an allowed `x-` extension and was not added by this diff. `openapi: 3.1.0`, so `const`, `type: [.., "null"]`, `propertyNames` and `$ref` siblings are all legal. I could not run Redocly: the sandbox blocked `npx @redocly/cli`.
- Live requests against `next dev` (port 3947, now stopped):
  - 200 steps with `durationSeconds` 3600 answered in 10-16 ms.
  - 20,000 JSON-escaped control characters made a 120,012-byte body, which got a 400 in 2 ms.
  - A `text/plain` body got 400 `request body: must be a JSON object`.
  - An empty JSON body got the exactly-one `syntax` issue.
  - `inputs: null` got 200, because it is treated as absent (`inputs ?? {}`, as the design says).
  - `inputs: []` got 400 `inputs: must be an object`.
  - `buildOrder: null` got 400 `build order: must be an object`.
  - OPTIONS got 405 with `Allow: POST`.

## Deviations judged

1. **`acceptance/fight-api-contract.spec.ts` edited. Accepted.** The old assertion `keys(typeKeys) == keys(all schemas)` fails as soon as any non-fight schema exists, so the edit is required. The new assertion compares the fight types against the schemas reachable by `$ref` from `paths['/api/fight']`, walked transitively by `referencedSchemas` (l.51-65). It still checks both directions for `/api/fight`:
   - a schema the fight route references with no exported type fails;
   - an exported type whose schema the route doesn't reference fails.

   The fight contract itself is not weakened. One thing is lost when this is combined with the loosened pinned-name test (see Non-blocking note 1): an orphan, unreferenced schema is no longer caught anywhere.
2. **405 reuses `FightError`. Accepted.** The ticket bans inline `type: object` under `paths`, and the schema list has no `{ error }`-only AoE4 schema, so reuse is the only option that doesn't invent a name. S1 is about code imports and still holds: the route imports only `lib/aoe4-build-order/*`, and its TS type is `Pick<SimulateError, 'error'>` (simulate.ts:41). The coupling is spec-level only. Because `FightError` is pinned by the fight surface spec, any change to it is already guarded.
3. **Request `examples` (two) instead of one `example`. Accepted.** The `buildOrder` example is the paste-free JSON order the ticket asks for, with `start` and a `rally` step. The `text` example is the same order as paste. Media-type `examples` is valid OpenAPI 3.1. The contract spec validates both and asserts that each returns exactly the documented 200 body (contract spec l.204-208).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 71 | api.ts exports five types; thin route | pass | `lib/aoe4-build-order/api.ts` exports exactly the five types, `inputs?: SimInputOverrides`. The route is 66 lines: shape checks, `textChars`, sequencing, HTTP mapping |
| 72 | Text path, JSON path, A3 | pass | api spec l.57-76 |
| 73 | inputs defaults and trips granularity | pass | api spec l.79-101 |
| 74 | Each issue code | pass | api spec l.104-175. The 20,000-char case is padded with a `#` comment and returns 200 |
| 75 | Every invalid rule plus passing neighbours | pass | api spec l.177-211 |
| 76 | Issue location | pass | api spec l.213-230 |
| 77 | Order and inputs both reported, order issue first | pass | api spec l.232-243; route l.57-65 |
| 78 | Non-object body: one syntax issue, inputs stage skipped | pass | route l.48-53 returns before `resolveSimInputs`; api spec l.245-255 |
| 79 | 405, Invalid JSON, 413 recorded in PR | **unchecked** | 405, `Invalid JSON` and 413 all pass (api spec l.258-280), and both framework responses are in the operation prose. "Recorded in the PR" can't be checked because no PR exists yet. The PR body must state that Next 16.4.3 returns 413 at 1,048,577 bytes |
| 80 | openapi.json path, operationId count, schema names | pass | count is 1 on main and 2 on the branch. All 16 schemas listed in the ticket exist; `SimulateResponse`, `SimInputs` and `TripInputs` do not |
| 81 | Contract spec | pass | contract spec, 48 tests |
| 82 | Spec-surface loosened; `toEqual(['/api/fight'])` 0 hits; "every other fight spec passes unchanged" | **unchecked** | The surface loosening matches Scope 4 and the grep finds 0 hits. All fight specs pass, but `fight-api-contract.spec.ts` was changed, so "unchanged" is literally false. The change is required and accepted (Deviation 1); the manager should record that the ticket accepts it |
| 83 | Mutation check recorded in PR | **unchecked** | The implementer report records the three mutations and which specs failed. I did not re-run them, and no PR exists to hold the record. Reading the code agrees with the report: skipping the text cap makes 20,001 `x` a single `syntax` line issue; `lines` on the JSON path adds `line`; dropping the inputs stage loses the `durationSeconds` 59 issue |
| 84 | docs Route agrees with handler; greps | pass | `partial \`SimInputs\`` has 0 hits. The only hit for `aoe4-build-order/simulate` outside openapi.json is `docs/aoe4-build-order.md:438`, which I re-read. The Route section names `SimInputOverrides`, the issues ordering and the 413 |
| 85 | tsc, unit, acceptance, build | pass | see Commands |
| 86 | No invariant regressions | pass | see below |

## Invariants touched

- **S1. Holds.** The route imports only `lib/aoe4-build-order/{api,data,model,parse-text,simulate,validate}`. The only cross-app link is the spec-level `$ref` to `FightError`, which is not a code import.
- **S3. Holds.**
  - `text.length > SIM_INPUT_BOUNDS.textChars.max` is checked before parsing (simulate.ts:30-33). The comparison is a strict `>`, so 20,000 is accepted and 20,001 rejected, and both cases are tested.
  - Steps are capped by `validateBuildOrder` (validate.ts:185), and the route adds no second check.
  - Every numeric input is bounded by `resolveSimInputs` or the validator.
  - `simulateBuildOrder` runs only when both stages return ok (simulate.ts:59).
  - The largest legal body I measured simulated in at most 16 ms.
- **A1. Holds.** The route has no game numbers. The 200 and 20,000 caps come from `SIM_INPUT_BOUNDS`.
- **A2. Not touched.** The engine is unchanged. The `waitSeconds` schema description matches simulate.ts:306.
- **A3. Holds.** No clock or randomness in the route. Byte-identical bodies are asserted (api spec l.72-76).

## Focus checks requested

- **Public surface vs openapi.json.**
  - The schema properties equal the TS keys for 11 schemas (contract spec l.296-347).
  - Every `SIM_INPUT_BOUNDS` row matches type, min and max at each place it appears (contract spec l.150-190).
  - Request schemas are open and response schemas are closed, with every property required except `BuildOrderIssue.step` and `line`.
  - Real 200 and 400 bodies validate, and their mutations do not.
- **Body-size and textChars limits.** 413 at just over 1 MB was confirmed on the installed Next by the passing spec. There is no `bodyParser` config. The text cap is described above.
- **Error-status mapping.** Non-POST gives 405 with `Allow`. A non-object body gives 400 with one issue. Any issue from either stage gives 400 with `error = issues[0].message`. `issues` is never empty on the 400 path: every `ok: false` producer pushes at least one issue (validate.ts:325, validate.ts:409, parse-text.ts:266), and the route only reaches l.64 when one stage failed. Otherwise 200. There is no try/catch, as the ticket says.
- **Trigger `oneOf` on `kind`.** Two variants with `const` `time` and `villagers`. The description states that an unknown kind is schema-invalid and that the server returns `unknown-trigger-kind`, and contract spec l.263-273 asserts both.
- **Parser lines on the JSON path.** `lines` is passed only on the text path (simulate.ts:38). The JSON path calls `validateBuildOrder(body.buildOrder, data)` with no options (simulate.ts:24).
- **Unbounded issues list.** Note only; the ticket sets no cap. Measured:
  - `"x\n"` × 10,000 (20,000 chars) gives 10,000 issues and a 908 KB response in 53 ms;
  - a 649 KB body with 60,000 unknown `inputs.trips` keys gives a 4.7 MB response in 77 ms.

  Next's 1 MB request limit bounds both. Follow-up candidate: cap `issues`, or stop collecting after N.
- **docs Route vs design/M2.md "Route" and "Route request and issues".** They agree on exactly-one with null counting as present, the text cap without parsing, the two-stage ordering, the non-object body rule, the location rules, and Invalid JSON plus 413.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there are no bot findings.

## Non-blocking notes

1. `acceptance/fight-api-spec-surface.spec.ts:22` and l.43. `fightSchemas` filters the schemas down to `FIGHT_SCHEMA_NAMES`, so "has exactly the pinned fight schema names" now fails only when a pinned schema is removed, never when one is added. Together with Deviation 1, a stray unreferenced schema (for example a new `FightFoo`, or a leftover AoE4 schema) now passes every spec. On main it failed both. Suggested change: one assertion that `keys(schemas)` equals `FIGHT_SCHEMA_NAMES` ∪ the AoE4 names (the contract spec already lists them in `REQUEST_SCHEMAS`, `RESPONSE_SCHEMAS` and `SHARED_SCHEMAS`).
2. `docs/api/openapi.json`, `ResourceKind`. The ticket requires this schema, but nothing references it: `gatherRates` and `floating` spell out food, wood, gold and stone inline. It could be wired in with `propertyNames: { $ref: ResourceKind }`, or left as is.
3. `pages/api/aoe4-build-order/simulate.ts:35`, l.59 and l.64 narrow with `'issues' in x` / `'order' in x` instead of the `ok` discriminant the lib result types declare (validate.ts:322, parse-text.ts:5-6). It works, but `!parsed.ok` would read closer to the lib. `fight.ts:110` uses `'error' in`, but only because its result type has no `ok` field.
4. `SimInputOverrides.influenceCoverage` has `default: {"mill":1}` in the OpenAPI. JSON Schema reads that as a whole-object default, while the server merges per key. The description says so ("keys left out keep their default"), so this is a documentation nuance only.
5. Small schema/server differences, all by design:
   - `inputs: null` is schema-invalid (type object) but the server treats it as absent (`inputs ?? {}`, the M2 design);
   - an `application/x-www-form-urlencoded` body with `text=...` is simulated (200), although the spec documents only `application/json`. `/api/fight` behaves the same way.
6. `docs/aoe4-build-order.md:449-450`. The Route bullet lists paste-step, JSON-step and inputs locations but leaves out "a JSON `start` issue carries neither". The OpenAPI prose has the full rule, and the doc says it does not copy the field lists.
7. The `docs/aoe4-build-order.md` diagram (l.423-433, existing and not changed) draws parse → validate even when the parse fails. A parse failure goes straight to 400. This is outside the diff.

## Out-of-scope findings

- No cap on `issues` count (`lib/aoe4-build-order/validate.ts` `resolveTrips`, `resolveInfluence`, `checkStartVillagers`; `parse-text.ts` one issue per line). Each is bounded only by Next's 1 MB body limit; a 649 KB request produced a 4.7 MB 400 body. This matches the implementer's report.

## Coverage

- Reviewed in full:
  - `pages/api/aoe4-build-order/simulate.ts`
  - `lib/aoe4-build-order/api.ts`
  - `acceptance/aoe4-simulate-api.spec.ts`
  - `acceptance/aoe4-simulate-api-contract.spec.ts`
  - `acceptance/fight-api-contract.spec.ts` (diff)
  - `acceptance/fight-api-spec-surface.spec.ts` (diff)
  - `acceptance/helpers.ts` (diff)
  - `docs/aoe4-build-order.md` (diff and Route context)
  - `docs/api/openapi.json`: the new path, and every new schema read through jq
- Read for context:
  - `lib/aoe4-build-order/validate.ts`: bounds, `validateBuildOrder`, `resolveSimInputs`, start and step location
  - `lib/aoe4-build-order/parse-text.ts`: parse result
  - `lib/aoe4-build-order/model.ts`
  - `pages/api/fight.ts` and `lib/combat-simulator/fight-api.ts`, as sibling route and types
- REPO.md review checklist:
  - "Every diff": `next build` was run. No page was touched, so there was no page to load; the route was exercised with live requests instead.
  - No REPO.md checklist section covers `pages/api/aoe4-build-order/**` or `lib/aoe4-build-order/**`. The "Combat simulator" section applies only through the two fight spec edits, and every fight spec passes. Shared code, StarCraft and `golang/`: not touched.
- Not done:
  - I did not re-run the implementer's three mutations (they are recorded in the implementer report).
  - Redocly lint was blocked by the sandbox, so OpenAPI validity rests on jq, the `$ref` resolution check and the Ajv strict compile.
- Processes: the `next dev` on 3947 was stopped (its process group was killed) and the port is free. The acceptance harness started and stopped its own server.
- Ticket file: ticked ACs 71-78, 80, 81 and 84-86; left 79, 82 and 83 unchecked for the reasons above.
