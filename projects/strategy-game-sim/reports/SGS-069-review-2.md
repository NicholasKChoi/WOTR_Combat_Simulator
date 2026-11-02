# SGS-069 review 2

Branch sgs-069-aoe4-timeline-blocked-by-compare, tip 6728298ea46205a00783d7c6c19d164b7f587b05 (local only; `git fetch
origin` failed with an access error from this sandbox, and the branch is not on origin). Base origin/main 54d7e90.
Reviewed in a detached worktree at that tip. Node 24.22.2 for acceptance (the shell default is v22.17.0).

**Verdict: APPROVE**

## Scope of this pass

This was the bounced gate (review 1 at 201238a). `git diff 201238a 6728298` touches only `acceptance/helpers.ts`,
`acceptance/aoe4-build-order-pin-compare.spec.ts`, and `acceptance/aoe4-build-order-m3-flow.spec.ts`. The production
code and docs are byte-identical to what review 1 passed, so the production findings and evidence from
reports/SGS-069-review-1.md stand. I re-ran the full gate commands on the new tip.

## Blocking findings

None.

## Rework 1 items

- **pin-compare "omits rows blank on both sides..." (spec:99):** it now asserts `keys` equals `expectedCompareKeys(current, pinnedRun)`.
  Mutation 1 removed the omit `.filter` from `compareRows` (compare.ts:62). This test fails, along with m3-flow and
  the two existing pin-compare tests, for 4 failures in total. That matches the implementer's report. The test name
  is now accurate.
- **m3-flow:** the "in-order subset" check is replaced with exact equality against
  `expectedCompareKeys(result, pinnedResult)`. `pinnedResult` is taken from the first run's response. Mutation 1
  fails this test, so a wrongly kept row is caught.
- **Helper (`acceptance/helpers.ts:82-92`):** it derives the expected keys from the raw `SimulationResult`
  (`times.includes(T)`, `ages`, `populationCapReachedAt`) and does not call `keyNumbers`/`compareRows`, so it does not
  restate the production code. Its rule matches the contract. Military presence via `times.includes(T)` is the same as
  production's `spent.military[i] !== undefined`, because `times` and `spent.military` are built in step
  (review 1, question 1). The one-line comment is accurate.
- **Wrongly omitted rows:** mutation 2 changed the filter's `||` to `&&`, which drops one-sided rows. The pin-compare
  omit test fails, along with three other pin-compare tests. m3-flow stays green under this mutation because in its
  scenario no row is blank on just one side. The flow spec still catches the omission of a row present on both sides
  and the keeping of a row blank on both sides. I accept this as meeting the rework item.
- **No other changes:** confirmed.

## Spec gaps

None.

## Acceptance criteria

All criteria from review 1 still pass on the unchanged production code. The evidence table is in
reports/SGS-069-review-1.md. Re-run on 6728298:

- `npm test`: 40 files, 1094 passed, 8 skipped.
- `npm run acceptance` (Node 24.22.2): 556 passed.
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.

I ticked every criterion and rework item in the ticket except criterion 14. Its test half passes, but "every edited
existing test is listed in the PR description" cannot be checked until the PR exists. The manager or PR step should
confirm it.

## Invariants touched

Production code is unchanged since review 1, and A1, A2, A3 and S1 still hold. The test-only change touches no
invariant.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## Lint

`npx tsc --noEmit` is clean, and `npm run lint:dup` found 0 clones.

## Conventions

- The shared helper sits in `acceptance/helpers.ts` next to the other cross-spec helpers (`openPage`,
  `runSimulation`), and both specs use it.
- The local `ROW_KEYS`/`COMPARE_KEYS` constants were removed from the specs rather than duplicated.
- The m3-flow change reuses the `runSimulation` response, like the existing `response.json()` use at
  m3-flow.spec.ts:33-35.

## Non-blocking notes

- Carried from review 1 and not addressed (optional): step-timeline-rows.test.ts:73
  `expect(LONG_WAIT_SECONDS).toBe(60)` only restates the literal. Inline `overflowX: 'auto'` could be Bootstrap's
  `overflow-x-auto`. A time delta under 0.5 s renders `0:00 earlier`.
- The m3-flow scenario has no row that is blank on only one side, so it cannot catch an over-eager omission of
  one-sided rows. The pin-compare tests cover that, as shown by mutation 2.

## Repo review checklist

- **Every diff:** production code is unchanged since review 1, which ran `npx next build` successfully. Acceptance
  drove the page through `next dev` again (556 passed). I did not re-run `next build` because only `acceptance/`
  files changed, and `tsc` covers them.
- **AoE4 build order:** no lib helper or constant is copied. The test helper has its own key list, and that is test
  data, not a lib tolerance.

## Coverage

- Reviewed the full rework diff (3 files), compare.ts as the helper's oracle, and the surrounding spec bodies.
- Ran tsc, lint:dup, npm test, the full acceptance suite, and two mutation runs on the two compare specs. Both
  mutations were reverted, and the worktree is clean.
- Not reviewed: the PR and Vercel preview, because the branch is not on origin.
