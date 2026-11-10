# SGS-103 review, pass 1

Branch `sgs-103-build-routes` @ 6e2cd5d, reviewed diff 380e778..6e2cd5d (stacked on `sgs-101-build-store-and-rate-limit`).

**Verdict: REQUEST CHANGES.** There are two blocking findings, both text only. The code itself is correct and matches the C3/C4/C7 tables.

## Blocking findings

1. `ARCHITECTURE.md:25` - contract (text) - The new row ends with "Route files under `pages/api/` only adapt `req` and `res`: they call these functions and `sendReply`." That is false for `pages/api/aoe4-build-order/simulate.ts`, which still validates and simulates in the file, and for `pages/api/fight.ts`, which has its own `isPlainObject` (fight.ts:25) and 405 (fight.ts:105). It also contradicts the existing "App API route" row ("A thin handler: validate input, call lib/<app>/, return JSON"). Direction: replace that last sentence with:
   "The builds route files under `pages/api/aoe4-build-order/builds/` only adapt `req` and `res`: they call these functions and `sendReply`."

2. `docs/api/openapi.json:4254` and `docs/api/openapi.json:1862` - contract (text) - Both descriptions say the save route checks the order the way the simulate route does. But `checkSaveBuildRequest` also runs `roundTripIssues`, so an order that does not survive format-then-parse is rejected with 400. For example, `walkSeconds: 2.5` is rejected (saved-builds.test.ts:211), while simulate accepts it. A client reading the contract would expect that save to succeed. Direction:
   - `components.schemas.SaveBuildRequest.properties.buildOrder.description` (line 4254): replace it with "The build order to save. It is checked like the simulate route checks buildOrder, its name is at most 100 characters, and it must read back unchanged when turned into text and parsed again (a fractional walkSeconds, for example, is rejected)."
   - In the saveBuild operation description (line 1862): replace the clause "otherwise the order is checked like the simulate route checks buildOrder, durationSeconds must be an integer in range, and name at most 100 characters; the issues are listed as in the simulate route." with "otherwise the order is checked like the simulate route checks buildOrder, durationSeconds must be an integer in range, name at most 100 characters, and the order must read back unchanged when turned into text and parsed again (a fractional walkSeconds, for example, is rejected); the issues are listed as in the simulate route."

## Spec gaps

None.

## Rulings on the implementer's points

1. Extra file `acceptance/openapi-schemas.ts`: acceptable. It is a shared Ajv loader used by the new contract specs, and it avoids a fourth hand-built Ajv. Moving the existing specs onto it can be a later cleanup.
2. ARCHITECTURE.md row: the sentence is untrue as written. See blocking finding 1. The narrowed sentence still meets the criterion, because the design's sentence is about the builds route files.
3. DELETE 405 with no named example: acceptable. The ticket asks for named examples only for GET on save and PUT on the id route. The DELETE 405 response still documents its headers and schema.
4. The three page-UI acceptance failures (client-check x2, pin-compare x1): this branch did not cause them. My full `npx playwright test` run passed 771 of 771 in 1.4 min. The only config change adds `webServer.env`, which no page spec depends on. I did not run the base, because the failures did not reproduce here.
5. Simulate example regenerated through the real handler in a scratch test: acceptable under ticket item 7. The live contract spec confirms the example equals the live response. The diff to `examples.buildOrder` touches exactly the listed keys (gatherRates, unitsProduced, spent, spawnedPopulation, gatherers, gathered, floating).

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| api-route exports and imports (no next/react/node imports, type-only import from ./api) | pass | grep: no matches for next/react/node: imports; six exports |
| One source for isPlainObject / not-an-object / 405 in lib | pass | saved-builds.ts private copies removed and imported from ./api-route; message literal only at api-route.ts:30 |
| simulate route responses unchanged, new cases added | pass | simulate-api.acceptance.test.ts has two new cases; npm test is green; the contract spec matches |
| saveBuildReply table rows (405, 400, 413 by config, 429 with Retry-After, 201/200, 503) | pass | builds-routes.ts:16-45; builds-routes.test.ts tables |
| savedBuildReply table rows (405 with Allow by env, 404 invalid/missing id, 500 corrupt, 200 immutable, 204 delete outside production, 503) | pass | builds-routes.ts:47 onward; tests |
| sendReply behaviour (status, headers, end vs json) | pass | api-route.ts:34; api-route.test.ts |
| Route files are a single sendReply call, no branching | pass | grep for if/switch/ternary in pages/api/aoe4-build-order/builds: none |
| Live API specs | pass | acceptance/aoe4-builds-api.spec.ts green in the full run |
| Contract spec (Ajv 2020, named examples) | pass | acceptance/aoe4-builds-api-contract.spec.ts green |
| Stale simulate example | pass | regenerated; the implementer recorded the fail-then-pass runs; the contract spec is green |
| Playwright webServer env (omit BUILDS_STORE_ID / VERCEL_ENV, BUILDS_LOCAL_DIR under test-results) | pass | playwright.config.ts; builds landed under test-results/builds-local/development; no .builds-local created |
| Pinned version / path / schema tests updated to 2.4.0 | pass | three existing specs updated; green |
| tsc, lint, test, acceptance, build | pass | tsc clean; lint:dup 0 clones; npm test 1698 passed / 10 skipped; playwright 771/771; next build passes |
| Docs (ARCHITECTURE row, docs/aoe4-build-order.md, OpenAPI descriptions) | **fail** | ARCHITECTURE.md:25 and openapi.json:1862/4254 (findings 1 and 2). docs/aoe4-build-order.md "Builds routes" matches the code |
| Invariants | pass | see below |
| No ticket ids in commits | pass | `git log` for the tip has no SGS id |

