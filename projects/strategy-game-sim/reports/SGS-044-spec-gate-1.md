# SGS-044 spec gate 1

Verdict: NEEDS_SPEC (one small gap; everything else checks out)

## Gaps

1. Scope / Out of scope - `components/apps/aoe4-build-order/result-series.test.ts` builds a typed `SimulationResult` literal (`function result(): SimulationResult`, lines 9-23) with no `markers`. Making `SimulationResult.markers` required breaks `npx tsc --noEmit`, which the ticket requires to pass. Scope excludes `components/**`, so an implementer must either break the stated exclusion or guess. Proposed fix: add to Scope "add `markers: []` to the `result()` literal in `components/apps/aoe4-build-order/result-series.test.ts` (the only typed `SimulationResult` literal outside `lib/`)", and carve that one line out of the `components/**` exclusion. (SGS-037 also names that file; if an earlier M3 ticket already adds the other required fields there, say so, but each required field still needs its own line.)

## Checks passed

- Grounded scope: `model.ts` `SimulationResult` ends at `ages`, `notes` (line 80 region); `simulate.ts` has `ages.push` at 333 inside `completeConstruction` and `ages: engine.ages` in the return object; `research.ts` `researchItem.complete` has `state.researched.add`; `markers.ts` is new; the openapi example with `ages` is at line 440; `docs/aoe4-build-order.md` `ages` bullet is at line 515; `grep markers` in docs is empty today.
- Design match: kinds, order, `AGE_NAMES`, `ChartMarker`, `compareMarkers`, `researchMarker`, `ageMarker`, the `EngineState.markers` seam, and the behavior rows all match design/M3.md. `researchEntry(baseId, state)` matches SGS-041.
- Snapshot samples: I classified all twelve named techs against `data/aoe4-build-order/aoe4world/english.json`. Each has one entry and gets the stated kind, and no snapshot tech matches two of rows 1-3.
- `at <= durationSeconds`: the sample loop breaks at the horizon after `runInstant`, so only events at or before it fire.
- Open questions: none. Decisions: no conflict.
- Invariants: A1, A3, S3 are named and not contradicted.
- Risk: high is right (`lib/**` critical path). Size is about 70 LOC. Diagram is present. LESSONS files are empty.
- On merge: none is right.
- Docs: Scope item 6 covers the user doc. OpenAPI is covered. No other doc mentions the result fields.

## Notes

- The "other `SimulationResult` fields deep-equal to output with the two push lines removed" criterion cannot be run literally. The second alternative (existing tests stay green unchanged) is the real check; consider dropping the first.
- The `researchMarker(` grep criterion should say it counts call sites, not the import line. It works as written because the import has no paren.
