# SGS-006 review (pass 1, full)

- Branch: `sgs-006-fight-api-contract`, tip `a92b2ef` (one commit), base `main` 11038fe (merge-base confirmed).
- Worktree used: `worktrees/review-sgs-006-fight-api-contract` (detached at a92b2ef; removed after review).
- **Verdict: APPROVE**

Note for the manager: the branch exists only locally. `origin/sgs-006-fight-api-contract` does not exist
(`git ls-remote origin 'sgs-006*'` is empty), so I reviewed the local commit a92b2ef. Push before opening the PR.

## Blocking findings

None.

## Spec gaps

None.

## Commands run

- `npm ci --cache $TMPDIR/npm-cache`: ok; the working tree stayed clean.
- `npx tsc --noEmit` (lint): 0 errors.
- `npm test`: 4 files, 57 passed.
- `npx next build`: succeeds. The route list is `/api/fight` and `/api/models/army` only, so no new API route.
- `npm run acceptance`: 179 passed, 0 failed (11.7 s).
- `next dev` on port 3871 with curl:
  - `GET /docs/api/openapi.json` returns 404.
  - `/apps/combat-simulator` returns 200.
  - Posting the spec's request example returns a 20-battle body with outcomes attacker/defender/tie.
  - `[1]` returns 400 `request body must be a JSON object`, and `battles: 0` returns 400 with the spec's message.
  - The raw `{"attack-regs":` body returns `HTTP 400 Invalid JSON` as plain text.
  - The server was stopped and nothing listens on 3871.
- I applied these mutations myself, ran them, and reverted each one (the tree was confirmed clean afterwards):

| Mutation | Result |
|---|---|
| `attack-ldrs` integer max set to 4 | contract spec: 1 failed |
| `FightOutcomes.additionalProperties: false` | 1 failed |
| `tie` dropped from `FightOutcomes.required` | 2 failed |
| handler adds a top-level `extra` key | 9 failed |
| `p90` renamed to `p95` in `fight-api.ts` only | `tsc` errors in `simulate.ts`, the contract spec literal and `simulate.test.ts` |

## Acceptance criteria

All checked with evidence unless noted.

| # | Criterion | Result |
|---|---|---|
| 1 | Spec parses, version 3.1.x | pass: `3.1.0` |
| 2 | Paths exactly `["/api/fight"]`; info says `/api/models/army` is not part of the API | pass |
| 3 | Nine schema names; 0 inline objects under `.paths` | pass |
| 4 | FightRequest: 7 properties, required = the 6 army fields, `battles.default` 1000, ranges, `^[0-9]+$`, cross-field rules and order in the description | pass (compared with `pages/api/fight.ts` validateFightForm order: object, the six fields in order, per-side attack then defend, then battles) |
| 5 | Every property has a description; only `FightOutcomes` is open, with the `OutcomeTally` ref | pass: `[]` missing, `["FightOutcomes"]`, ref matches |
| 6 | FightOutcomes required and description | pass |
| 7 | Extensibility checks; mutations fail the suite | pass (I verified both mutations) |
| 8 | No termination-rule property (7 props) | pass |
| 9 | FightResponse tree matches SGS-005 section 1; HitsPerRound has min/maxItems 6 | pass: required equals properties at every level and matches SGS-005 section 1 |
| 10 | 400 description documents `Invalid JSON`; 405 `Allow` const POST | pass |
| 11 | Contract spec covers cases 1-8, exits 0, one Ajv root, a missing validator throws | pass: `validator()` throws when `getSchema` returns undefined |
| 12 | File and request timeouts; no 100000 in the spec | pass: `grep -n 100000` finds nothing. See deviations 1-2 |
| 13 | Examples are real output and validate | pass: case 1 validates every example; case 2 compares key sets of a live response. The error messages match the handler's strings exactly |
| 14 | Mutations "verified once locally and noted in the PR" | **left unchecked**: the local verification is done (by the implementer, and 4 of 6 by me), but no PR exists yet to carry the note |
| 15 | FightOutcomes derived from `OutcomeKind` (import type); no `tie` in fight-api.ts; OUTCOME_KINDS asserted against spec and live body | pass |
| 16 | Nine exports; fight.ts imports FightResponse/FightError with no local response type; simulate.ts uses FightResponse; renaming a type field breaks tsc | **left unchecked** for the same "note in the PR" reason. The substance passes, and I verified the tsc rename myself |
| 17 | No new pages/api file; build ok; spec not served | pass |
| 18 | Wire behavior unchanged; SGS-003 and SGS-005 acceptance specs pass without edits | pass: the `fight.ts` diff is an import, the response generic and the body cast. The `simulate.ts` diff is an import, removed duplicate interfaces, return types and one `as` cast. No acceptance spec other than the new file is edited |
| 19 | ajv is the only new dependency (devDependency), lock updated | pass: ajv 8.20.0 plus its 4 transitive dependencies, all `dev: true`; the lockfile `name` is unchanged |
| 20 | tsc passes | pass |
| 21 | No ticket ids, invariant numbers or factory refs | pass: grep of the diff is clean |
| 22 | No invariant regressions | pass (see below) |

