# SGS-119 acceptance-test 1

Verdict: NO ACCEPTANCE TESTS APPLICABLE (nothing written, nothing committed). Tip 33b9fbbfb22c9f9026b4e42fb5e5c34249122e45.

Why: the diff adds `lib/aoe4-build-order/named-builds.ts`, adds `base64UrlEncode` to `saved-builds.ts`, and adds `named-builds.test.ts`. `git grep named-builds` shows no importer outside the module and its own test. The ticket forbids wiring it into routes, stores, barrels, or components. There is no API, HTTP handler, CLI, or rendered state to drive. The Playwright harness (`acceptance/`) can only reach the module through a boundary that does not exist yet. Pure-function tests are out of scope for this role, and the implementer's Vitest file already covers them.

Tests written: none. Harness run: not run (acceptanceSetup and acceptance skipped, since no test exists and nothing could pass or fail). No mutation checks. Nothing started, so no processes are left running.

Criteria not expressible in this harness (all of them are library-level):
- No `node:` import or `Buffer` use, and importable under `tsc --noEmit`: covered by grep and `commands.lint`.
- All id, secret, hash, header-parser, schema, key, and path criteria: covered by the unit tests in `named-builds.test.ts`.
- `base64UrlEncode` single-home criterion: covered by `git grep`.

Recommendation: the HTTP-visible behavior (header grammar, 401/412/428 handling, response shapes) should be acceptance-tested in the routes ticket that wires this module in.
