# SGS-169 acceptance-test 1

Verdict: PASS. Tip 372f015b2be340b989b9da76d7bd7a3a0fe5b799. No commit made (no test files written or changed by me).

## Run
- acceptanceSetup ran (node_modules linked, playwright install chromium).
- `npm run acceptance` on 8 specs: 126 passed, 0 failed (43.1s):
  aoe4-simulate-api-research, aoe4-simulate-api-contract (pins openapi Severity enum to SEVERITIES), aoe4-simulate-api-issue-shape, aoe4-simulate-api-edges, aoe4-build-order-inline-issues (counts info from warnings+notes filtered to severity info; gold run-out info list passes), aoe4-build-order-knight-longbow-page, aoe4-build-order-m3-flow, aoe4-build-order-m4-flow (info list).

## Tests written
None. The diff's one acceptance edit (`acceptance/aoe4-simulate-api-research.spec.ts:32`, note severity `debug` through POST to the simulate route, bloomery/admiralty/textiles) covers the POST criterion; it passes.

## Mutation check
- `lib/aoe4-build-order/research.ts:112` changed `'debug'` to `'info'`: the research spec test "every note is debug severity..." failed at research.spec.ts:37 (`Expected "debug", Received "info"`). Undone with `git checkout`; `git diff --exit-code lib` clean; no servers left running.

## Not expressed in acceptance harness
- Criteria "debug-only run shows no info toggle / warnings list" and "no control reveals debug messages": no acceptance test drives a page result that contains debug notes (they are pinned by `messages.test.ts` unit tests per the diff). The existing page specs pass (research-free builds), so they do not exercise this path. Not added: the ticket's own acceptance scope for these is unit-level (`resultMessages`); a page-level spec with a research build could be added if wanted.

## Failures
None.