The ticket was not ticked, because the verdict is REQUEST CHANGES.

## Invariants

- S3 (bounded simulate work): holds. There are no new loops, and the simulate caps are unchanged.
- A3 (no clock in logic): holds. The reply functions take `nowMs`. `Date.now()` appears only at pages/api/aoe4-build-order/builds/index.ts:13.
- S1, S2: not touched.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured, so there were no bot findings to reconcile.

## Non-blocking notes

- `playwright.config.ts` webServerEnv: @next/env loads `.env.local` keys that are absent from the process env. If a developer's `.env.local` ever holds `BUILDS_STORE_ID`, acceptance in that checkout would write to real Blob. Today the main checkout's `.env.local` holds only `VERCEL_OIDC_TOKEN`. Suggest setting `BUILDS_STORE_ID: ''` and `VERCEL_ENV: ''` explicitly. That needs a spec decision, because the ticket says "omits".
- `pages/api/aoe4-build-order/simulate.ts`: the typed `NextApiResponse<...>` no longer type-checks response bodies, because `sendReply` takes `body: unknown`.
- `recordingTarget` is defined twice, once in api-route.test.ts and once in builds-routes.test.ts. It could be a shared test helper.
- builds-routes.test.ts: the GET 500 (corrupt record) and GET/DELETE getter-reject 503 cases do not assert that `console.error` was called.
- builds-routes.test.ts: `expect(JSON.stringify(error.mock.calls)).not.toContain('client')` is weak, because Error objects stringify to `{}`.
- builds-routes.ts: `savedBuildId` sits inside the try, so a crypto failure maps to 503 instead of 500. This is harmless in practice.
- acceptance/aoe4-builds-api.spec.ts: the read-back uses `toMatchObject` for buildOrder. `toEqual` would catch extra fields.

## Coverage

Reviewed every file in 380e778..6e2cd5d: lib/aoe4-build-order/{api-route,builds-routes,english-catalog,saved-builds}.ts and their tests, pages/api/aoe4-build-order/{simulate,builds/index,builds/[id]}.ts, playwright.config.ts, docs/api/openapi.json, ARCHITECTURE.md, docs/aoe4-build-order.md, acceptance/{helpers,openapi-schemas,aoe4-builds-api,aoe4-builds-api-contract}.spec/ts, and the three pinned-version specs. Siblings compared: pages/api/fight.ts, the existing acceptance contract specs.

- REVIEW.md does not exist.
- REPO.md "Every diff": the `npm run dev` page-load step was covered by the acceptance suite against the dev server, because no page changed. The AoE4 sections (copied helper constants, doc contradictions) were applied; the second produced finding 2.
- Not run: the base branch acceptance suite (not needed, because the failures did not reproduce), and Vercel Blob against a real store.
