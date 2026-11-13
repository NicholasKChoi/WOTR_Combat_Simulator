# SGS-149: Harden three tests that cannot fail for the reason they name

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 50 (test-only edits in three files; plus a small optional shared-backing-store parameter on `createMemoryBuildStore`)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (reports/backlog-triage-1.md); SGS-118 and SGS-120 review, SGS-141 acceptance-test-1

## Context

Three tests pass for reasons other than the one they claim, so a regression in the behavior they name would be reported by a different assertion, or by none. All three checked at `origin/main`: each item still applies and no merged ticket has fixed any of them.

## Scope

This is a Chore: no production behavior changes, and every pre-existing assertion keeps its meaning.

1. `acceptance/aoe4-auto-run-contract.spec.ts`, test "the status line reads computing on the first run...": `expect(answered).toEqual([])` runs right after the `running` status and text assertions, so a response that arrives slightly later is missed. After `running` and its text are observed, wait a fixed real-time interval with `page.waitForTimeout` (the specs already use it, for example in the no-JavaScript test in the same file), then assert the status is still `running` and `answered` is empty, before `release()`. The wait length is a named constant in the spec, not a literal at the call: it must exceed the delay used by the mutation check below, and the implementer records its value and the reason in the report. `holdNextSimulate` in `acceptance/helpers.ts` (via `holdRequests`) holds the route on a gate until release; read it so the wait is meaningful.
2. `lib/aoe4-build-order/build-store.test.ts`: the tests "shares neither builds nor counters between envs" (in `describe.each(factories)('%s build store')`) and "shares no named build between envs" (in the named-builds block) cannot fail on an env bug for the `memory` factory, because each `createMemoryBuildStore(env)` call owns its own `Map`s; env separation is never exercised. The `file` factory shares one directory, so it does. Route (required): give `createMemoryBuildStore` an optional way to take a shared backing store (an optional second parameter or a test seam; the builds `Map` and counters `Map` are what is shared), so two memory stores with different envs run over one backing store in the test. Single-argument calls (`createMemoryBuildStore()` and `createMemoryBuildStore(env)`) keep working unchanged and still get their own backing store. The memory case of both tests uses the shared backing store. Do not rely on asserting the key functions directly: `saved-builds.test.ts` and `named-builds.test.ts` already pin key strings, and that route would not catch the store dropping env at its own call sites (`buildMethods`, `bumpCounter` in `build-store.ts`).
3. `acceptance/aoe4-split-tab-order.spec.ts`: under mutation, a column swap trips the setup assertion 'every chart section is rendered' in `lastChart`, and a caret placed before its handle trips 'every chart section has a handle stop' in `expectChartControlsOrder`, so the column-order assertions (`expectInOrder` with `inBuildColumn`, `inResultsColumn`) and the handle-before-caret assertions are never the failing one. Rules, covering every way a stop or section can be missing:
   - `lastChart` takes the last chart's id from the DOM order of the chart sections present, with no count assertion. The walk therefore runs even when a section is missing.
   - The walk ends at the first of: the last chart's handle and caret have both been seen (it continues past that chart's collapse stop as needed, so a caret moved before its handle still yields both); focus has left the last chart's section after having been inside it; `MAX_PRESSES` is reached. It always returns the collected stops and never throws on any of these, so a missing or reordered stop is reported by an assertion on the stops, never by the walk. This is the only permitted change to `walk`; `readFocus` is untouched.
   - "Every chart section is rendered" is its own named hard assertion in a helper that reads the DOM, and runs in both tests after their order assertions (in the first test after `expectInOrder`; in the second after `expectInOrder` and the order assertions in `expectChartControlsOrder`), so a layout mutation is never reported by it first. Within `expectChartControlsOrder` the assertions run in this order: key-results caret is a stop; compare-collapse before every present handle; handle-before-caret per chart; chart-rendered; every chart has a handle stop; every chart has a caret stop. The rendered assertion sits before both presence assertions so a removed section is reported as a missing section, not as a missing stop.
   - Handle-before-caret is checked per chart only when both indexes are >= 0, never passed vacuously by an index of -1, and runs without 'every chart section has a handle stop' having passed. A chart missing either stop is left to the presence assertions that follow.
   - All assertions are hard (`expect`, not `expect.soft`), so the first thrown message identifies the failure.

