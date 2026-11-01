# SGS-030 spec-gate 1

Ticket: tickets/SGS-030-aoe4-engine-core.md. Base origin/main 68e004a. Design: design/M2.md.

## Verdict: READY

Confirmed risk: high (matches the ticket). Triggers hit: changes what a simulation computes, the order of
operations a result depends on (A3), enforces A2, fixes the seam signatures SGS-031/032 build on, and an estimate
at the ~400-line mark (over 150). `criticalPaths` is empty. Adjacent invariants named: A1, A2, A3; no criterion
contradicts one.

No blocking gaps. No owner gaps. Open questions: none in the ticket, none in CONTEXT.md (Open questions: None).

## Checks

1. Grounded scope: PASS. `simulate.ts`, `civ-rules.ts`, `gather.ts` are new and the ticket says so; `data.ts`
   exports `GameData`, `SnapshotEntry`, `CivData`, `loadGameData`, `buildGameData(civ, snapshot, base, civData)`
   (checked on main). `EffectState` (data, age, buildings, researched, coverage), `ModifierTarget`, `modifiedValue`
   and `effectiveGatherRate(node, state, inputs)` match SGS-027's text; `EngineState extends EffectState` is
   type-compatible (`buildings` Map, `age` mutable). SGS-028/029 names match (`parseBuildOrderText` result shape,
   `validateBuildOrder(input, data, options?)`, `resolveSimInputs(partial, data)`). Docs line refs
   (Queues l.131-133, step-life l.380-403, CivRules seams table) match docs/aoe4-build-order.md.
2. Testable criteria: PASS with one vague item (see Notes N2). Hand-computed numbers verified against data: villager
   50 food / 20 s / popcap 1, supply 10, 7 starting population, so payments at 0, 20, 40 and the 4th blocked;
   base `walkSeconds` 5 gives the "6r at t=20, 7r at t=25" gather rates; starting food 200 less 50 gives 150;
   man-at-arms 90 food / 20 gold; scout 65 food / 23 s gives 20..43; `spearman-2` is the lowest-age entry (age 2).
3. Open questions: none.
4. Invariants: A1 (no game-number literals, checked by criterion), A2 (wait reported, floating never negative),
   A3 (determinism, grep criterion) named and tested. S3 does not cover these paths; loop is bounded (each pass
   of "offer until not started" starts a step; wake-ups are finite).
5. Contracts: PASS. `StepTiming`, `SimulationResult`, `UnitSeries`, `SimInputs` match design Contracts and main
   `model.ts`. `BuildStart`/`rally` step come from SGS-026 (transitive via SGS-029). SGS-031/032 tickets already
   adopt the Seam block verbatim.
6. Dependencies and size: dependencies stated. ~400 lines is at the limit, with a pre-stated split (N3).
7. Diagrams: present (loop flowchart, instance queue state diagram); triggers fire.
8. Lessons: LESSONS.md (repo and project) are empty.
9. Decisions: body agrees with design Owner decisions 1-3 (rally steps, produce-rally standing rally,
   `start.rally` required) and the Production table. Nothing answered is left open.
10. On merge: none is right (no new command, harness or doc the factory uses).
11. Risk: high is right.
12. Docs: the three doc edits are in scope; I grepped `docs/aoe4-build-order.md` for queues, rally, `optimal villagers`,
    CivRules, `sampleSeconds`: line 20, 58, 131-133 and the CivRules table are extended, not contradicted.
    `data/aoe4-build-order/README.md` has no contradicting statement.

## Notes (non-blocking; cheap to fix before dispatch)

- N1. `floating >= 0` versus the tolerance constant (author). The A2 criterion asserts every `floating` value
  `>= 0` strictly, while the ticket allows a floating-point tolerance on "resources suffice". An implementer who
  accepts a payment within tolerance can leave `-1e-13` in `resources`. Propose adding to the Payment rule:
  "after subtracting, a value within the tolerance below 0 is set to 0", or make the criterion `>= -tolerance`.
  Also state that the affordability wake-up time must make the check pass (otherwise a wake-up at t with a deficit
  below tolerance can re-arm at the same t forever).
- N2. Hooks criterion is weak (author). "A test CivRules for each value hook changes the output" would pass if the
  hook were wired wrongly. Propose one hand-computed check per hook, e.g. `productionModifier` returns 2x seconds
  so the default start's first villager spawns at 40; `supplyProvider` returns +5 so the 4th villager is paid;
  `villagerProducer` false on `capital-town-center` yields no default order; `gatherRateModifier` x2 doubles
  `gatherRates.food`; `startingState` returns food 0 so `floating.food[0]` is 0; `dropOffRule` true for `sheep`
  makes the rate use `walkSecondsCamp` (needs a `GameData` where camp and town-center walks differ, as in
  SGS-027), which is the most intricate hook (the `inputs` view swap) and has no specific check now.
- N3. Size. The estimate sits at the ~400 limit and the ticket says "if over 400, split `civ-rules.ts` plus hook
  call sites". An implementer mid-flight cannot cleanly make that call. Consider telling them: "if the loop is
  clearly over ~450, stop and report" instead, or splitting now.
- N4. Sampling wording. "Every sample at time <= t not yet taken is read after the instant at t (samples between
  instants are read after crediting income up to the sample time)" contradicts itself, and "every sample time" is
  also a wake-up, so no sample falls between instants. Propose: "every sample time is a wake-up; the sample is
  read after the instant at its own time."
- N5. Same-instant tie: two instances that spawn at the same instant are both routed before a spawn-armed `at N vils
  rally` starts (spawns all run in step 2, the step starts in step 3). "Routes villager N+1 on" is therefore true
  only when spawns are one per instant. Add one clause so an implementer does not try to interleave.
- N6. SGS-031 pushes onto an `ages` list and calls hooks from simulate.ts; `EngineState` has no `ages` field. The
  ticket allows private fields, so SGS-031 can add it, but "SGS-031/032 only add handlers" in the Seam heading
  understates their loop edits (step 5, age advance). Reword to avoid a rebase surprise.
- N7. The A2 and Switch criteria use `start: { rally: 'sheep' }` implicitly; state it in the A2 test setup since
  validation requires it for a starting villager producer.
