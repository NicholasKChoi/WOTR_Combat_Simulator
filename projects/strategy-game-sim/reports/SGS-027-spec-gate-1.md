# SGS-027 spec-gate 1

**Verdict: READY.** Confirmed risk: **high** (changes what a run computes: gather rates, build times, production speed; about 230 lines of business logic, over the 150 trigger; no criticalPaths). No blocking gaps. Base checked: origin/main 68e004a.

## Checks

1. Grounded scope: pass. `lib/aoe4-build-order/{effects,model,data}.ts`, `rules/base.json`, `rules/english.json`, `docs/aoe4-build-order.md` and `data/aoe4-build-order/README.md` exist on 68e004a. `gather.ts` and `construction.ts` are marked new. `SimInputs`, `TripInputs`, `OverlayEffect`, `GatherNodeId`, `GameData.base.builderScaling` and `civData.effects` match the ticket's use. Snapshot facts hold: `villager-1` has classes and no effects; `wheelbarrow-1` has carryCapacity change +5 and moveSpeed multiply 1.15; `double-broadax-2` has woodGatherRate multiply 1.15; `shaft-mining-3` has empty effects with two overlay rows; `extended-lines-2` selects only fishing boats; the mill, lumber-camp, mining-camp and kings-palace baseIds exist; no duplicate technology baseIds.
2. Testable criteria: pass. I recomputed the numbers from `base.json` seeds: sheep 37.052, berry 32.926, deer 41.698, farm 36.712 (calculator 36.718), wood 31.002, gold and stone 37.007. All are within the 0.05 tolerance. Builder scaling gives 100, 75, 50, 30 for n = 1, 2, 4, 8.
3. Open questions: none on the main path. CONTEXT.md has none.
4. Invariants: A1 and A3 named; criteria test both. A2 is not touched.
5. Contracts: consistent with the design, with one gap (see Notes, item 1).
   - `modifiedValue(base, property, target, state)`, `effectiveGatherRate(node, state, inputs)` and `constructionSeconds(baseSeconds, builders, data)` match the design Modules table.
   - The overlay rows match the ticket: farm (4 rows by age, `nearBuilding: mill`), King's Palace (`condition.producer`), shaft-mining.
   - SGS-030 (`EngineState extends EffectState`, `coverage`, `inputsView` swapping the `walkSecondsCamp`/`walkSecondsTownCenter` fields that `gather.ts` reads) and SGS-032 (`modifiedValue(1,'productionSpeed',{baseId,classes,producer},state)`) agree with this ticket's shapes.
6. Dependencies and size: pass. Depends-on is none, SGS-014 is merged, and TASK-GRAPH shows SGS-030 depends on SGS-027. About 230 lines of logic is under 400.
7. Diagrams: pass. No control loop or cross-component flow is added.
8. Lessons: both LESSONS.md files are empty.
9. Decisions: the body agrees with the design (trip model, construction 3/(N+2), `productionSpeed` is a speed, Forestry and Crosscut Saw out of scope).
10. On merge: none is correct; the ticket adds no command, harness or design doc, and writes no CONTEXT.md rule into a repo doc.
11. Risk: high is correct.
12. Docs: pass. `docs/aoe4-build-order.md` "Trip model", "Construction" and "Overlay effects" (l.145-200) already match. The ticket adds the `change`-before-`multiply` order and the missing-coverage-is-0 rule, and greps for stale claims.

## Notes (non-blocking, author)

1. `EffectState` and `ModifierTarget` are not in the design's effects.ts export list, and `state` is untyped in the design signature. The ticket's Open questions line says it is a contract choice, and SGS-030 already adopts it. Optionally add one line to design/M2.md Modules (effects.ts row) or CONTEXT.md so the contract has a single home.
2. The cross-check says "default `SimInputs`", but `resolveSimInputs` (SGS-029) is not a dependency and does not exist yet. `effectiveGatherRate` reads only `inputs.trips`. Proposed wording: "the test builds `SimInputs` with `trips[node]` taken from `data.base.gatherNodes[node].trip.*.value`; other fields are not read."
3. Farm coverage values are floating point: 1 + (1.3 - 1) x 1 may not equal 1.3 exactly. Say the tests use `toBeCloseTo`, or compare against the same expression.
4. Unspecified edge: the `villager` entry missing from `data.byBaseId` (take `[0]`, throw if absent), and a tech that both has snapshot effects and an overlay row with the same `grantedBy` (both apply; none exist today).
5. Scope item 5 has a garbled clause ("check ... and still read true"), and effects.ts has no top-of-file comment to update. Trivial cleanup.
