# SGS-149 implementer report 1

Status: needs_review
Branch: sgs-149-test-hardening-masked-assertions, tip 76390a0 (one commit on origin/main 41b3ed3)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-149-test-hardening-masked-assertions

## Files
- acceptance/aoe4-auto-run-contract.spec.ts: `HELD_RESPONSE_WAIT_MS = 1000`; after the running status/text, wait, assert still `running`, then `answered` empty, before `release()`.
- acceptance/aoe4-split-tab-order.spec.ts: `renderedCharts`, `expectChartsRendered`; `walk` never throws with the three end conditions; `expectChartControlsOrder(page, stops)` reordered per the ticket; test 1 calls `expectChartsRendered` after `expectInOrder`.
- lib/aoe4-build-order/build-store.ts: optional second parameter `MemoryBacking` (`{builds, counters}`) on `createMemoryBuildStore`; default is a fresh backing. `MemoryBacking` is a type export only; the helper constructor is not exported because `build-store.acceptance.test.ts` pins the exact runtime export names.
- lib/aoe4-build-order/build-store.test.ts: the memory factory in `factories` now uses a per-test shared backing, so both env-isolation tests run over one storage for memory; new test "gives each store without a shared backing its own storage".

## Wait constant
`HELD_RESPONSE_WAIT_MS = 1000`, mutation delay 300 ms: the wait must exceed the delay so a leaked response has landed and flipped the status before the assertions run.

## Tests
- `npm test`: 81 files passed, 1 skipped; 2505 passed, 15 skipped, 0 failed.
- Acceptance (harness change, run once): auto-run-contract and split-tab-order specs, 6 passed on unmutated code.
- Pre-existing tests edited: none changed assertions. The two env-isolation tests in build-store.test.ts are unchanged; only the memory factory feeding them changed.

## Mutation checks (all reverted; tree clean after each)
Memory store, all fail the memory env test(s), plus file/other tests:
- savedBuildKey fn drops env (saved-builds.ts:60): `memory build store > shares neither builds nor counters between envs`.
- namedBuildKey fn drops env (named-builds.ts:69): `memory named builds > shares no named build between envs`.
- rateCounterKey fn drops env (saved-builds.ts:61): `memory build store > shares neither builds nor counters between envs`.
- savedBuildKey(env,...) call sites in build-store.ts replaced with an empty env: the memory builds test fails.
- namedBuildKey call sites likewise: `memory named builds > shares no named build between envs` fails.
- rateCounterKey call site in bumpCounter likewise: the memory shares-neither test fails (counter part).
(The call-site mutations were run before the final `newMemoryBacking` export removal; the logic is unchanged.)

Auto-run: `holdRequests` releases after 300 ms (`Promise.race([gate, 300ms])`): fails at the still-`running` assertion after the wait (spec line 44, Expected "running", Received "current"); no earlier assertion.

Tab order (applied in components, first test or second as noted):
- columns swapped: first thrown is the `expectInOrder` column assertion ("results-column is reached after the previous stop") in both tests.
- caret before handle, last chart (chart-floating-resources) and first chart (chart-units-produced): "<chart> handle comes before its caret" first thrown, no walk error.
- handle removed, last and first: "every chart section has a handle stop".
- caret removed, last and first: "<chart> has a caret stop".
- section removed, last and first: "every chart section is rendered" in both tests.
Not mutation-checked: the walk's MAX_PRESSES and focus-left end cases individually (focus-left is exercised by the no-handle/no-caret runs; no throw).

## Build, lint
- `npx next build`: succeeded. `npx tsc --noEmit` and lint:dup: clean, 0 clones. Codegen not set.

## Doc claims
- build-store.ts: "Stores given the same backing share its maps, so tests can run two envs over one storage." true by `createMemoryBuildStore` destructuring `{ builds, counters }`.
- spec comment on `walk`: "Ends on the first of: both of the last chart's stops seen, focus leaving that chart after being inside it, or MAX_PRESSES. A missing stop is reported by the assertions on the returned stops, never thrown here." true by the loop in `walk`.
- spec comment on `HELD_RESPONSE_WAIT_MS` as written.

## Invariants
No INVARIANTS regressions; no production behavior change (the only production edit is the optional parameter).

## Unverified assumptions added
none

## Out-of-scope findings
none
