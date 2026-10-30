# SGS-006 implementer report

- Ticket: SGS-006 (publish /api/fight OpenAPI spec, shared types, contract check)
- Branch: `sgs-006-fight-api-contract`, base `origin/main` 11038fe
- Tip: `a92b2ef0d7b559eb383fd6a1a59a27f2def6c560` (one commit, author choinickolas@gmail.com)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-006-fight-api-contract`
- Status: **needs_review**

## Pre-check against merged code

The merged handler and simulator match the SGS-003/SGS-005 contract copied into the ticket: field names, the
digit-string and integer encodings, ranges (0-10, 0-5, battles 1-100000 with default 1000), validation order,
error statuses, and the response keys. `battle.ts` exports `OUTCOME_KINDS` and
`OutcomeKind = typeof OUTCOME_KINDS[number]`. No bounce needed.

## Files touched

- `docs/api/openapi.json` (new): OpenAPI 3.1.0 spec. One path, `runFight`, nine `components.schemas`, no
  optional `ArmyCount`. Examples are pasted from real requests to `next dev`: the 3/1/1 + `battles: 20` 200
  body, the four 400 classes, and the GET 405.
- `lib/combat-simulator/fight-api.ts` (new): the nine exported types. Types only.
  `FightOutcomes = Record<OutcomeKind, OutcomeTally>` uses `import type` from `battle.ts`.
- `lib/combat-simulator/simulate.ts`: removed the local `OutcomeTally`, `SurvivorTally`, `RoundStats` and
  `SimulationSummary` declarations and used the shared types. `summary()` and `simulateBattles` now return
  `FightResponse`, and the local `outcomes` record is cast to `FightOutcomes` on return. Type-only.
- `lib/combat-simulator/simulate.test.ts`: one line, `summary.outcomes.extra` became
  `summary.outcomes['extra']`. The closed `FightOutcomes` type has no `extra` key; the test behaves the same.
- `pages/api/fight.ts`: `NextApiResponse<FightResponse | FightError>`, plus `req.body as FightRequest` where the
  handler reads the body, plus the type import. No runtime change.
- `components/apps/combat-simulator/results.js`, `pages/apps/combat-simulator.js`: JSDoc
  `import(...).FightResponse` references. No `checkJs`.
- `acceptance/fight-api-contract.spec.ts` (new): the contract check covering cases 1-8. This test file is the
  ticket's own scope.
- `package.json` / `package-lock.json`: `ajv ^8.20.0` added as a devDependency. I reverted the lockfile `name`
  that npm had changed to the worktree folder.

Item 6 needed no change because `docs/combat-simulator.md` on main already links to `docs/api/openapi.json`.
Item 7: `pages/api/models/army.ts` is untouched.

## Tests

- `npm test` (Vitest): 4 files, 57 passed, 0 failed. These are the existing unit tests, which this change
  leaves alone apart from the one-line typing fix. No new unit tests: the ticket adds types and a spec file,
  with no new logic to unit-test.
- `npx playwright test acceptance/fight-api-contract.spec.ts`: 31 passed.
  - Case 1: `operationId`, the response keys are exactly 200/400/405, `headers.Allow` is declared, and every
    example validates. Deleting any one of attacker/defender/tie is rejected (3 tests). An extra
    `{count, frequency}` kind is accepted and an extra `{count}` kind is rejected.
  - Case 2: the request example gives a 200 that validates, the key sets match at every level, and the
    `outcomes` keys equal `OUTCOME_KINDS`.
  - Cases 3-5: 400 for `attack-ldrs: 6`, GET 405 with `allow: POST`, malformed JSON gives plain-text
    `Invalid JSON`, and the spec's 400 description mentions it.
  - Case 6: ranges are read from each field's integer branch (found by `type`), and the test asserts the string
    branch's `x-minimum`/`x-maximum` equal them. Boundaries use the specified pairing; battles covers min,
    min-1 and max+1.
  - Case 7: attack 10+1 gives 400 naming `attack`, defend 0+0 gives 400 naming `defend`, and an omitted
    `battles` returns the spec default.
  - Case 8: nine `Record<keyof T, true>` literals compared with the schema `properties`, the schema-name set
    equals the type set, and `OUTCOME_KINDS` equals `FightOutcomes.required`.
- `npm run acceptance` (full suite): **179 passed**, 0 failed.

### Mutations verified once locally (not committed)

Each was applied, run, and reverted.

| Mutation | Result |
|---|---|
| Remove `hitsPerRound` from the `FightResponse` schema | 12 failed |
| `attack-ldrs` maximum 4 (integer branch only) | 1 failed |
| `attack-ldrs` maximum 4 (both branches) | 1 failed |
| `attack-ldrs` maximum 6 (both branches) | 1 failed |
| `FightOutcomes.additionalProperties: false` | 1 failed |
| Drop `tie` from `FightOutcomes.required` | 2 failed |
| Rename `p90` to `p95` in the spec only | 12 failed |
| Rename `p90` to `p95` in `fight-api.ts` only | `tsc` errors in `simulate.ts`, the spec literal and `simulate.test.ts` |
| Rename `hitsPerRound` in `FightResponse` | `tsc` errors |
| Handler adds an extra top-level key | 9 failed |

## Codegen, build, lint

- codegen: not set in REPO.md.
- build: `npm ci && npx next build` succeeded. The route list is unchanged: `/api/fight` and
  `/api/models/army`, with no new API route.
- lint (`npx tsc --noEmit`): 0 errors.
- `GET /docs/api/openapi.json` on `next dev` returns 404, so the spec is not served.
- jq criteria all printed the expected values:
  - `openapi` is 3.1.0.
  - The paths list is exactly `["/api/fight"]`.
  - The schema names are the nine listed.
  - There are 0 inline objects under `.paths`.
  - The `additionalProperties` check gives `["FightOutcomes"]`, and that schema's `additionalProperties` is the
    `OutcomeTally` `$ref`.
  - `FightOutcomes.required` sorted is attacker, defender, tie.
  - `FightRequest` has 7 properties.
  - No property lacks a description.
- `grep` finds no `tie` in `fight-api.ts` and no `100000` in the contract spec.
- No ticket ids or factory references appear in shipped files.

## Deviations and notes for review

- **File timeout:** I used `test.describe.configure({ timeout: 60_000 })` instead of a top-level
  `test.setTimeout(60_000)`. Playwright only allows `setTimeout` inside a test or hook; `configure` at top level
  is the file-scoped equivalent.
- **Warm-up request:** `beforeAll` sends one request with a 60 s timeout, because `next dev` compiles the route
  on first hit, matching the sibling `fight-api-battles.spec.ts`. Every contract request uses the 10 s timeout.
  This is a literal departure from "timeout: 10_000 on every request". Without it, the first test could time
  out on a cold compile.
- **Malformed JSON body:** the raw `{"attack-regs":` body is sent as a `Buffer`. Sent as a string, Playwright
  JSON-encodes it into a valid JSON string, and the handler then returns `request body must be a JSON object`
  rather than `Invalid JSON`. I saw this in a real run.
- **Outcomes cast in `simulate.ts`:** `OutcomeAccumulator` still accepts a custom kind list, which only tests
  use. For a custom list, the `as FightOutcomes` cast in `summary()` is nominal; with the default
  `OUTCOME_KINDS` it is exact.
- **Stricter request schema:** `FightRequest` has `additionalProperties: false`, as the ticket requires. Its
  description says the schema is deliberately stricter than the server, which ignores extra keys.
- **Removed exports:** `simulate.ts` no longer exports `OutcomeTally`, `RoundStats`, `SurvivorTally` or
  `SimulationSummary`. Nothing else imported them.

## Invariant check

- **S3 (bounded simulation):** upheld. The spec documents the caps the handler enforces, and the contract
  check drives each cap boundary against the live endpoint. No new input.
- **W1 (design doc rules):** upheld. The spec covers only field meanings and the cross-field input rules the
  ticket requires; no dice or casualty rules are restated.
- **W2 (independent battles):** untouched. No runtime change in `simulate.ts` or `fight.ts`.
- **S1:** upheld. The shared types live in `lib/combat-simulator/`, and no app imports another app.

## Out-of-scope findings

1. `acceptance/fight-api-validation.spec.ts`, test "malformed JSON runs no battle", passes for the wrong
   reason. `postRaw` sends the string `{"attack-regs":` through Playwright `data:`, which JSON-encodes it, so
   the server receives a valid JSON string and answers `request body must be a JSON object`. It never exercises
   Next's `Invalid JSON` path. Sending a `Buffer` fixes it.
2. The full acceptance run logs `[WebServer] error - TypeError: resolver is not a function`. This comes from
   `GET /api/models/army` in `fight-api-caps.spec.ts`: the route file has no default handler. The run still
   passes, the contract spec alone does not trigger it, and the behavior is pre-existing.
3. Sandbox note: npm's default cache `~/.npm/_cacache` is read-only here. I ran installs with
   `--cache "$TMPDIR/npm-cache"`.

## Processes

The `next dev` instances I started by hand (ports 3977 and 3978) are stopped, and nothing is listening on them.
Playwright's own web servers exit with each run.