**Out of scope:** any production code change beyond the optional memory-store parameter; other specs; the focus-walk logic (`walk`, `readFocus`) except the end condition item 3 needs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) In the auto-run status spec, a simulate response that reaches the page after `running` and its text were observed, and before `release()`, fails the "no response before release" check (the `answered` assertion, or the still-`running` assertion after the wait), and no earlier assertion. Mutation check: in `holdRequests`, release the gate after a delay shorter than the spec's wait constant (instead of waiting for `release()`), run the spec, and confirm that is the failure message.
- [ ] (respec 1) The wait length is a named constant that exceeds the mutation delay; a held request that is never answered before `release()` still passes the test on unmutated code.
- [ ] (respec 1) For the memory store over a shared backing store, mutations that drop the env prefix fail the matching test, each applied both inside the key function and at the store's call site: `savedBuildKey` (and its use in `buildMethods`) fails the builds env-isolation test; `namedBuildKey` (and its uses) fails the named env-isolation test; `rateCounterKey` (and its use in `bumpCounter`) fails the counter part. Each of the six mutations is applied in a throwaway worktree and recorded in the implementer's report.
- [ ] (respec 1) Existing single-argument `createMemoryBuildStore` calls (for example in the builds-route tests and the blob cases of `build-store.test.ts`) pass unchanged, and two single-argument stores still share nothing.
- [ ] (respec 1) Swapping the Build and Results columns makes the first thrown assertion an `expectInOrder` column-order assertion, not the chart-rendered or handle-stop assertion.
- [ ] (respec 3) Moving a chart's caret before its handle makes the first thrown assertion the handle-before-caret one, not a presence assertion or a walk error. This holds for the last chart as well as an earlier one; a test fails if handle-before-caret passes while either index is -1.
- [ ] (respec 3) Removing a chart section fails the second test through the chart-rendered assertion and the first test through it as well. Removing a chart's handle stop, and separately its caret stop, fails through the handle-stop and caret-stop presence assertions respectively. Each holds for the last chart as well as an earlier one, and none of them is reported as a walk error: the walk returns its stops without throwing when the last chart's stop never appears.
- [ ] (respec 3) The walk returns without throwing in each end case: both last-chart stops seen, focus leaving the last chart's section, and `MAX_PRESSES` reached; a mutation that removes the last chart's handle or caret must not produce a thrown walk error.
- [ ] Pre-existing tests keep their assertions; every test that fails under a mutation above passes on unmutated code.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: the auto-run mutation could not make the `answered` assertion fail first, the tab-order ticket did not keep the rendered-chart check or say which message is first, and the memory-store route allowed a key-function check that misses call-site env drops.
- Changed: auto-run now waits a named constant after `running`, asserts still `running`, mutates with a delayed release; tab-order uses hard assertions with first-thrown-message criteria and separate presence/rendered assertions; memory store requires the shared-backing-store route with six mutations.
- Stands: no branch work existed for this ticket.

## Re-spec 2 - 2026-11-12

- Underspecified: the walk stopped at the last chart's collapse stop, so a caret moved before the last chart's handle left the handle index -1 and handle-before-caret passed vacuously.
- Changed: item 3 now requires the walk to continue until the last chart's handle and caret are both seen and handle-before-caret to require both indexes >= 0; the matching criterion covers the last chart.
- Stands: no branch work existed for this ticket.

## Re-spec 3 - 2026-11-12

- Underspecified: the walk's behavior when the last chart's stop never appears, the order of the rendered and presence assertions inside `expectChartControlsOrder`, and which tests carry the rendered assertion.
- Changed: item 3 now states the walk's three end conditions and that it never throws, the exact assertion order, and that both tests carry the rendered assertion; criteria 6 and 7 cover the last chart and every missing-stop case.
- Stands: no branch work existed for this ticket.
