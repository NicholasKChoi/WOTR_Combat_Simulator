# SGS-031 spec-gate 1

Ticket: tickets/SGS-031-aoe4-build-move-ages.md. Base origin/main 68e004a. Depends on SGS-030 (draft, read as written).

## Verdict: NEEDS_SPEC

Confirmed risk tier: **high**. It changes what a run computes (construction, supply, ages, income dips) and the loop's order of operations (A3). It enforces A2 on build costs, and its estimate (~315 lines) is over 150. No `criticalPaths` are configured. Adjacent invariants A1, A2, A3 are named, and no criterion contradicts them.

There are no owner gaps. Two author gaps block READY and one is minor.

## Gaps

1. **Acceptance criteria, last line ("SGS-030's tests unchanged and green") - author - blocking.**
   - SGS-030's "Seam" criterion asserts that `build`, `move` and `research` steps each report `waiting` and block later steps.
   - This ticket registers `build` and `move` handlers, so that test must fail or change. An implementer must either break "unchanged" or guess how to edit SGS-030's test.
   - Fix: add a Scope bullet and a criterion. SGS-031 edits SGS-030's Seam test so it no longer asserts that `build` and `move` wait. For example, it drives the no-handler path with a temporarily deleted handler (restored in `finally`) or asserts `waiting` for `research` only. `research` stays asserted until SGS-032, which makes the same edit.
   - Better still, also change SGS-030's criterion now (it is still draft) so it does not depend on `build` or `move` having no handler. Then "unchanged" is true. Then say which of the two the ticket relies on.

2. **Acceptance criteria, "Age-blocked re-check and paid items" - author - blocking.**
   - The hand numbers cannot all hold in one run.
   - The `produce spearman from barracks` step must be `waiting` with `armedAt` 0 until 100, and it blocks every later step (at most one armed unstarted step).
   - Nothing in the list can therefore pay a `man-at-arms` at 90. If a `produce man-at-arms` step precedes the spearman step, the spearman step arms at that step's start, not at 0.
   - The barracks has no default order, so no order pays it either.
   - Fix: write the exact scenario.
     - Example: step 0 is `build abbey-of-kings`, step 1 is `@0:00 produce man-at-arms from barracks` (continuous) so a unit is paid at the chosen time, and step 2 is `produce spearman from barracks`.
     - State the resources that make the payment land at 90, or pick a payment time that falls out of the arithmetic (a payment at 87.9 = 6 x 14.65, say).
     - Then restate `armedAt` and `waitSeconds` for the spearman step to match.
     - Alternatively split it into two scenarios: the spearman wait, and the "paid before age-up keeps tier 1" check.

3. **Scope section 3, auto-house payment - author - minor (A2).** The text says a house starts "with a source and wood (the house entry's cost) in floating". The planner and handler should check and subtract all four of the entry's `food/wood/gold/stone` costs, as the `build` handler does. The AC says changing the `house` cost changes output, so a test `GameData` may add a non-wood cost. Fix: "every resource of the house entry's cost in floating; the wake-up covers the binding resource".

## Checks passed

- **Grounded scope.** `simulate.ts`, `civ-rules.ts`, `houses.ts`, `construction.ts` and `gather.ts` do not exist on 68e004a, and the ticket says so. It says they are written against SGS-030 and SGS-027's final names. `docs/aoe4-build-order.md` exists. The cited lines match 68e004a: l.180 (taken from `wood`), l.181 (back to back), l.182 (overrides auto-houses), the step-life section at l.380-403. `data/aoe4-build-order/README.md` and `docs/api/openapi.json` have no stale hits.
- **Data facts verified in the snapshot and rules.**
  - `house` costs 50 wood, takes 15 s and supplies 10.
  - `town-center` costs 400 wood and 300 stone and takes 165 s.
  - `abbey-of-kings` and `council-hall` are age 1 landmarks (190 s; 400 food and 200 gold).
  - `kings-palace` has only an age 2 entry (220 s, `age2_landmark1`). It supplies 10 and is a villager producer.
  - `spearman` is age 2 or later only; `man-at-arms` is 14.65 s.
  - `maxPopCap` is 200 and `walkSeconds` is 5. Builder scaling is 3 / (n + 2).
  - Supply for `capital-town-center` and `town-center` is 10 each.
- **Hand numbers re-derived and consistent.**
  - Build timing 16.25 and 14.25; return at 21.25.
  - The Ages 100 and town-center `5 + 99` figures.
  - Two-TC auto-house at 100 (lead 20, population 19, projected 21 > 20), done at 120, builder back at 125, 20 villagers at 200.
  - Gate scenario: house at 300, 40 at 400, 23 at 240 and 300 for the `@5:00` variant.
  - Fallback scenario: house at 40, done at 60, builder back at 65; food rates 7 and 9 x rs; 6 against 3 villagers at 120.
  - Tie scenario: the builder comes from `berry`.
  - No-node scenario: 3 villagers, wood stays 200.
- **Open questions.** None in the ticket or CONTEXT.md. The owner decision on suppression (option c) and the rally and builder-source decisions agree with the body and with design/M2.md "Auto-houses" and "Owner decisions" 4.
- **Contracts.** `HouseDemand` and `planAutoHouse` match the design signature. `EngineState`, `StepHandler`, `addBuildingInstance`, `PaidItem`, `triggerHolds`, `CivRuleContext` and the two event hooks match the SGS-030 Seam block. `constructionSeconds(baseSeconds, builders, data)` matches SGS-027. The `SimInputs` fields (`autoHouses`, `houseBuilders`, `houseBuilderSource`, `walkSeconds`) exist in `model.ts` and SGS-029's defaults. The hook order matches the design Follow-ons.
- **Dependencies and size.** Stated; ~315 lines with a defined split if over 400. The same-file coordination with SGS-032 (only the `build` and `move` entries and loop step 5) is stated.
- **Diagrams.** Both triggers are covered (loop change and new state machine).
- **Lessons.** Both LESSONS.md files are empty.
- **On merge.** None is correct: no new harness, command or design doc, and no CONTEXT Decisions rule is written into a repo doc.
- **Docs.** The Docs scope covers every affected passage and has grep criteria. This includes the "Ages and landmarks" wording at l.141 and the "Construction" and CivRules paragraphs.

## Notes (non-blocking)

- The "no numeric literal other than 0, 1, 60" grep would flag the `^age[1-3]_landmark\d$` regex digits in `simulate.ts`. State that the regex literal is exempt. It is a design rule on class names, not a game number.
- "Ages" criterion: `build kings-palace` and the later `build council-hall` are described together but cannot share one list. `kings-palace` waits and blocks the later step until 100. Say they are two runs, or order the steps.
- The `Reservation ignored` criterion says "villager payments that cost wood". The default villager costs food only, so name the test `GameData` change (villager costs wood).
- `ctx` in the hook calls (`{ ...ctx, baseId, instance }`) is not defined in the ticket. Say it is `{ data, inputs, time: state.time }`.
- SGS-032 will need the same edit as gap 1 for `research`. Mention it in SGS-032 when it is next touched.
