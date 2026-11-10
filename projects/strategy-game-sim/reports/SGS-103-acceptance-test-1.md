# SGS-103 acceptance-test pass 1

Result: PASS. Tip b04a27c78c7a649ac7dfae0aa90519c01d2042a6 (no commit added; nothing missing).

Existing specs checked against every live and contract criterion: aoe4-builds-api.spec.ts (flow 201/200/GET/DELETE, 400 x4, 413 both kinds, 404, 405 x3, 30+1 rate limit with other client) and aoe4-builds-api-contract.spec.ts (version/paths, schemas, closed set, bounds, examples validate and equal live responses, shape checks). No gaps; nothing added. 503/500 rows are not live-reproducible (documented, validated only), covered by Vitest.

Runs: npm ci + acceptance:setup done. Targeted run (builds x2, simulate contract, surface spec) 136 passed. Full `npm run acceptance` 771 passed; the 3 earlier page-UI failures did not recur (flake, unreproduced). tsc and lint:dup clean. git status clean, no .builds-local/.

Mutations (each failed the specs, then reverted with git checkout; tree clean):
- 'created' ? 201 : 200 -> always 200: 2 failed
- Cache-Control value altered: 1 failed
- sizeLimit 128kb -> 1mb: 1 failed
- 429 -> 503: 2 failed
- 404 error text case changed: 1 failed

Failures: none. Criteria not expressible: 503 and 500 live (no failing store in harness).
