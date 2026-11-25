# SGS-215 spec gate 2

Base origin/main 7d74800. ticket-lint.py with --spec: exit 0, no errors, no warnings.

## Verdict: NEEDS_SPEC

## Verification done

I applied the engine change to a scratch checkout of origin/main. The scratch is removed.

- `tsc --noEmit` is clean. This covers the field move, the `noteCapReached` signature and no cast.
- The unit run over `lib` and `components` gives exactly 9 failures, the same nine the ticket lists:
  - 3 in `builds.test.ts`
  - 2 in `simulate-construction.test.ts`
  - 2 digests in `simulate-house-gate.test.ts`
  - 1 in `research.acceptance.test.ts`
  - 1 in `simulate.test.ts` (export list)
- Probe of the four prebuilt builds at 1200, 1800 and 3600 s, base against change:
  - `populationCapReachedAt` is unchanged for every build.
  - Population ends at 406 (1TC, 1800 s) and 932 (1TC, 3600 s).
  - Only Spear/Longbow gains `idle-arrival@1216`, and its gold#2 now runs out at 1799.4 s and gold#3 at 2394 s. Both are retune facts.
  - No step is left waiting in any build.
  - ENG 1TC gold run-out is 3305.1666666666843 against 3305.1666666666893. This is inside the `toBeCloseTo(3305.17, 2)` in `aoe4-simulate-api-triggers.spec.ts`.
  - Knight/Longbow run-outs move only in float noise, so no spec that pins one with `toBeCloseTo` is affected. `builds.test.ts:191` is the only `toBe` pin, on the Spear/Longbow gold.
- Acceptance specs read by hand: `house-rule`, `house-gate`, `spear-longbow-build`, `prebuilt-plans`, `unit-lines`, `veterancy-conversion`, `waits`, `triggers`. Besides `spend-population` (already in Scope), none depends on the change.
- Every code, doc and OpenAPI quote in Scope matches the base: the gate lines, `noteCapReached`, the `state as Engine` cast, the OpenAPI descriptions, the doc sentences and the data README sentences.
- Doc search across `docs/`, READMEs, `ARCHITECTURE.md`, `page-help.tsx` and `components`: I found no stale statement beyond what Scope lists. The `docs/aoe4-build-order-format.md:473` line "`spawnedPopulation` has no graph" belongs to SGS-216.
- Open questions: none. Overlap: none with SGS-216 or SGS-217. Docs, On merge, input validation and unverified assumptions are fine.

## Gaps

1. **Acceptance criteria, "every prebuilt build gives the same result before `populationCapReachedAt`" - contradicts Scope and names no test (item 2, item 13).**
   - Scope retunes the Spear/Longbow file by "reaction, rally or timing". The README says the villager rally to gold is at 1000 s, before that build's cap instant of 1149 s. Any retune of that rally or of an earlier timing changes the result before the cap, so the criterion cannot hold for the build it is meant to cover.
   - The criterion also names no test. The existing 1800 s digests include the part after the cap, so they cannot show that the earlier part is unchanged. An implementer would guess the test, or skip it.
   - Fix: state that the criterion covers the three builds the retune does not touch, plus Spear/Longbow's retuned file only for the engine-side effect.
     - One test per such build runs it to a horizon at or before the sample just before `populationCapReachedAt`. It first asserts `populationCapReachedAt` is not null.
     - It compares `digestTimeline` with a digest pinned from the base, as criterion 8 does.
     - For the retuned build, either require the retune to leave the result before the cap unchanged (cheapest: change only reactions that fire after run-out), or drop it from the criterion and say so.

2. **Acceptance criteria, "no step with `waitingOn: 'population'` that begins after `populationCapReachedAt`" - not observable in the result (item 2).** *mechanical (criterion wording)*
   - The result carries per-step `waitBreakdown` seconds and a final `waitingOn`, not wait episodes with begin times.
   - Fix: rewrite on the rule. For every step of a run that crosses the cap, `waitBreakdown.population` does not exceed the time from the step's arm to `populationCapReachedAt` (when the cap is reached with supply at the cap). No step is `waitingOn: 'population'` at the horizon.

3. **Untested hotspot (item 16): S3 bound removed with no test (`high` risk).** *unmeasured*
   - Before the change the population ceiling of 200 bounded the number of spawns and events in a run. After it, only `durationSeconds`, production times and the economy bound them. The design says "S3 holds" by reasoning only.
   - PROJECT.md `strongModelTriggers` includes "changes a bound or cap that enforces S3". The ticket lists S3 under Invariants but has no criterion that fails if a run past the cap stops being bounded.
   - I did not obtain a worst-case timing. My stress attempt had an invalid setup (the barracks never built).
   - Fix: add a criterion with a test. A worst-case request is the maximum `startVillagers`, `durationSeconds` 3600 and many production instances. It completes, and the unit pins a generous time or event-count bound. Alternatively, record a measured worst-case run time in the implementer report and add a test that the loop finishes for it.

## Notes (non-blocking)

- Criterion 1 ("is the only place `population` is compared with `supply`") and criterion 11 ("`Engine` does not declare the field") are partly search or structure claims. Both are backed by the per-gate tests and `tsc`, which are the real checks. A redeclared compatible field on `Engine` would still typecheck, so reword criterion 11 as "`EngineState` declares it and `noteCapReached` takes `EngineState`".
- The Spear/Longbow retune is open-ended and has one ruled-out probe. My probe shows gold#2 depleting at 1799.4 s, just inside the 1800 s horizon, and `idle-arrival@1216` firing. This is likely why the pinned run-out and the 1800 s test both fail. The implementer should look at what sends villagers to the depleted node at 1216 s, since the rally steps alone were ruled out. If no retune is found, the work comes back as `blocked`.
- The `aoe4-simulate-api-triggers.spec.ts` 3305.17 pin survives only through `toBeCloseTo` precision 2 (float change of about 5e-12). Not an action item.
