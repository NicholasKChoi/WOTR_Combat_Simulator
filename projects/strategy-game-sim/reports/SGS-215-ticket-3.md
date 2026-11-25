# SGS-215 ticket report 3 (Re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-215-production-past-population-cap.md

## Summary

"Let production continue past the population cap" (aoe4-build-order, M13, risk high, about 40 business-logic lines in `lib/aoe4-build-order/simulate.ts` plus the Spear/Longbow build retune; no dependencies). I re-specced it from the spec-gate 2 findings, read against origin/main 7d74800. Changes:

- **Gap 1 (pre-cap prebuilt criterion).** The criterion now covers only the three builds the retune does not touch. Each gets one named digest test: run to a horizon where the build has reached the cap, and assert that `populationCapReachedAt` is not null and equals the base value. Then a truncated run at or before that instant must have `populationCapReachedAt` null and its `digestTimeline` must equal a digest pinned from the base.
  - Spear/Longbow is left out. Its gold rally at 1000 s comes before its cap instant of 1149 s, so the retune can change the result before the cap. The builds bar covers it instead, and Scope now says this.
  - Scope also says the task reports `blocked` if no retune within the documented plan meets the bar. It points at the spec-gate probe lead (`idle-arrival` at about 1216 s, and `gold#2` running out just inside 1800 s).
- **Gap 2 (population wait).** This criterion is now a rule over every step of ENG 1TC at 1800 s and of the lowered-`maxPopCap` fixture:
  - `waitBreakdown.population` is no more than the time from `armedAt` to `populationCapReachedAt`, and 0 for a step armed at or after it.
  - No step is `waitingOn: 'population'` at the horizon.
- **Gap 3 (S3 hotspot).** New criterion: a worst-case bounded-run unit test in the style of the `simulate.test.ts` "performance" tests.
  - The request uses the maximum `startVillagers`, 3600 s, auto-houses on, and continuous `produce` on every producer, villagers included.
  - The test asserts the final `spawnedPopulation` is past `maxPopCap`, so the lifted gate is actually exercised, and that the run finishes within a time bound.
  - The implementer sets the bound from the measured time plus headroom, and records the measured time, the bound and the final population in the report.
- **Notes.** Criterion 1 is reworded to "both gates decide supply room through `hasPopulationRoom`", which drops the "only place" search claim. Criterion 11 is reworded to "`EngineState` declares the field and `noteCapReached` takes `EngineState`, with no cast", as the gate suggested.
- **New tests line.** Scope's New tests line now says that digests "pinned from the base" are computed on origin/main before the change, and the report records how.
- **Re-spec section.** I appended `## Re-spec 1 - 2026-11-24`. Changed criteria are tagged `(respec 1)`.

Lint: `ticket-lint.py --graph ... --spec /home/choin/git/WOTR_Combat_Simulator origin/main <ticket>` exited 0 with no errors and no warnings.

## Searches

The test, doc and rule-statement sites are unchanged from spec-gate 2's verification, which found no site beyond what Scope lists. This re-spec adds no doc claim and no exception to any rule. The new tests only add files or rows to existing test files (`simulate.test.ts`, `simulate-house-gate.test.ts` style).

## Diagrams

I kept the existing read/act/record flowchart of the production gate in the event loop. It is unchanged.

## Caveat

Knight/Longbow and Council Hall reaching the cap by 3600 s comes from the spec-gate probe and from the docs and tests: the Council Hall README sentence about income past the cap, and the Knight/Longbow research test whose 1800 s count grows. I did not run either build myself.

## Open questions

none. No owner gap.

## Overlap

None. SGS-216 owns the page side and the `spawnedPopulation has no graph` format-doc line. There is no overlap with SGS-217.
