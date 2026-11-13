# SGS-154 review 1

Verdict: APPROVE. Branch sgs-154-unpinned-aoe4-acceptance, tip 9fa4c16, diff against merge-base f55e0aa.

## Blocking findings
None.

## Acceptance criteria
- Items 1 to 7 each have at least one test: pass. 10 new tests, none skipped or fixme'd. The suite was not run, per the gate rules; the implementer reports 1115 passed.
- No engine-decided literals: pass. The literals are inputs (produce counts 3, 40, 2; stocks 601, 100, 300; horizons 1200, 3600, 1800; `walkSeconds` 5; `1e-6` and `1e-3` tolerances). Instants and step indexes come from the response or the build JSON. The costs come from the snapshot.
- Item 2 (respec 2): pass. The before-horizon is `ceil(completedAt) - 1` and is asserted at or after `startedAt`. The test asserts status `in-progress` with no marker labeled with the tech, then `completed` with the marker at `ceil(completedAt)`. The before branch is reachable by mutation: pushing `researchMarker` at pay time in `researchHandler` (`research.ts` ~line 55) puts a marker at `startedAt`, which the test catches. The implementer did not run that mutation; I judged it by reading.
- Item 3 (respec 3): pass. Exactly two longbowman series, ordered by `tier`. Checks cover lower zero at and after completion, upper zero before and positive at the first sample at or after, a non-decreasing sum, and a final sum equal to the upper tier's last count and to the independent `finalCountOf` (by `baseId`).
- Item 4 (respec 1): pass. Both horizons run in a loop. The step is the first time-triggered `man-at-arms` produce step. Asserts `armedAt` equals the trigger seconds, `startedAt` at or after it, `waitBreakdown.resources` within 1e-3 of `startedAt - armedAt`, and no `waiting` step.
- Item 5 (respec 2): pass. Preconditions assert a depletion exists and at least one step starts before it. Per-node warning rules match the ticket: exactly one warning per depleted node, none for a null `depletedAt`, `at` equal to `depletedAt`, an integer `idleVillagers` of at least 0, and severity `warning` exactly when `idleVillagers` is above 0.
- Item 6 (respec 2, 4, 6): pass.
  - (a) Asserts the berry `depletedAt` precondition, the `gathered.food` rise, `floating.food` rise plus `spent.villagers` rise, and `depletedAt` not a multiple of `sampleSeconds`.
  - (b) Asserts the `idle-arrival` precondition, the villager series' last count at least 2 with its own message, exactly one berry `idle-arrival`, `at` above 0, and `idleVillagers` between the count and the series' last count. The total warning count is not asserted.
  - (c) Asserts the precondition, deposit 2 `node` and `amount` equal, `depletedAt` within 1e-6, and deposit 1 equal to `{ node: 'gold', amount: null, depletedAt: null }`.
- Item 1 (respec 4): pass. The key list is derived from `schemas.SimulationResult.properties`. Asserts the count-3 precondition, `times` start, end and length, every series aligned to `times`, the villager series non-decreasing and ending at or above 3 with no equality, and one `completed` step.
- Item 7 (respec 4): pass. The `>= 40` precondition runs before the `spent` checks. `spent.villagers` is a multiple of the cost and at least the last count times the cost. `spent.buildings` is positive and a multiple of the house cost. `spent.military` and `spent.research` are 0.
- Preconditions where the data matters: pass.
- Nothing outside `acceptance/` changed; no pre-existing assertion changed: pass. The diff has 211 insertions and 2 deletions. The deleted lines are the `Body.steps` type line, rewritten to add `startedAt`, and the old `import { buildOrderFrom, postSimulate }` line, rewritten to add `INFINITE_NODES`. Both are type or import edits. Assertions and expected values are unchanged.
- `npx tsc --noEmit` and `npm run lint:dup`: pass (0 clones), run by me. `npm test` and `npm run acceptance`: not run by me. The implementer reports 2512 unit tests passing, and 1115 passed with 2 pre-existing failures in acceptance. Both failures, `aoe4-results-split.spec.ts:41` and `aoe4-build-order-step-band.spec.ts:143`, reproduce at the base according to the implementer and are not touched by this diff.

## Invariants
- A3 holds. Assertions are relations over responses or runs, with no wall-clock use and no dependence on run-to-run variation. A1 and A2 are untouched.

## Bot reconciliation
No `reviewBot` CLI or rules file is configured, so there are no bot findings.

## Non-blocking notes
- Item 2: the "each marker's `at` is at most the horizon" check covers only the two horizon runs, not the full run. The full run is not at a truncated horizon, so this is fine.
- Item 6(b): the villager series is read with a non-null assertion on `find`. If the series were missing, the test would throw a `TypeError` instead of a named message. This is cosmetic.
- Item 6(b): the added `severity: 'warning'` assertion is stricter than the ticket and holds, since `idleVillagers` is at least 2.
- The implementer's out-of-scope note that another agent overwrote a shared scratchpad `mutate.py` is a process issue outside this review.

## UI inspection
Not applicable: the diff has no UI changes.

## Coverage
Reviewed all 7 changed files in full against the ticket, the invariants, `REPO.md`, and `LESSONS.md`. The LESSONS entry on Playwright layout checks does not apply, since there are no layout checks. Read `research.ts` to check that item 2's before-horizon branch can fail. `REPO.md` has no `## Review checklist` section, so no checklist steps applied. The review was done in the task worktree read-only; no separate review worktree was created.
