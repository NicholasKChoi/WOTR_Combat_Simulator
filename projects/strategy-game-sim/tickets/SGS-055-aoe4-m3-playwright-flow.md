# SGS-055: Add the M3 end-to-end Playwright flow for the AoE4 page

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.9 (Playwright: edit a step in the table, run, see a depletion warning and the timeline, pin and compare)
- **Priority**: medium
- **Risk**: standard
  <!-- Test-only, no engine or public surface change, so no strongModelTrigger and no criticalPath file (acceptance/** is not lib/**). Plan said medium; one component, over ~100 lines of test code across three tests and a helper move, and it can only pass once five tickets are merged, so standard. -->
- **Invariants**: none adjacent (reads results; adds no game number)
- **LOC estimate**: ~120 lines of test code (new `acceptance/aoe4-build-order-m3-flow.spec.ts` ~100; moving two helpers into `acceptance/helpers.ts` ~20). No business logic.
- **Depends on**: SGS-039 (default amounts: sheep 3000 and gold 4000 are finite at default inputs; the ENG 1TC gold reaction), SGS-040 (paste grammar, so the ENG 1TC text parses and the table shows its reaction), SGS-045 (`simulation-warnings`, `simulation-notes*`, `simulation-message`), SGS-046 (step table; `step-table`, `step-row`, `step-field-*`, `step-add`), SGS-047 (`step-timeline`, `step-timeline-row`), SGS-048 (`pin-run`, `unpin-run`, `compare-key-numbers`, `compare-row`). Transitively SGS-037/038/042 (warnings, depletion, `waitingOn`) and SGS-043/052.
- **On merge**: none
- **Source**: design/M3.md "Page props and test ids" and Behavior rules rows `step table`, `timeline`, `pin`; plan M3-20261101 outline U (M3.9)

## Context

Each M3 UI ticket tests its own piece. M3.9 also asks for one flow through the real page and engine: edit a step in
the table, run, see a depletion warning and the step timeline, then pin and compare. This ticket adds that flow once
SGS-039, 045, 046, 047 and 048 are on `main`. L and M (SGS-046, 047) were not written when this ticket was; the test
ids below are the design's table, so the implementer re-reads the merged tickets and uses their final names if any differ.

## Scope

Needs Node 24 (REPO.md `acceptanceHarness`): run `source ~/.nvm/nvm.sh && nvm use 24` before `npm run acceptance`.

1. **`acceptance/helpers.ts`**: move `openPage(page)` and `runSimulation(page)` from `acceptance/aoe4-build-order.spec.ts` (lines ~22-35) here as exports, plus `export const AOE4_PAGE = '/apps/aoe4-build-order'`, and import them in that spec. Behavior unchanged. This avoids a second copy of both helpers (`acceptance/` is outside the `lint:dup` paths, but a copy would still drift).
2. **`acceptance/aoe4-build-order-m3-flow.spec.ts`** (new). Only design test ids; no CSS selectors except the chart path selector `path[data-series="..."]` the existing spec already uses. Three tests:
   - **Flow test** (the M3.9 flow). Paste `FLOW_PASTE`:
     ```
     start 6 sheep -> sheep
     produce villager from capital-town-center x3 -> sheep
     @25:00 produce villager from capital-town-center x1 -> sheep
     ```
     The depletion comes from the default sheep amount (3000 food from SGS-039) with no ENG 1TC build, so no gold reaction is involved: 6 starting plus 3 produced villagers stay on sheep with no step moving them, and sheep runs out well inside the default 1200 s (6 villagers alone gather about 3.6 food/s, so 3000 is gone near 830 s; more villagers shorten it). The `@25:00` step is past the horizon so the timeline has a flagged row. Steps:
     1. After the fill, `step-table` is visible with `step-row` count 2, and `step-field-count` of row 0 has value `3` (text edit reaches the table). Run, then pin the result (`pin-run`).
     2. Edit row 0: set its `step-field-count` to `5` (fill, then blur or press Tab as SGS-046 requires to commit). `build-order-text` then contains `produce villager from capital-town-center x5 -> sheep` (table edit reaches the text), and `step-row` count is still 2.
     3. Run again. From the response JSON: it has a `node-depleted` warning for `sheep` with `severity: 'warning'` and `idleVillagers > 0`. On the page `simulation-warnings` is visible and contains a `simulation-message` with `data-code="node-depleted"` and `data-severity="warning"` whose text equals that warning's `message`.
     4. `step-timeline` is visible with 3 `step-timeline-row`; row `data-step="0"` has `data-status="completed"`, no `data-flagged="true"`, and contains `x5`; row `data-step="2"` has `data-status="not-reached"` and `data-flagged="true"`.
     5. Compare: `compare-key-numbers` is visible with 7 `compare-row` whose `data-key` values are `military-600, military-900, military-1200, age-2, age-3, age-4, pop-cap` in order; each chart (`chart-gather-rates`, `chart-floating-resources`) has `path[data-series="food"]` and `path[data-series="pinned:food"]`. Then `unpin-run`: the table is gone and `pinned:food` has count 0.
   - **Reaction test** (ENG 1TC end to end). Choose the default prebuilt build (ENG 1TC, `english-1tc`), set `duration-seconds` to `3600` (the maximum), run. Gold deposit 1 runs out there only because SGS-039 measured it near 3305 s; the test reads `depletions` from the response and asserts `gold` has non-null `depletedAt` first, so it fails loudly instead of passing vacuously if that changes. Then: the last `step-timeline-row` has `data-reaction="true"`, `data-status` `completed` and the table's last `step-row` has `step-field-reaction` checked (the paste round-trip from SGS-040 reaches the table); `simulation-warnings` does not contain a message matching `/^gold ran out/` (the reaction moved the gold villagers, so that warning is `info` and sits in the collapsed `simulation-notes`).
   - **Table unavailable test.** Fill `build-order-text` with `start -> sheep\nat 8 vils fly capital-town-center`: `step-table-unavailable` is visible and `step-table` count is 0; fill a valid paste: the table returns. (Covers design rule "text does not parse".)
3. **Why the depletion in the flow test is real.** SGS-039 owns the ENG 1TC gold reaction, so a build that has one would show no `warning`. The flow paste has no reaction and no `move` step, and `nodeAmounts` is not reachable from the page, so the default sheep amount alone must trigger the warning. If SGS-039's sheep amount changes, the test asserts the response before the DOM (step 3), so the failure names the cause.

**Out of scope:** any change to the engine, the page or the other specs' expectations; per-feature coverage already owned by SGS-045 to 049 (legend toggles, deltas, step-table edit ops, markers); `nodeAmounts` or other inputs on the page; the two new prebuilt builds (SGS-050, 051); docs (SGS-054 audits `docs/aoe4-build-order.md`; the doc describes the page, not the tests).

## Diagrams

Single-component change outside the core control loop; no diagram required. (Test-only: the flow is fill text, table edit, run, warning and timeline, pin, edit, run, compare.)

## Acceptance criteria

- [ ] `acceptance/aoe4-build-order-m3-flow.spec.ts` exists with the three tests above, uses only the design's test ids (plus `path[data-series]`), and `npm run acceptance` passes under Node 24 with it. `git ls-files acceptance | grep -c m3-flow` prints 0 today and 1 after.
- [ ] Flow test: after filling `FLOW_PASTE`, `step-row` count is 2 and row 0 `step-field-count` is `3`; after setting it to `5`, `build-order-text` contains `x5` and `step-row` count is still 2 (table and text sync both ways).
- [ ] Flow test: the second run's response has a `node-depleted` warning for `sheep` with `severity: 'warning'`, and the page shows a `simulation-message` with `data-code="node-depleted"`, `data-severity="warning"` and that warning's exact `message` inside `simulation-warnings`.
- [ ] Flow test: `step-timeline-row` count is 3 (one per step); row 0 is `completed` and not flagged and shows `x5`; row 2 (`@25:00`) is `not-reached` with `data-flagged="true"`.
- [ ] Flow test: with the run-1 pin, `compare-key-numbers` has the 7 `compare-row` keys in the design order, each chart has `food` and `pinned:food` paths, and `unpin-run` removes the table and the `pinned:food` paths.
- [ ] Reaction test: at 3600 s the response shows `gold` with non-null `depletedAt`; the last timeline row has `data-reaction="true"`; the last table row's `step-field-reaction` is checked; `simulation-warnings` has no `gold ran out` message.
- [ ] Table-unavailable test: an unparseable paste shows `step-table-unavailable` and no `step-table`; a valid paste brings `step-table` back.
- [ ] `openPage` and `runSimulation` exist once, in `acceptance/helpers.ts`: `git grep -nE "^(export )?(async )?function (openPage|runSimulation)" -- acceptance` finds 2 lines on `main` (both in `aoe4-build-order.spec.ts`) and 2 after (both in `helpers.ts` as exports, none in the specs); the existing AoE4 spec still passes unedited otherwise.
- [ ] Mutation check, run in a throwaway worktree after the dependencies are merged: with `rules/base.json` sheep `amount` removed (infinite), the flow test fails at the `node-depleted` assertion; with the ENG 1TC `reaction` step removed from `english-1tc.json`, the reaction test fails (the paste has no reaction row, or a `gold ran out` warning shows).
- [ ] All new tests are deterministic (no `waitForTimeout`; waits are on responses and test-id assertions) and stop their dev server through the Playwright `webServer` (no process left running).
- [ ] No INVARIANTS.md regressions

## Open questions

- `designer`: SGS-046 and SGS-047 had no ticket files when this was written. If their final test ids, the commit behavior of `step-field-count` (on change or on blur) or the `data-status` values differ from the design table, the implementer follows the merged tickets; no decision is needed unless they drop a design id.
- `designer`: the reaction test relies on SGS-039's measurement that ENG 1TC gold deposit 1 runs out near 3305 s. If SGS-040 or later tuning moves it past 3600 s, the test's first assertion fails and it must switch to a different way of showing a reaction under way (for example, override nothing and assert only the reaction row's `data-reaction` at 1200 s).
