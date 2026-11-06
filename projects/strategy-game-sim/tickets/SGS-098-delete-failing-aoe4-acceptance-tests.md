# SGS-098: Delete the AoE4 acceptance tests that fail on main

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / housekeeping (acceptance suite green)
- **Priority**: high
- **Risk**: low
  <!-- test-only deletion: one component, no public surface change, no product code, no adjacent invariant -->
- **Invariants**: none
- **LOC estimate**: 0 business logic (deletes test cases and now-unused test code under `acceptance/`)
- **Depends on**: none
- **On merge**: none
- **Source**: owner answer to board Q14; SGS-095 implementer report "Pre-existing failures" (28 failures on main)

## Context

`npm run acceptance` fails on origin/main (9328355): 28 AoE4 acceptance tests pin values that went stale
when villager producers began producing until 100 villagers (9274372). The owner chose to delete these
tests rather than re-pin them, so the suite is green and can gate future tickets.

## Scope

Branch from origin/main. Delete exactly the failing test cases below (the `test(...)` blocks, including a
`for` loop that generates them when every generated row fails; the contract-spec examples loop, where one
row passes, is narrowed instead, as described below). Reproduced in a ticket worktree with a
full `npx playwright test` on 9328355: 734 passed, 28 failed (same count as the SGS-095 report). Failing
tests, by file and exact title (`describe › ... › test`):

`acceptance/aoe4-simulate-api-contract.spec.ts` (1; narrow the loop, do not delete it) (respec 1)
- examples › the buildOrder request example returns the documented 200 body
- This title is one row of `for (const name of Object.keys(requestExamples))` inside the `examples`
  describe. `docs/api/openapi.json` has two request examples, `buildOrder` and `goldRunOut`. Only the
  `buildOrder` row fails; "the goldRunOut request example returns the documented 200 body" passes and
  stays. Change the loop header to `for (const name of ['goldRunOut'])`. This one line is the only
  permitted edit to a surviving test. The loop body, the `requestExamples`/`okExamples` constants, and
  `expect200` stay as they are (other tests still use them).

`acceptance/aoe4-simulate-api-depletion-engine.spec.ts` (6)
- a node with a finite stock › runs out at an exact instant between samples and gathers exactly its stock
- villagers arriving at a dry node › produced villagers rallied to it add to a single idle-arrival warning
- numbered gold deposits › run out independently: deposit 1 running dry leaves deposit 2 on the same run-out instant
- the prebuilt English build against the pre-depletion engine › differs only by the farm builders joining at completion: the 1200 second bank and the farm-walk food rates
- the prebuilt English build against the pre-depletion engine › keeps every step timing to within a float ulp
- the prebuilt English build against the pre-depletion engine › leaves orders without a farm build exactly as before

`acceptance/aoe4-simulate-api-edges.spec.ts` (1)
- result shape › a villager-only order returns every result field, aligned to the times axis

`acceptance/aoe4-simulate-api-house-lead-time.spec.ts` (4, every test in the file: delete the file)
- auto-houses planned against the house lead time through the simulate API › population keeps rising while the King's Palace builds when the explicit pre-palace houses are removed
- ... › the first house during the palace build lands between 690 s and 695 s, pinning the series from 680 s to 765 s
- ... › shipped builds at 1800 s › english-1tc results are unchanged: population, spending, step timings, cap instant and warnings
- ... › shipped builds at 1800 s › english-knight-longbow results are unchanged: population, spending, step timings, cap instant and warnings

`acceptance/aoe4-simulate-api-house-warnings.spec.ts` (1)
- auto-house warnings through the simulate API › the knight and longbow build at 1800 s reports one held warning on its late house step

`acceptance/aoe4-simulate-api-markers.spec.ts` (1)
- markers at a truncated horizon › gives no marker to research still in progress, then marks it once the horizon passes the completion

`acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` (3 of 4; the file keeps its remaining test)
- the spear/longbow into men-at-arms/crossbow build through the simulate API › at 1200 s the men-at-arms step arms at the Castle landmark second and starts when resources allow, with no waiting step
- ... › at 3600 s the men-at-arms step arms at the Castle landmark second and starts when resources allow, with no waiting step (the two come from one `for (const durationSeconds of [1200, 3600])` loop; delete the loop)
- ... › at 1200 s no gold deposit has run out and the run has no warning
- Stays: "at 3600 s each of the three gold deposits runs out with an info node-depleted warning and no warning-severity gold issue" (passes today).
- Remove the constants these deletions leave unused: `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS`,
  `MAN_AT_ARMS_START_SECONDS`, and the comment line above `CASTLE_LANDMARK_SECONDS` that explains
  them (respec 1). `GOLD_NODES`, `WARM_UP_TIMEOUT_MS`, `simulate` and the `beforeAll` warm-up stay (the
  remaining test and the warm-up use them). The `steps` member of the `Result` type may be deleted as a
  whole line once nothing reads it.

`acceptance/aoe4-simulate-api-spend-population.spec.ts` (2)
- spent on the prebuilt English build › ends at the snapshot costs of the research and buildings it started, whole auto-houses, and each continuous producer paid one unit ahead
- spent on the prebuilt English build › counts an auto-house under buildings when the order has no house step

