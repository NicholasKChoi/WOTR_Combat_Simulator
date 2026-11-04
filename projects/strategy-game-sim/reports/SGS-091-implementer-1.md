# SGS-091 implementer report 1

Branch sgs-091-aoe4-engine-cleanups, worktree .claude/code-factory/worktrees/sgs-091-aoe4-engine-cleanups, base b9481e3. Tip SHA: see summary (git log -1).

## Files touched
- lib/aoe4-build-order/schema.ts: `shortId` helper (40 chars then `...`) used at every echo site in Scope 1; `schemasByCatalog` WeakMap cache; `orderSchema` split into cache lookup plus `withCrossChecks` (body moved unchanged).
- lib/aoe4-build-order/gather.ts: `VILLAGER_ID` from engine-common (no cycle: engine-common only type-imports simulate; tsc clean).
- components/apps/aoe4-build-order/result-series.ts: `RESOURCE_KINDS` replaces local `RESOURCE_ORDER`.
- pages/api/aoe4-build-order/simulate.ts: narrow by `ok`.
- lib/aoe4-build-order/depletion.ts: `depletionResults` returns warnings unsorted.
- lib/aoe4-build-order/schema.test.ts: long-id table (14 sites x lengths 39/40/41/5000), short-value rows for `never runs out` and `deposit 1 is written gold`, cache tests.
- lib/aoe4-build-order/simulate-depletion.test.ts: "lists node warnings by time, not by node order".
- lib/aoe4-build-order/depletion.test.ts: deleted "returns its warnings sorted by at" (the only edit to a pre-existing test; allowed by Scope 5).
- lib/aoe4-build-order/parse-text.test.ts: three `formatBuildStep` rows (65.4, 65.5, 59.6).
- acceptance/aoe4-simulate-api-checks.spec.ts: `message.length < 200` assertion.
- acceptance/aoe4-narrow-layout.spec.ts: asserts truncated quote (`unknown unit "<40 a>..."`); the only spec asserting a full >40 char id. Sideways-scroll check kept.
- docs/aoe4-build-order.md: one sentence added.

## Doc claims
- docs/aoe4-build-order.md node-reference paragraph: "A quoted id longer than 40 characters is cut to its first 40 characters followed by `...` in every issue message that quotes it." True for the echo sites listed in Scope 1 (schema.ts `shortId` call sites); the technology-is-not-supported message (catalog id) and the paste parser's own single-quote `quote()` also cut at 40 or echo catalog ids only. Grepped docs/aoe4-build-order.md and docs/api/openapi.json: no text says a message repeats the whole id.
- schema.ts: "A catalog is treated as immutable, so its schema is built once." (`orderSchema` / `schemasByCatalog`); "Bounds an issue message that quotes a user-supplied id." (`shortId`).

## Tests
- Full `npx vitest run`: 45 files, 1413 passed, 10 skipped (pre-existing skips), 0 failed.
- Playwright: aoe4-narrow-layout, aoe4-simulate-api-checks, aoe4-simulate-api, aoe4-simulate-api-edges: 107 passed. Full `npm run acceptance` not run.
- Invariants encoded: quoted id <= 43 chars at all echo sites (S3), 40-char boundary exact, short messages unchanged, cache per catalog object, node warning order a function of time (A3).

## Mutation checks (each undone)
- `<=` to `<` in shortId: 14 failures. nodeRefIssue quoting full value: 8 failures. stepProblem quoting full action: 2 failures. Cache lookup disabled: 1 failure (same-object test). `sortWarnings` removed in simulateBuildOrder: the new ordering test fails (1). `Math.floor` in formatTrigger: 2 rows fail (65.5, 59.6; 65.4 is also correct for floor, as expected).

## Pinned outputs
None pinned from engine output beyond the rounding rows (65.4 -> @1:05, 65.5 -> @1:06, 59.6 -> @1:00).

## Stages
- codegen: none set. build (`npx next build`): passes. lint (`npx tsc --noEmit`, `npm run lint:dup`): tsc clean, 0 clones. `npm ci` was run in the worktree (node_modules not committed). Node v24.22.2.
- Greps: no `'villager'` in gather.ts, no `RESOURCE_ORDER`, no `'(order|inputs|issues)' in ` in simulate.ts; `sortWarnings` in depletion.ts only at its definition.

## Invariants
A3 upheld (single sort in simulateBuildOrder, new test). S3 upheld (messages bounded). Issue paths with long keys are unchanged (out of scope per ticket).

## Out-of-scope findings
None.

Status: needs_review
