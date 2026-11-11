# SGS-112 acceptance-test 1

Verdict: PASS. Tip tested 0802abc; commit d25bd78 on sgs-112-server-debt adds one test file.

## Tests written
File: `acceptance/aoe4-builds-api-refusals.spec.ts` (Playwright, live next dev, file store under test-results/builds-local).
- Refused save writes nothing: 30 saves, then 3 refused saves (429, BuildsError), and the counter file on disk still says count 30. Pins "stored count never passes the limit".
- Save route issue cap, four rows: 1 issue, exactly 100, 101, 110 unknown-unit steps give 400 SimulateError with 1/100/100/100 issues, `omittedIssues` absent/absent/1/10, and `error` equal to the first issue's message. Pins `issuesError` through POST /builds.

All 5 pass. Existing `aoe4-builds-api.spec.ts` and `aoe4-builds-api-contract.spec.ts` also pass against the tip (41 tests total in the three files, 3.0 s). The harness ran: acceptanceSetup (link-node-modules, playwright install chromium) completed.
`npx tsc --noEmit && npm run lint:dup` pass (0 clones).

## Mutation checks (all undone, `git diff --exit-code` clean)
- `lib/aoe4-build-order/build-store.ts` file store `bumpCounter`: wrote `{count: limit + 1}` on the refused path. The counter test failed at `expect(storedCount()).toBe(30)`, expected 30, received 31.
- `lib/aoe4-build-order/api-route.ts:39` `omittedIssues > 0` changed to `>= 0`. The "one issue" and "exactly the cap" rows failed at `expectValid('SimulateError', json)` (omittedIssues 0 is schema-invalid), before the `omittedIssues` toBe(undefined) line. It still names the behavior, but the first failing line is the schema check.

## Failures
None.

## Not expressible in this harness
- Id failure 500: no live reproduction (the OpenAPI example is validated by the contract spec, which already passes).
- Fail-closed `VERCEL` without `VERCEL_ENV` (503, DELETE 405): `webServer.env` is fixed blank in the config, and a spec cannot change the server's environment. Covered by unit tests only.
- The `.env.local` override of `BUILDS_STORE_ID`/`VERCEL_ENV`: needs a different server environment; the existing builds API spec passing against the file store is the only live evidence.
- Typed replies, `nextCounter` single implementation, `recordingTarget`, and doc statements: not observable through the API boundary.
