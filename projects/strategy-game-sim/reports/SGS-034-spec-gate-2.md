# SGS-034 spec-gate 2

**Verdict: READY.** **Risk: high confirmed** (~270 lines of business logic over the 150-line trigger; first consumer of the route contract `api.ts`). REPO.md has no `criticalPaths`. Size is under ~400. No owner gaps, no author gaps.

## Re-spec 1 gaps, all closed
1. Step 5 vs test (d): step 5 now removes every step that is not `completed`/`in-progress` at 3600 s, whatever the cause, with dependents. It gives three fixed reasons and reports "engine does not complete it" cases as out-of-scope findings. The engine and test (d) are untouched. Rule, test and criterion now agree.
2. `duration-seconds`: marked page-local, not part of the design "Page test ids" list (that list is unchanged and still matches the ticket's other ids).
3. Data README: item 10 adds the `builds/<slug>.json` table row and the opening-sentence fix. On origin/main the table has no `builds/` row and no test globs `data/aoe4-build-order/`, so adding `builds/` breaks nothing.
Notes also closed: emptied input sends `Number('')` = 0 and gets a route 400 naming `inputs.durationSeconds` (matches design bound 60..3600 and SGS-029 issue naming); the select does not follow textarea edits; the JSON cast is fixed to `as unknown as BuildOrder`.

## Checks
- Grounding: `chart-rows.ts`, `line-chart.tsx`, `data.ts`, `pages/index.js`, `acceptance/landing.spec.ts`, `docs/aoe4-build-order.md` (Outputs line 381 has the sentence the ticket replaces) and the data README exist on main 68e004a. New files are marked new. `data/aoe4-build-order/builds/` is absent today, as the criterion states.
- Contracts: `SimulateRequest/Response/Error` match design "Route" and SGS-033 `api.ts` (five exports, `SimulateResponse` an alias of `SimulationResult`). Paste examples (`start 6 sheep -> sheep`, `produce ... x3 -> sheep`, `at 8 vils rally ... -> wood`, `start -> sheep`, `research X at blacksmith`) fit the design grammar and the rally and start rules. Series keys, test ids and legend selectors match design "Charts". Type-only imports from `api.ts` and `model.ts` are erased (`isolatedModules`, no runtime pull of the snapshot); the S1/snapshot grep criterion backs this.
- Open questions: none on the main path; the "guide is not English" blocker is stated.
- Invariants S1, S2, S3, A3 named; no contradiction. A1 is not strained (builds hold user step inputs, not game numbers; the README says so). Diagram present. LESSONS files are empty. Decisions agree. On merge lines present (Routes, Component model row, INVARIANTS Paths).
- Docs: nothing on main says the page does not exist; the ticket greps for stale text and fixes the `docs/` Outputs sentence and the data README.
- Dependencies stated (SGS-028, 031, 032, 033, transitive 026, 029, 030); the ticket asserts no times, counts or tiers, so it does not depend on unsettled engine details.

## Notes (non-blocking)
- The invalid-paste case says "second line", and its first line is left to the implementer. Any valid line works.
- The "no `simulation-notes`" check says "prebuilt-run case or a paste with no `research` step". If the owner's build includes a research step with ignored effects, the prebuilt run will show notes, so use the paste with no `research` step for that assertion.
- The fidelity of the transcription to the aoe4guides build cannot be checked by a test. The PR omission list is the only record.
