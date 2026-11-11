# SGS-121 spec-readiness gate, round 2

**Verdict: READY**

Read: the re-specced ticket, spec-gate-1 report, `design/M8.md` C1 to C3 (tables, route functions, OpenAPI, counter), CONTEXT.md, both LESSONS.md, REPO.md, and `origin/main` (`builds-routes.ts`, `save-rate-limit.ts`, `docs/api/openapi.json`, `acceptance/helpers.ts`, `acceptance/openapi-schemas.ts`, the contract and spec-surface specs, `ARCHITECTURE.md`, `docs/aoe4-build-order.md`). No local branch exists yet for SGS-112, SGS-119 or SGS-120, so their end states were not read from code. Gate 1 checked them against their tickets.

## Round 1 gaps: closed

1. **Log search criterion.** It now names the two fixed messages plus at most the zod error, and states that `idFailure` and `storageUnavailable` log from `builds-routes.ts`. It no longer forbids what Scope adds.
2. **Closed lists in the contract criteria.** The path count, operationId list and schema list are gone. The criteria now state properties: the two named paths are present, operationIds are unique and non-empty, the four operations carry the statuses in Scope, and each new schema is closed, fully described, and has its C1 property set. The `2.5.0` pin is a design constant. The existing path lists are replaced by a route-file property or a presence check.

The re-spec also covered the round 1 notes. GET and DELETE take no slot, the live budget test has its own client, and `saveBuild`'s prose is unchanged.

## Checks

- **Grounded scope.** The code the ticket names exists on main: `saveBuildReply`, `savedBuildReply`, the `builds/` adapters, `takeSaveSlot`, `clientKey`, `SAVE_RATE_LIMIT` (30 per 3600 s), `BUILDS_PATH` and `postBuild` in `acceptance/helpers.ts`, `openapi-schemas.ts` with `validator`, `expectValid` and `expectInvalid`, and `ARCHITECTURE.md`'s AoE4 route logic row. The four specs the ticket names as pinning `2.4.0` or a path list are `aoe4-builds-api-contract`, `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape` and `fight-api-spec-surface`. I found no other pin: the only `2.4.0` hits under `acceptance/` are in the first three, and the only `Object.keys(spec.paths)` or path-literal comparisons are in `aoe4-builds-api-contract` and `fight-api-spec-surface`. `StoreGetter` is not exported on main, and the ticket tells the implementer to export it in place. `recordingTarget` lives in `api-route.test.ts` on main and moves to `route-test-support.ts` under SGS-112 (C3). That is a dependency, not a gap.
- **Testable criteria.** Each criterion has an observable outcome. The row numbers refer to design tables, which are constants. The criteria hold in the end state: the path-set rule matches the six route files, and `saveBuild`'s unchanged 429 text stays true under the shared budget. Scope states the rule for existing acceptance specs, so it lists no tests. The only numbers pinned are design constants (30 writes, 128 kb, `2.5.0`).
- **Open questions and decisions.** The ticket says `none`, and CONTEXT.md has none. The shared budget and the production DELETE rule match the design's Owner decisions.
- **Invariants.** S3 is named, and A3 is stated as untouched. No criterion contradicts them.
- **Contracts.** Names, statuses, texts, headers and the order of rows match C1 (create 15 rows, update 22, GET/DELETE 7), C2 (`deps.env`, `deploymentEnv`, shared counter) and C3 (shared reply helpers). The only deviation is that the ticket folds update table rows 6 to 12 into one `checkSaveBuildRequest` step. That is an implementation detail and does not change behavior.
- **Dependencies and size.** The Depends-on list is complete: SGS-112, SGS-119 and SGS-120. Business logic is about 220 lines, under 400.
- **Diagrams.** One is present, and it agrees with the update order.
- **Lessons.** The repo and project lessons are Playwright rect reads and Vitest CSS-module proxies. Neither applies, because no layout or CSS assertion is added.
- **On merge.** It is one item naming the CONTEXT.md Key surfaces. The ticket adds no command, harness or design doc, and writes no Decisions rule into a repo doc.
- **Risk.** `high` is right: shared mutable state, the order of operations, and a new public auth surface.
- **Docs.** `ARCHITECTURE.md` and the `docs/aoe4-build-order.md` "Builds routes" section are in Scope, with a grep rule. I found no `2.4.0` or "four routes" statement in the docs that needs a fix. The immutable-cache statements at `docs/aoe4-build-order.md` line 716 and lines 1083 to 1089 are about snapshot builds and stay true.
- **Input validation.** Body validation is the existing `checkSaveBuildRequest`. The header parsers are SGS-119's. No hand-rolled validator is added.

## Notes (non-blocking)

1. SGS-112 and SGS-120 are `needs_spec` and SGS-119 is `spec_ready` in TASK-GRAPH. None has a branch, so the implementer cannot start until all three are built. This is ordering, not a ticket defect.
2. Existing `aoe4-builds-api-contract.spec.ts` asserts `NEW_SCHEMAS` are closed or reference-checked from a fixed list of the five M6 schemas. Adding schemas does not break it, but the implementer should not extend that list. The new contract spec owns the new schemas.
3. The contract criterion "every reproducible 4xx example equals the real response" depends on the 405 example showing `Allow: GET, PUT, DELETE`, which holds because the acceptance server is not production. The example should say so in its description.
