# SGS-061 tech-lead 1

## Decision
No blockers. Opened as a draft PR.

- PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/76 (draft, base `main`, head `sgs-061-aoe4-api-rejects-text` @ 879a329ea769cba2e732415e70d2910f35226483)
- Title: "Reject text in the AoE4 simulate API and require buildOrder (API 2.0.0)"
- Single PR, so no stack footer (`stacking: footer`).
- Before this run the branch existed only locally. I pushed it with `git push -u`. No new commits were made.

## Merge risk
**high** - this breaks the contract for any existing API consumer that sends `text`: those requests went from 200 to 400 with no deprecation signal. A code revert fully restores the 1.0.0 behavior because there is no data, migration or external side effect, but clients that already migrated are unaffected either way.

## Review focus
- [`pages/api/aoe4-build-order/simulate.ts:20-28`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/76/files#diff-578b560075c1794ae8b41fe38dc3a3da3b4f497a963ac48dba931babeb5aed34R20-R28) - Any external client still posting `{ text }` now gets a 400 instead of a result. Also, if the own-key check were loosened to a value check, `text: null` beside a valid `buildOrder` would quietly simulate. Check that the `Object.hasOwn` test runs before the `buildOrder` checks, and that a body with only `inputs` gets `request: missing buildOrder` and not a crash on `checkBuildOrder(undefined)`.
- [`docs/api/openapi.json:1005-1025`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/76/files#diff-fabc7f5cc7402ca31f120efff6f669fd4e6ec85cb6fb3cba7e4ddc6a225eb860R1005-R1025) - Generated clients and validators read this schema. If `required: [buildOrder]` or `not: {required: [text]}` disagreed with the route, a client could pass schema validation and still be rejected, or the reverse. Check that the schema and the route reject the same bodies. The contract spec's `removedText` and `missingBuildOrder` examples are compared byte-for-byte with real responses.

## What I reviewed
- Range: origin/main f11e0c5..879a329. Three commits, all authored by choinickolas@gmail.com: ace6fbe, 203b0df, 879a329.
- Files: 9 files, +127/-165.
  - Route and type code: pages/api/aoe4-build-order/simulate.ts +9/-16 and lib/aoe4-build-order/api.ts +1/-2.
  - docs/api/openapi.json +22/-57.
  - docs/aoe4-build-order.md +26/-21.
  - Five acceptance specs, +69/-69.
- I read the full combined diff, using `-W` for the route.
- Checked against INVARIANTS (S1, S3, A1-A3), the CONTEXT open questions (none), the ticket's Scope and criteria, and the implementer report.
- Consumers: `git grep` finds `SimulateRequest` and the route used only by pages/apps/aoe4-build-order.tsx, which posts `{ buildOrder, inputs }` (line 75). Nothing in the repo still sends `text`.

## Findings against the flag list
- Invariants: no violation.
  - S3 still holds. `text` is rejected before any parse. The 1 MB limit and the 200-step cap are unchanged. The 20,000-character cap remains in `textToBuildOrder`.
  - A3: the 200 path is unchanged.
  - S1: the route imports only aoe4 lib modules.
- Contract break: intended. The owner decided it (design Q2=C), and the ticket records it. I rated it high and did not escalate it.
- No question was answered unilaterally. Leaving out a Deprecation header is the design's choice.
- Irreversibility: none. A code revert restores 1.0.0 behavior, and there is no data or migration.
- Concurrency and security: nothing new. `englishCatalog` memoisation is unchanged.

## Non-blocking notes
- The `request shape` rows in acceptance/aoe4-simulate-api-edges.spec.ts used to check only `issues[0].code`. They now also assert length 1, and the new `text null alone` test pins the message, so the implementer's earlier coverage gap is closed.
- `SIM_INPUT_BOUNDS.textChars` remains in schema.ts. Only `textToBuildOrder` uses it now. That is fine.
- `tsconfig` target is es2017. `Object.hasOwn` type-checks through the lib setting, and Node 24 and Vercel's runtime support it.
- I did not rerun the test suites. I relied on the parity results the manager passed on: tsc, lint:dup, 1232 unit and 622 acceptance tests.