## Invariants touched

- **S3 (bounded simulation):** holds. There is no new input. The spec documents the caps that `fight.ts` enforces
  (0-10, 0-5, battles 1-100000), and case 6 drives each boundary live.
- **W1 (design doc rules):** holds. The spec gives statistic definitions that match `docs/combat-simulator.md`
  "Outcome reporting": nearest-rank `ceil(p/100 × N)`, tie = both eliminated in the same round, survivor
  shares out of that side's wins. It restates no dice or casualty rules. The design doc already links to
  `docs/api/openapi.json` (line 119).
- **W2 (independent battles):** untouched. `simulateBattles` still builds fresh `BaseArmy` objects in each iteration,
  and nothing changed at runtime.
- **S1 (app independence):** holds. The new file is under `lib/combat-simulator/`, and its only importers are the
  combat simulator route, page and component, plus acceptance.

## spec-checklist.md

- Contracts: the names match CONTEXT.md Key surfaces: the six form fields and `POST /api/fight`. The Key surfaces
  text still describes `BattleStats`; per the ticket, updating it is a manager action after merge.
- Scope: nothing out of scope is touched (no golang/, no handler behavior, no Swagger UI, no checkJs). No open
  question is answered with an invented constant: `info.version` `1.0.0` is a version label the manager note asked
  the implementer to state, not a game number.
- Naming: there are no aspirational enum values, and the `retreat` kind appears only in a test fixture.
- S1-S3 and W1-W2 are covered above. H1-H3 and A1-A3 do not apply because no paths in those sections are touched.

## Implementer deviations

1. **`test.describe.configure({ timeout: 60_000 })` instead of `test.setTimeout`:** accepted. Playwright rejects
   `test.setTimeout` outside a test or hook, and a file-level `describe.configure` gives the same per-file scope.
2. **Warm-up `beforeAll` request with a 60 s timeout:** accepted. It matches the sibling
   `acceptance/fight-api-battles.spec.ts:31-34`, which warms the route the same way. Every request the tests
   assert on uses the 10 s timeout, which keeps to the intent of the criterion.
3. **Malformed body sent as a `Buffer`:** accepted and necessary. I confirmed with curl that the real raw body
   gets the plain-text `Invalid JSON` response, while a string `data:` is JSON-encoded by Playwright. The
   implementer's out-of-scope finding about `fight-api-validation.spec.ts` "malformed JSON runs no battle" is
   plausible and deserves a follow-up ticket.
4. **`outcomes as FightOutcomes` cast in `simulate.ts:126`:** accepted. With the default `OUTCOME_KINDS` the cast is
   exact. Only the unit test passes a custom kind list. See non-blocking note 1.
