# SGS-091 review 1

Branch sgs-091-aoe4-engine-cleanups (not on origin; reviewed the local tip SHA 11a4c0db0525e8fce8937ef64e0e1d300b3c21fb in a detached worktree), base b9481e3. One commit.

**Verdict: REQUEST CHANGES** (one blocking convention finding, the repo's AoE4 checklist rule on copied constants and helpers).

## Blocking findings

1. `lib/aoe4-build-order/schema.ts:123-129` - convention / checklist(AoE4: copied helper or constant) - the new `ID_QUOTE_CHARS = 40` and `shortId()` copy `MAX_QUOTED_LENGTH = 40` and the truncation in `quote()` at `lib/aoe4-build-order/parse-text.ts:25,29-34` (same limit, same `slice(0, N)` + `...` shape; the only difference is the quote character). REPO.md's AoE4 review checklist says "A helper, constant or tolerance copied from another `lib/aoe4-build-order/` module is blocking: import or extract it instead (past copies drifted)". It matters here because the new doc sentence (docs/aoe4-build-order.md:524) promises one cut, "in every issue message that quotes it", and paste and schema messages both fall under it. If the two constants drift, the doc goes out of step with one of them and nothing flags it. Direction: keep one limit. For example, export `MAX_QUOTED_LENGTH` (or one exported `shortId`) from `model.ts`, which both modules already import (no cycle). Then have `schema.ts` and `parse-text.ts` use it, so `quote()` becomes `` `'${shortId(token)}'` `` or uses the shared constant. That leaves `quote()`'s output byte-for-byte the same, as the ticket requires ("stays as is"). The existing parse-text quote tests and the new schema table pin both.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| 41-`a` id gives `unknown unit "<40 a>..." in unit`; table covers every echo site | pass | `schema.test.ts` "quoted ids in issue messages": 14 sites x lengths 39/40/41/5000, `endsWith` the expected message. All 14 Scope 1 sites (knownId x3, nodeRefIssue unknown/not-a-node/only-gold/outside, knownResource, triggerKindCheck with kinds tail, stepProblem, civ, trips key, houseBuilderSource, influenceCoverage) are present. `grep '"${' schema.ts` shows every user echo goes through `shortId`; the one exception is `technology "${id}" is not supported`, which echoes a catalog id (max catalog id length 26) and which the ticket says to leave. |
| 40-char quoted whole; short ids unchanged; `never runs out` / `deposit 1` short rows | pass | 39/40 rows in the same table; "keeps the message for the short value" rows for `wood`, `gold#1` with `toEqual`. |
| 900,000-char id message < 200 chars, no suggestion | pass | `acceptance/aoe4-simulate-api-checks.spec.ts:134`; full acceptance green. |
| cache: same object per catalog, different per catalog; same issues | pass | `schema.test.ts` "buildOrderSchema cache". Mutation (cache lookup disabled) fails "returns one schema per catalog object" (run by me). A global cache would fail the `not.toBe` line. |
| greps: `'villager'` in gather.ts, `RESOURCE_ORDER` | pass | both empty |
| no `'(order|inputs|issues)' in` in simulate.ts; API unchanged | pass | grep empty; API acceptance specs unedited except the added length assertion, all pass. Narrowing by `ok` is equivalent: `OrderResult` and `checkSimInputs` are both `{ok:true,...}|{ok:false,issues}`, and `rejected()` sets `ok:false`. |
| `sortWarnings` in depletion.ts only at its definition | pass | `depletion.ts:192` only |
| simulate-depletion "lists node warnings by time, not by node order" | pass | asserts `['stone','berry']` and non-decreasing `at`. Mutation (bare array instead of `sortWarnings([...])` in simulate.ts:1036) fails exactly this test (run by me). |
| depletion.test.ts "returns its warnings sorted by at" deleted, others unchanged | pass | the diff deletes only that block |
| formatBuildStep rounding rows 65.4/65.5/59.6 | pass | `parse-text.test.ts:517-519` |
| doc states the 40-char cut; no doc says the whole id is repeated | pass | docs/aoe4-build-order.md:524; grep of the doc and openapi.json finds no such text |
| narrow-layout long-id test asserts truncated quote; no-scroll check kept | pass | `aoe4-narrow-layout.spec.ts:74-75` |
| npm test, tsc, lint:dup, acceptance pass; edited tests listed | pass | Run by me: vitest 45 files, 1413 passed / 10 skipped; tsc clean; jscpd 0 clones; `npm run acceptance` 739 passed; `npx next build` passes. The implementer report lists every test edit. |
| No invariant regressions | pass | see below |

No boxes ticked (verdict is not APPROVE).

## Invariants touched

- A3 (deterministic timings): holds. `depletionResults` builds warnings in `FINITE_NODE_REFS` order (deterministic). `simulateBuildOrder` still sorts the merged list with `sortWarnings`, which has a total tie rank. The final order is a pure function of the build and data.
- S3 (bounded requests): holds for the quoted ids: every echo site quotes at most 43 characters. Issue paths with long object keys (for example `inputs.trips.<key>`) are still unbounded, which the ticket puts out of scope. They stay within the existing 900,000-character body check.
- A1, A2: not touched (no simulation numbers or spends changed).
- S1: `result-series.ts` imports `RESOURCE_KINDS` from its own app's `lib/aoe4-build-order/model.ts`, so this is not a cross-app import.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there was no bot to run.

## Doc claims checked

- docs/aoe4-build-order.md:524 "A quoted id longer than 40 characters is cut to its first 40 characters followed by `...` in every issue message that quotes it.": true today. Schema echo sites go through `shortId`, paste uses `quote()` with the same 40 cut, and the only unwrapped quote in schema.ts is the catalog-id `technology ... is not supported` message (catalog ids are at most 26 characters). Blocking finding 1 is what keeps this true going forward.
- schema.ts:137 comment "A catalog is treated as immutable, so its schema is built once.": matches the WeakMap code.
- schema.ts:125 "Bounds an issue message that quotes a user-supplied id.": matches.

## Non-blocking notes

- `schema.test.ts:361` test title `'%s: a %i character value is quoted as %#'`: `%#` prints the row index, so titles read "unit: a 41 character value is quoted as 2". Drop ` as %#`, or print the expected text with `%s` on a shorter field.
- `schema.test.ts:356-360`: each row's messages are computed while vitest collects the `describe` body, not inside the `it`. A throw in the schema would surface as a collection error, not a named failing row. Passing `run` and `value` into the row and calling `run(value)` inside the `it` would localise failures. This is minor, and nearby tables in the file compute inside the `it`.
- `orderSchema` split into `orderSchema` + `withCrossChecks`. `withCrossChecks` has one call site, but its body is the moved superRefine (not a doc-heavy helper), so it is acceptable. It does move code the ticket did not call for. A `let built = ...` inline would have kept the diff smaller.

## Coverage

Reviewed: every file in `git diff b9481e3...HEAD` (12 files). Sibling comparison: parse-text.ts `quote()` (finding 1), the existing `schema.test.ts` tables, `depletion.ts` `sortWarnings`/`tieRank`, and the simulate.ts:1036 merge.

Ran: tsc, lint:dup, npm test, full `npm run acceptance`, `npx next build`, and two mutation checks (simulate sort and cache), each reverted.

REPO.md "Every diff" step to load the touched page: covered by the full acceptance run against `next dev`; I did not inspect the page by hand. This diff has no UI or layout change: `result-series.ts` gives the same order. Screenshots were not needed.

No leftover processes. The servers on 3174/3784 belong to the sgs-083 and sgs-084 worktrees.
