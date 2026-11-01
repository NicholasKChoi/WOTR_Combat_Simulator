# BATCH-033 tech-lead 1

## Decision: NO BLOCKERS. One draft PR opened.

- SGS-033: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/39 (draft). Base `main`, head `sgs-033-aoe4-simulate-route` @ 16ca3be, pushed by me. No new commits; both commits are authored by choinickolas@gmail.com.
- Stacking: this batch is a single PR, so `gh stack link` was not run and there is no footer.
- `gh pr edit` was not used. The body was set with `gh api -X PATCH .../pulls/39 -F body=@file`.

## Reviewed

- Range: origin/main ce342db..16ca3be (merge-base ce342db), 2 commits.
- Size: 10 files, +2210/-12. Reviewable change, excluding new acceptance specs and the helper: +1369/-12.
- Read in full:
  - pages/api/aoe4-build-order/simulate.ts (66 lines)
  - lib/aoe4-build-order/api.ts
  - the edits to the fight-api-contract, fight-api-spec-surface and helpers specs
  - the docs Route section
  - the openapi.json operation prose and schema list
  - resolveSimInputs (validate.ts:389-422), to check it does not throw on untrusted input
- The openapi.json diff only adds lines, so the fight path and schemas are untouched.
- INVARIANTS checked:
  - S1 holds: the route imports only lib/aoe4-build-order.
  - S3 holds: the text cap runs before parsing, steps and inputs are bounded by the validators, and the engine runs only when both stages pass.
  - A3 holds: the route uses no clock and no randomness.
  - A1 and A2 are not touched.
- CONTEXT.md open questions: none.
- Irreversibility: none. A revert removes the route, and nothing stored or migrated depends on it.

## Ticket items recorded in the PR body
1. Next 16.4.3 returns 413 (`Body exceeded 1mb limit`, plain text) at 1,048,577 bytes; 1,048,576 bytes reaches the handler.
2. Mutation results: the implementer's three mutations (2, 5 and 8 failures, with the named tests, plus 3b) and the acceptance gate's six.
3. The ticket accepts the fight-api-contract.spec.ts edit. That spec now compares the fight types against only the schemas /api/fight references, still in both directions, so "every other fight spec passes unchanged" holds as "all fight specs pass".
- Also listed as a known non-blocking, backlogged follow-up: the issues list is uncapped (a 649 KB request can return a 4.7 MB 400).

## Merge risk
**high** - security-relevant: this is the first unauthenticated public endpoint that does real work on untrusted input. The route's caps are the only bound on CPU time and response size, and the response size is not fully bounded (the issues list is uncapped).

## Review focus
- [`pages/api/aoe4-build-order/simulate.ts:55-65`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/39/files#diff-578b560075c1794ae8b41fe38dc3a3da3b4f497a963ac48dba931babeb5aed34R55-R65) - both stages always run and their issues are concatenated with no cap, so a request full of bad keys returns a 400 several times its own size on a public endpoint. Also, when the order stage fails, `resolveSimInputs` still runs on untrusted `inputs`, so a throw there would be a 500. Check that the amplification is acceptable until the follow-up lands, and that `resolveSimInputs` handles every non-object shape without throwing.
- [`pages/api/aoe4-build-order/simulate.ts:26-33`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/39/files#diff-578b560075c1794ae8b41fe38dc3a3da3b4f497a963ac48dba931babeb5aed34R26-R33) - this `text.length` check is the only guard before the paste parser runs. If it is weakened or reordered, a 1 MB paste is parsed in full. Check that it stays ahead of `parseBuildOrderText` and uses strict `>` against `SIM_INPUT_BOUNDS.textChars.max`.
- [`acceptance/fight-api-contract.spec.ts:51-65`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/39/files#diff-50f86835b1bd755fc2532096e255aa16cfa33108fbaf6e1bced2462673880cb2R51-R65) - the fight type-to-schema check now compares only against schemas reachable by `$ref` from `/api/fight`. If the walker misses a reference, a fight schema with no exported type goes unnoticed. Check that the walk is transitive and still checks both directions.

Why high and not medium: no existing consumer reads the route and a revert fully undoes it, so on those factors alone this PR is medium. I rated it high on the security-relevant factor. The route is the first unauthenticated public endpoint doing real work on untrusted input, and its response size is only bounded indirectly, with about 7x amplification. Under the admin-merge rule (auto-merge at low or medium), this rating keeps the PR for a human merge.

## Non-blocking notes
- The 405 response reuses the `FightError` schema. This is a spec-level link to the fight app, not a code import.
- When combined with the scoped pinned-name test, no test now catches an orphan, unreferenced schema in openapi.json (already raised by review).
- No hand-started processes; nothing is left running.
