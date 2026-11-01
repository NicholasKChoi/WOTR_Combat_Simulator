# SGS-034 spec-gate 1

**Verdict: NEEDS_SPEC** (three small author gaps; no owner gaps). **Risk: high confirmed** (est. ~270 lines of business logic over the 150-line trigger; first consumer of the route contract). No `criticalPaths` in REPO.md. Business-logic size is under ~400.

## Checked and fine
- Grounding: on origin/main 68e004a, `chart-rows.ts`, `line-chart.tsx` (`SeriesChart` props testId/title/yLabel/times/series, as the ticket uses them), `data.ts`, `effects.ts`, `acceptance/landing.spec.ts`, `pages/index.js`, `data/aoe4-build-order/README.md` and `docs/aoe4-build-order.md` exist. The ticket states the new files are new. `capital-town-center`, `blacksmith` and `fitted-leatherwork` are real baseIds in the snapshot. `errorMessage` exists in `pages/apps/combat-simulator.js`.
- Names match design/M2.md Contracts and SGS-028/033: `parseBuildOrderText`, `formatBuildOrderText`, `SimulateRequest/Response/Error`, `SimulationResult`, `UnitSeries`, `ResourceKind`, `BuildOrderNote`, and the test ids `build-order-select`, `build-order-text`, `run-simulation`, `simulation-error`, `simulation-notes`, `chart-*`.
- Behavior the tests lean on is stated upstream. SGS-028: parser messages name the line and the offending token. SGS-029: input issue messages name `inputs.durationSeconds`. SGS-032: `fitted-leatherwork` is a `meleeArmor` tech, so it yields a `tech-effect-ignored` note, and `researchNotes` notes even unreached steps.
- Open questions: none on the main path. The conditional "guide is not English" blocker is stated.
- Invariants S1, S2, S3, A3 named, no contradiction. Grep-based S1 check present. Diagram present. Docs scope covers `docs/aoe4-build-order.md` and the data README; ARCHITECTURE.md and README.md do not mention AoE4, so there is nothing stale. LESSONS.md files are empty. On-merge lines present.

## Gaps (all author)

1. **Scope item 2 step 5 vs item 8(d) / third acceptance criterion** - Step 5 removes a step only if it ends `waiting`/`not-reached` because the engine cannot complete it, and says explicitly not when "the guide's order is unaffordable within the build". Test (d) and the criterion require every step `completed` or `in-progress` at 3600 s with no exception. A step that waits forever because the guide's order is unaffordable or supply-blocked in the model satisfies neither rule. An implementer would guess between weakening the test, keeping the step, and dropping it. Fix: drop the parenthetical. State that any step that does not reach `completed`/`in-progress` at 3600 s is removed with its dependents, whatever the cause, and listed with the reason ("engine does not complete it" or "unaffordable in the model"). Report engine gaps as out-of-scope findings.
2. **Contracts: `duration-seconds` test id** - Item 4 introduces `data-testid="duration-seconds"`. design/M2.md "Page test ids" and CONTEXT.md do not list it (the design leaves only the choice of exposed inputs to tickets). Fix: add a line to the ticket's On merge to append `duration-seconds` to the design "Page test ids" list (manager edit), or say the id is page-local and not part of the contract.
3. **Docs: `data/aoe4-build-order/README.md` file table** - The README opens with a table of files and the line "Every game number ... comes from the files here". Item 10 adds only a "Prebuilt builds" section. A `builds/` row would be missing from the table, and builds hold no game numbers (A1 reader would wonder). Fix: add a `builds/<slug>.json` row to the table (user-authored `BuildOrder`s, not game data, not patch-labeled) in item 10.

## Notes (non-blocking)
- Item 4: say what the `duration-seconds` input sends when emptied or non-numeric (`Number('')` is 0, which is a route 400 shown as `simulation-error`, acceptable; one sentence would remove the guess). Also say whether the select follows manual textarea edits (the simplest choice is that it does not).
- The JSON static import types `civ` as `string`; `builds.ts` needs a cast or `satisfies` to return `BuildOrder[]`. The `builds.test.ts` civ and validation checks cover the unsafe cast.
- The transcription of the owner's guide cannot be checked by the gate. No test confirms fidelity to the guide beyond the PR omission list, which the ticket already requires.
- Prebuilt run asserts a path for every `unitId`. This holds because flat zero series still draw, which is the SGS-015 behavior.
