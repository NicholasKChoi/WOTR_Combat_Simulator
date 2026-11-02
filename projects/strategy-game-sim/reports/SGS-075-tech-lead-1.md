# SGS-075 tech-lead 1

**Decision:** no blockers. Draft PR opened.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/71, base `main`, head `sgs-075-aoe4-delete-validate-route-check` at `7037d4819545d5544629a298cfd94c8f26d0b8ed`. Draft, single PR, no stack footer. Title: "Swap the build order route to the zod schema checks and delete the hand-rolled validator". Body set with `gh api -X PATCH` and ends with the required attribution.

## Merge risk
**high** - the 400 `issues` list that existing API consumers read changes in order and in which issues appear, on a public route whose whole input validator is replaced. A revert fully undoes it.

## Review focus
- [`lib/aoe4-build-order/schema.ts:376-425`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/71/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR376-R425) - the route now simulates the schema's output, not the request body. A step field missing from its variant here is silently dropped, so the request still gets a 200 but with wrong timings (for example a lost `rally` or `walkSeconds` on `produce`). Check each variant's keys against the engine's step handlers. `BuildStep` is now inferred from this list, so the type checker cannot catch a missing field.
- [`pages/api/aoe4-build-order/simulate.ts:50-56`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/71/files#diff-578b560075c1794ae8b41fe38dc3a3da3b4f497a963ac48dba931babeb5aed34R50-R56) - one catalog object is now shared by every request in the process. If anything mutates it (`defaultStart`, `inputDefaults`), state leaks from one request into the next, and the same order can return different timings. Check that `checkSimInputs` hands the engine copies (it copies trips and spreads `nodeAmounts`).
- [`lib/aoe4-build-order/schema.ts:569-573`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/71/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR569-R573) - `rankOf` sets the issue order, and the route copies the first issue into `error`, the headline a client shows. A wrong rank puts a cross-step or start issue first. Check that order-level keys rank before steps and cross-step issues rank last.

## What I reviewed
- Commit range `3ff99c6..7037d48` (origin/main..branch): two commits, both authored by `choinickolas@gmail.com`, with no ticket ids or PR numbers in their messages. The branch was local only, and I pushed it (it was a new remote branch).
- 21 files, +776/-1422 in total. Reviewable business logic is +64/-372: `pages/api/aoe4-build-order/simulate.ts`, `lib/aoe4-build-order/schema.ts`, `model.ts`, `validate.ts` (deleted) and `acceptance/helpers.ts`. I also read `text-to-build.ts`, `checkBuildOrder`/`checkSimInputs`/`buildOrderCatalog` in `schema.ts`, the test re-points and the review, implementer and acceptance reports.
- Stack check: a single branch on `main`. The diff holds only this task.

## Blocker checks
- **Invariants.** S3 holds: the 20000-character cap moved into `textToBuildOrder` ahead of parsing, `SIM_INPUT_BOUNDS` is enforced in `checkSimInputs`, and the steps array is capped at 200. A1 holds: no game numbers were added. A3 holds: checking is pure, and the memoised catalog is only read (trips are copied, `nodeAmounts` and `influenceCoverage` are spread, and `defaultStart` and `startVillagerProducers` are only read in `startProblems`).
- **Security / DoS.** Suggestions are new CPU work on a public route. I probed the worst case myself with a vitest probe against the branch (scratch files, since deleted): 200 steps whose unknown ids are 10 to 45 characters long, sized to match catalog ids (32 units, 70 techs, 30 buildings), checked in 2 to 28 ms. Combined with the review's 0.02 s result for a 900k-character id, the cost is bounded. No secrets, auth or logging changes.
- **Irreversibility.** None. No schema, data or migration change. A revert restores `validate.ts` and the old route.
- **Contract.** The response shape, status codes and OpenAPI are unchanged, and `suggestion` was already declared there. Accept/reject decisions match the old validator on 9009 differential cases (from the review). The 400 issue order and issue sets change by the designed rules. The only consumer in the repo is the app's own page. This is reflected in the merge risk, not treated as a blocker, because the design decided it.
- **Concurrency.** The module-level catalog `??=` runs on Node's single thread. It is deterministic and read-only, so there is no new risk.
- **Open questions.** CONTEXT.md has none open. Every behavior change traces to design M4 rules.

## Merge risk rationale
High, because the 400 `issues` content (order, and which issues appear) changes for existing consumers of a public route, and the whole trust-boundary validator is replaced. Response shape and accept/reject decisions do not change, and a revert undoes everything.

## Non-blocking notes
- `checkBuildOrder` rebuilds `orderSchema(catalog)` on every call, so each request pays for zod schema construction. That is cheap at this scale, and the catalog-specific schema could be memoised alongside the catalog if latency ever matters.
- The route now simulates the zod output rather than the request body, so unknown keys are dropped from accepted orders (39 of 1020 accepted fuzz orders differed only this way, per the review). The engine never read those keys.
- Process note: a scratchpad `node_modules` directory left by another session meant my `ln -s` created a nested link. I removed only my link and touched nothing else there or in the task worktree.