5. **Stricter request schema (`additionalProperties: false`):** the ticket requires it, and the description says so.
6. **Removed `simulate.ts` exports** (`OutcomeTally`, `SurvivorTally`, `RoundStats`, `SimulationSummary`): accepted.
   tsc passes, so nothing else imported them, and the ticket asks for a single declaration.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there was no bot run and there are no bot findings.

## Conventions

- `acceptance/fight-api-contract.spec.ts` follows the conventions of `acceptance/fight-api-battles.spec.ts` and
  `fight-api-validation.spec.ts`:
  - no semicolons;
  - a `keys`/`sorted` helper;
  - `postFight` from helpers;
  - `test.describe` groups;
  - `beforeAll` warm-up.
- `lib/combat-simulator/fight-api.ts` follows `simulate.ts`/`battle.ts` style: semicolons, 2-space indent,
  `interface` declarations.
- The JSDoc paths resolve:
  - `components/apps/combat-simulator/results.js` uses `../../../lib/...`;
  - `pages/apps/combat-simulator.js` uses `../../lib/...`.

## Non-blocking notes

1. `lib/combat-simulator/simulate.ts:104,126` and `simulate.test.ts:61`: `OutcomeAccumulator` accepts any kind
   list, but `summary()` now claims the closed `FightOutcomes` type. For a custom list (test-only), that type is
   wrong, and the test reaches `outcomes['extra']` only because `strict: false` permits it. That is fine today. If
   `strict` is ever turned on, this test line will need a cast.
2. `pages/api/fight.ts:109`: `req.body as FightRequest` is passed to `validateFightForm(body: unknown)`, so the
   cast does nothing for the compiler and claims a shape before validation has run. The ticket and manager note
   asked for it at the read site, so it is not a finding, but a reader might take it for a validated type.
3. `acceptance/fight-api-contract.spec.ts:83`: the warm-up calls `request.post` directly while the sibling uses
   `postFight`. This is only because `postFight` takes a timeout, which the warm-up does too. A very minor departure.
4. `acceptance/fight-api-contract.spec.ts:132`: `combinationKeys` reads the example's first survivor element. If a
   future regenerated example had no survivors on either side, `keys(undefined)` would throw rather than fail
   cleanly. The current example has 3 + 3 elements.
5. The pre-existing `[WebServer] TypeError: resolver is not a function` from `GET /api/models/army` (implementer
   out-of-scope finding 2) is unrelated to this diff.

## Coverage

- Files reviewed, each in full:
  - `docs/api/openapi.json`
  - `lib/combat-simulator/fight-api.ts`
  - `acceptance/fight-api-contract.spec.ts`
  - the `simulate.ts` diff and the whole file
  - the `fight.ts` diff and the whole handler
  - `simulate.test.ts` (one line)
  - `results.js` and `combat-simulator.js` (JSDoc lines)
  - `package.json` and the `package-lock.json` diff
- Read for context:
  - `lib/combat-simulator/battle.ts`, `army.ts`;
  - `acceptance/helpers.ts`, `fight-api-battles.spec.ts`, `fight-api-validation.spec.ts`;
  - `docs/combat-simulator.md` (input bounds, outcome reporting), `ARCHITECTURE.md` (API spec row);
  - the SGS-005 ticket, section 1.
- REPO.md review checklist:
  - "Every diff": ran `next build` and loaded the page with `npm run dev`. The page's user flow is covered by
    the passing `combat-simulator*.spec.ts` acceptance specs; the page's only change is a JSDoc line.
  - "Combat simulator": I traced the round trip. Field names are unchanged, and `/api/fight` was exercised with
    curl for the boundary and error cases. The dice and casualty item does not apply because those were not
    changed.
- No design doc exists under `$PROJECT_DIR/design/`, and REVIEW.md does not exist. Both LESSONS.md files are
  empty. The style sources are `ARCHITECTURE.md` and `tsconfig.json`.
- I did not personally re-run two of the ticket's listed mutations: the spec-only key rename and `attack-ldrs`
  max 6. The implementer reports both fail as expected.
