# SGS-149: Harden three tests that cannot fail for the reason they name

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 50 (test-only edits in three files; at most a small optional parameter on `createMemoryBuildStore` if the implementer picks that route, see Scope)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (reports/backlog-triage-1.md); SGS-118 and SGS-120 review, SGS-141 acceptance-test-1

## Context

Three tests pass for reasons other than the one they claim, so a regression in the behavior they name would be reported by a different assertion, or by none. All three checked at `origin/main`: each item still applies and no merged ticket has fixed any of them.

## Scope

This is a Chore: no production behavior changes, and every pre-existing assertion keeps its meaning.

1. `acceptance/aoe4-auto-run-contract.spec.ts`, test "the status line reads computing on the first run...": `expect(answered).toEqual([])` runs right after the `running` status assertion, so a response that arrives slightly later is missed or an earlier assert shadows it. Wait briefly after `running` is seen (the specs already use `page.waitForTimeout`, for example in the no-JavaScript test in the same file) before reading `answered`, so the "no response before release" check is the first thing to fail when a response escapes the hold. Check `holdNextSimulate` in `acceptance/helpers.ts` for how the hold works so the wait is meaningful.
2. `lib/aoe4-build-order/build-store.test.ts`: the tests "shares neither builds nor counters between envs" (in `describe.each(factories)('%s build store')`) and "shares no named build between envs" (in the named-builds block) cannot fail on an env bug for the `memory` factory, because each `createMemoryBuildStore(env)` call owns its own `Map`s; env separation is never exercised. The `file` factory shares one directory, so it does exercise it. Make the memory case able to fail when the env prefix is dropped from `savedBuildKey`, `namedBuildKey`, or `rateCounterKey` (`saved-builds.ts`, `named-builds.ts`). The implementer picks the route: let two memory stores share one backing store for the test, or assert on the key functions directly for both stores. If the route changes `createMemoryBuildStore`'s signature, keep the existing call sites working unchanged.
3. `acceptance/aoe4-split-tab-order.spec.ts`: under mutation, a column swap trips the setup assertion 'every chart section is rendered' in `lastChart`, and a caret placed before its handle trips 'every chart section has a handle stop' in `expectChartControlsOrder`, so the column-order assertions (`expectInOrder` with `inBuildColumn`, `inResultsColumn`) and the handle-before-caret assertions are never the failing one. Take the last chart's id for the walk from the DOM order of the chart sections without a count assertion that a layout mutation trips first, and make the handle-before-caret check not depend on 'every chart section has a handle stop' passing first (for example by checking each chart that has both stops, with the stop-presence check kept as its own named assertion).

**Out of scope:** any production code change beyond the optional memory-store parameter; other specs; the focus-walk logic (`walk`, `readFocus`) except where item 3 needs it.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] In the auto-run status spec, a simulate response that reaches the page before `release()` makes the "no response before release" assertion the failure, and no earlier assertion. Mutation check: let the held request through immediately (or release in `holdNextSimulate`) and run the spec.
- [ ] For the memory store, a mutation that removes the env from `savedBuildKey` fails the builds env-isolation test; one that removes it from `namedBuildKey` fails the named env-isolation test; one that removes it from `rateCounterKey` fails the counter part. Each mutation is applied in a throwaway worktree and recorded in the report.
- [ ] Swapping the Build and Results columns fails a column-order assertion in the tab-order spec, not the chart-rendered or handle-stop setup assertions.
- [ ] Moving a chart's caret before its handle fails the handle-before-caret assertion, not the handle-stop presence assertion.
- [ ] Pre-existing tests keep their assertions; every test that fails under a mutation above passes on unmutated code.
- [ ] No INVARIANTS.md regressions

## Open questions

none
