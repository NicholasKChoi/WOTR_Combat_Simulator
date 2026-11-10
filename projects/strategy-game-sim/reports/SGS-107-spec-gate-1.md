# SGS-107 spec gate 1

Verdict: READY

Checked against origin/main (68dd089). The local checkout is on another branch, so I read files with `git show origin/main:`.

## Checks
1. Grounded scope: READY. `step-timeline-rows.ts` and its test exist on origin/main. The importers match the ticket's list: `step-timeline.tsx`, `results.tsx`, `line-chart.tsx` and the test. No acceptance spec, doc or README names `step-timeline-rows` or `stepSpan`, so the Docs line is a grep with no expected hit. `SimulateResponse` is an alias of `SimulationResult` in `lib/aoe4-build-order/api.ts`. `auto-run.ts` exports `LiveInput` and `ShownInput`.
2. Testable criteria: READY. Every criterion has an observable outcome. The alignment samples and the 59.9 / 60 boundary are design inputs, not stale pins. The suffix-cap duplicate rows name the break they catch. The rule for existing tests is in Scope: change import paths only, and `stepSpan` takes a `StepTiming`.
3. Open questions: none in the ticket or CONTEXT.md.
4. Invariants: none adjacent. Pure client code, and A1-A3 are untouched.
5. Contracts: names and signatures match design/M7.md Contracts. The ticket depends on no other ticket.
6. Size: about 180 LOC, no dependencies.
7. Diagrams: none required, and the ticket says why.
8. Lessons: the only entry is Playwright layout checks. This ticket has no acceptance spec.
9. Decisions: CONTEXT.md Decisions is empty. The body agrees with the design.
10. On merge: `none`, which is valid.
11. Risk: standard. No `criticalPaths` symbol and no `strongModelTriggers` item applies.
12. Docs: no doc mentions these internals, and the ticket tells the implementer to grep.
13. Input validation: no trust boundary.

## Gaps
None.

## Notes (non-blocking)
- `StepRun` construction repeats the `timelineRows` body (breakdown order, `blockedBy`, `longWait`, `flagged`). `npm run lint:dup` could flag it. The implementer should have `timelineRows` call one shared per-timing helper. Scope already allows "a reused blocked-by helper", and `timelineRows` output must stay identical.
- In the `buildAnnotations` identity case, the lookup of `result.steps[i]` is not stated. The design says `result.steps[i].step === i`, so index lookup is correct. A missing step could be given `run: null` defensively.