`acceptance/aoe4-simulate-api-timelines.spec.ts` (4, every test in the file: delete the file)
- pinned timelines › the prebuilt English build pays its first buildings after a 5 second wait and reaches Feudal at the pinned instant
- pinned timelines › researches that wait on resources start at the pinned instants and the floating bank ends at the pinned values
- pinned timelines › forty villagers with auto-houses finish at the pinned instant and end with the pinned bank
- pinned timelines › an unpaid step keeps waiting while earlier steps complete at the pinned instants and the bank ends at the pinned values

`acceptance/aoe4-simulate-api-triggers.spec.ts` (2)
- the default English 1TC build with default amounts › keeps every step start time of the infinite-node run
- the default English 1TC build with default amounts › runs the sheep out at 782.85 s with six villagers idle and never touches berry, deer, boar or stone

`acceptance/aoe4-simulate-api-veterancy-conversion.spec.ts` (3, every test in the file: delete the file)
- Veteran Longbowmen converts the longbowmen on the field in the knight/longbow build › longbowman-2 holds 9 at 845 s and none from 850 s on
- ... › longbowman-3 holds none at 845 s, 9 at 850 s and 63 at 1800 s
- ... › per-baseId counts sum to a cumulative produced total that never decreases

Deletion rules:
- Delete a spec file only when every test in it is listed (house-lead-time, timelines, veterancy-conversion).
- After deleting, remove what became unused in the touched files: imports, constants, types, helper
  functions, fixtures, empty `describe` blocks, and `beforeAll` warm-ups left with nothing to warm for.
  Remove an export from `acceptance/helpers.ts` only if no remaining spec uses it (today `finalCount`,
  `INFINITE_NODES` and `buildOrderFrom` are also used by surviving specs; re-check with a search).
- Delete, never `test.skip` or `test.fixme`. Change no remaining assertion or expected value, and touch no
  product code, docs or data files.
- The diff adds or modifies no line except two kinds (respec 1): the contract-spec loop header above, and
  an import line that keeps some names but drops ones that became unused. Everything else is whole-line
  removal. No listed deletion unwraps a surviving test, so nothing is re-indented.
- `tsconfig.json` does not set `noUnusedLocals` or `noUnusedParameters`, and the repo has no ESLint
  config, so `npx tsc --noEmit` does not catch unused names. Check them with the grep rule in the
  acceptance criteria.
- Re-run the full suite on the branch first; if a test beyond the list fails, or a listed one passes
  (flake), report it and do not widen or narrow the deletion without that being noted in the report.

**Out of scope:** re-pinning any value; product code; docs; other test changes; new tests. The deleted
tests leave their behaviors without acceptance coverage (recorded as a backlog follow-up by the manager).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm run acceptance` passes on the branch with no failing or flaky test and no skipped or fixme'd test added.
- [ ] (respec 1) `git diff origin/main -- acceptance/` removes whole spec files for the three fully listed files, and in the other files removes the listed `test(...)` blocks (or the spear/longbow `for` loop generating them) plus the code that became unused because of them. Its added (`+`) lines are only (a) `for (const name of ['goldRunOut'])` replacing `for (const name of Object.keys(requestExamples))` in `aoe4-simulate-api-contract.spec.ts`, and (b) import lines that drop now-unused names and keep the rest.
- [ ] (respec 1) Every remaining test is byte-identical in title, body and expected values to origin/main. The only exception is the contract-spec loop header in (a), which leaves the loop body unchanged.
- [ ] (respec 1) `npx playwright test --list` on the branch shows "examples › the goldRunOut request example returns the documented 200 body" and no "the buildOrder request example returns the documented 200 body".
- [ ] No `test.skip`, `test.fixme`, `.skip(` or `.fixme(` appears in the diff.
- [ ] No file outside `acceptance/` changes.
- [ ] Listing tests (`npx playwright test --list`) on the branch shows none of the titles above, and shows the "at 3600 s each of the three gold deposits runs out..." test in the spear/longbow spec.
- [ ] (respec 1) No name is left unused by the deletions. For each edited (not deleted) file under `acceptance/`, take every identifier on a removed line that the file declares at top level (an import binding, `const`, `function` or `type`). Either its declaration is removed too, or `git grep -nw <name> -- <file>` on the branch finds at least one line besides the declaration. For an export of `acceptance/helpers.ts`, `git grep -lw <name> -- acceptance/` lists a file besides `helpers.ts`. `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS` and `MAN_AT_ARMS_START_SECONDS` match nothing under `acceptance/` on the branch.
- [ ] `npm test` and `npx tsc --noEmit` pass.
- [ ] The implementer's report lists the count of tests before and after and the files deleted or edited.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-06

- Underspecified: the contract "buildOrder request example" test is one row of a two-row loop whose `goldRunOut` row passes. Also, the diff criteria contradicted each other (deletions only vs. a re-indentation allowance), and the unused-name check was vague.
- Changed: the contract loop is narrowed to `['goldRunOut']`, the only permitted edit to a surviving test. The diff criteria now allow only that line and import-line trims, and the re-indentation allowance is dropped. A grep rule replaces the unused-name check, because tsconfig has no `noUnusedLocals`. The spear/longbow constants to remove are named.
- Branch work: none exists yet.
