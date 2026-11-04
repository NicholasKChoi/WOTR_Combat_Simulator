# SGS-091 tech-lead 1

## Decision
PASS - no blockers, no untested hotspots. Draft PR opened.

- PR #95: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/95 (base `main`, head `sgs-091-aoe4-engine-cleanups` @ aa22ab1f312b4d2cc30dc420475237e8ea4ab370, draft). Branch pushed (was local only). No new commits. Body set with `gh api -X PATCH` and verified. No stack footer (single PR).

## Merge risk and review focus (verbatim from the PR body)
## Merge risk
**medium** - changes public API error text (`/api/aoe4-build-order/simulate` issue messages for ids over 40 characters); backward-compatible and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/depletion.ts:174`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/95/files#diff-7f2b518ce84b856994bd41aaa1b3e73d39c78954abb77bf91e2f495c15c0ad9dR174-R174) - `depletionResults` now returns node warnings in node order, not time order; any future caller that skips `sortWarnings` (or a refactor of the merge in `simulateBuildOrder`) would show a later run-out before an earlier one - check that `simulateBuildOrder` is still the only consumer and still sorts the merged list - pinned by [`lib/aoe4-build-order/simulate-depletion.test.ts`: lists node warnings by time, not by node order](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/95/files#diff-e789479394f3e2185d569c43d4c14826d056beee55083f8144f4babefdc11ebbR105-R112)
- [`lib/aoe4-build-order/schema.ts:529-539`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/95/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR529-R539) - the schema cache keys on catalog identity; a catalog mutated after its first check would validate against stale id lists - confirm no code mutates a `BuildOrderCatalog` (the API and the page each build one and never change it) - pinned by [`lib/aoe4-build-order/schema.test.ts`: returns one schema per catalog object](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/95/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR375-R380)

## What I reviewed
- Range: origin/main 6103ed7 ... aa22ab1 (3 commits: 4f3fbcd, aed53bd, aa22ab1). Merge base equals origin/main.
- 16 files, +179/-42 total; reviewable code +44/-27 (schema.ts, model.ts, parse-text.ts, depletion.ts, gather.ts, result-series.ts, pages/api/aoe4-build-order/simulate.ts), plus 1 doc line, unit tests, and acceptance specs.
- Checked: INVARIANTS A1-A3, S3; criticalPaths (no criticalPaths symbol in simulate.ts or engine-common.ts is changed; depletion.ts is not a critical path; `simulateBuildOrder` still applies `sortWarnings` to the merged list at simulate.ts:1036); `sortWarnings` is a total order on (at, tie rank), so dropping the inner sort leaves output identical; `depletionResults` has one caller; no code mutates a `BuildOrderCatalog` (grep), the API caches one and the page builds one in getStaticProps; the `ok` narrowing keeps status codes and bodies; truncation sites match ticket Scope 1.
- Hotspot pinning: both Review focus entries have assertion-level tests, and implementer-1 mutation checks confirmed they fail on breakage (cache disabled -> same-object test fails; sort removed in simulateBuildOrder -> ordering test fails).
- Gate reports read: review-2 (APPROVE), suite-1 (PASS).

## Blockers
None.

## Non-blocking notes
- `shortText` slices by UTF-16 code unit, so a cut can split a surrogate pair and leave a lone surrogate in the message (the old paste `quote()` behaved the same). Cosmetic.
- review-2's cosmetic notes stand (placement of `shortText` in model.ts, comment repeating 40).
- SGS-089 also touches lib/aoe4-build-order/simulate.ts; this PR does not touch that file, so no conflict expected there.
