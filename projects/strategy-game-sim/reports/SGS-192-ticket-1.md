# SGS-192 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-192-record-what-a-waiting-step-waits-for.md (lint clean)

Summary: "Record what a waiting step waits for (`waitingFor`, `waitDetails`)". Feature, aoe4-build-order, M11, risk high, about 300 business lines (new `wait-detail.ts` about 150, handler details with `offerStep`/`accrueWait` about 100, `model.ts` types), depends on SGS-190, On merge none. Covers design C1, C2, C5, C6, C7 `detail`, C7a, C7b parts and B-W1..B-W9, B-W11, B-W12. Criteria cover each handler's detail (produce age-before-building split, population, resources with ceil, busy; build; move; research), the landmark choice, the `waitingFor` lifecycle, accrual by `waitTargetKey` (repeat, order, landmark upgrade), the per-reason sum loop over every prebuilt build at 1200 s, no timing change, determinism, browser-safe imports, OpenAPI and docs.

Diagram: one flowchart (read/act/record) for `offerStep` and `accrueWait`.

Open questions: none.

Findings beyond the outline:
- Existing tests need the new fields although the outline says "pass unchanged": `simulate.test.ts` "completes a rally step the instant it arms" and "pauses at once..." (`toEqual` on a whole step), the hand-built `StepTiming` in "charges only the steps whose reason is a breakdown reason", and tests building a `StepStart` without `detail` (`research.test.ts` `toEqual` outcomes, `simulate.acceptance.test.ts` and `simulate-construction.test.ts` `withHandler` overrides). Scoped as a rule, with these as examples.
- `acceptance/helpers.ts` `Timing` and the contract spec's `Record<keyof StepTiming, true>` are in Scope as the outline says. `step-annotations.ts` and its fixtures are left to E.
- Docs: `docs/aoe4-build-order-format.md` (steps field list, "each reason is reported" paragraph, prerequisite row order) and `docs/aoe4-build-order.md` named in Scope.

Overlap: none with open tickets beyond the declared dependency on SGS-190 (it adds `detail` to the `produce` check 5 and research check 4 returns that SGS-190 writes). Code was read at origin/main (87f0cd7); SGS-190 and SGS-189 have no branch yet, so SGS-190's end state is taken from its ticket. No scratch checkout was made.
