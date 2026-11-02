# SGS-055 review 1

Branch sgs-055-aoe4-m3-playwright-flow, tip 6fef201, base main d90d91a (merge-base = origin/main tip).
Verdict: **REQUEST CHANGES** (one blocking contract finding; the code is otherwise correct and passes).

## Blocking findings

- acceptance/aoe4-build-order-pin-compare.spec.ts:7,16-19 and acceptance/aoe4-step-table.spec.ts:6,13-16 - contract -
  AC 8 requires `openPage` and `runSimulation` to "exist once, in acceptance/helpers.ts ... none in the specs";
  the ticket's own grep finds 4 lines after the diff (helpers.ts:69,74 plus a local `openPage` in each of these two
  specs, which merged after the ticket was written). Both local copies are byte-identical in behavior to the new
  `helpers.ts` `openPage` (goto `/apps/aoe4-build-order` + `waitForLoadState('networkidle')`), and the ticket's
  stated reason for the move ("a copy would still drift"; `acceptance/` is outside `lint:dup`) applies to them
  exactly. - Three copies of the same helper now exist, one of which is the newly shared one. - Direction: in both
  specs import `openPage` from `./helpers` and delete the local function and the then-unused `PAGE` const (PAGE is
  used only inside openPage in both files, checked). No expectation changes, so this stays inside the ticket's
  Out of scope ("the other specs' expectations"). If the manager prefers to keep those files untouched, the
  alternative is a respec of AC 8 to count only aoe4-build-order.spec.ts; one of the two is needed, as AC 8 fails
  as written.

## Spec gaps

None beyond the AC 8 drift above (ticket predates SGS-046/048 specs landing with their own openPage).

## Acceptance criteria

1. Spec exists with 3 tests, design test ids only (+ `path[data-series]`; attribute selectors `[data-step]`,
   `[data-code]`, `[data-testid=..][data-..]` match sibling usage at aoe4-build-order.spec.ts:538 and
   pin-compare.spec.ts:119,144); `git ls-files acceptance | grep -c m3-flow` = 1 on branch. **Pass.**
   Ran under Node 24 port 3917: new spec + the 3 AoE4 UI specs 56 passed; all `acceptance/aoe4-*` 338 passed;
   new spec `--repeat-each=3` 9/9 passed.
2. Table/text sync both ways (row count 2, `3`, then `x5`, still 2). **Pass** (spec lines 20-30).
3. node-depleted sheep warning in response (severity warning, idleVillagers > 0) and the exact message in a
   `simulation-message[data-code=node-depleted][data-severity=warning]` inside `simulation-warnings`. **Pass.**
4. (respec 3) 2 timeline rows; step 0 completed, not flagged, contains x5; step 1 not-reached + flagged. **Pass.**
5. 7 compare-row keys in design order, food + pinned:food per resource chart, unpin removes table and pinned paths.
   **Pass.** Pin is clicked after run 1; Playwright waits for `pin-run` to be enabled, which happens only once a
   result exists, so run 1 is what gets pinned.
6. Reaction test: gold depletedAt non-null, last timeline row reaction + completed, last table row reaction
   checked, no `gold ran out` in warnings. **Pass** (see non-blocking note 1 on the depletedAt assertion).
7. Unparseable paste shows `step-table-unavailable`, no `step-table`; valid paste restores it. **Pass.**
8. openPage/runSimulation exist once in helpers.ts, none in specs. **Fail** (blocking finding above). The
   "existing AoE4 spec still passes unedited otherwise" half passes: the only edits to aoe4-build-order.spec.ts are
   the import and the removed local helpers/PAGE.
9. Mutation check: not re-run by me; implementer reports sheep amount 3000 -> 99999999 failed the flow test at
   the node-depleted toMatchObject, and removing the english-1tc reaction failed the reaction test at
   data-reaction. Consistent with my reading of the assertions. Unverified by the gate.
10. Deterministic: no waitForTimeout; waits are on responses and auto-retrying expects; webServer harness;
    port 3917 free after runs. **Pass.**
11. No INVARIANTS regressions: test-only diff, no lib/, data/, pages/ or components/ change. **Pass.**

Criteria not ticked in the ticket (verdict is not APPROVE).

## Invariants touched

None. A1-A3, S1-S3, W1-W2, H1-H3: diff is confined to acceptance/; none apply.

## Lint

`npx tsc --noEmit` clean; `npm run lint:dup` 0 clones (acceptance/ is outside its paths).

## Bot reconciliation

`reviewBot.cli` is empty and no rulesFile; no bot run.

## Non-blocking notes

1. acceptance/aoe4-build-order-m3-flow.spec.ts:80 - `expect(result.depletions.find((d) => d.node === 'gold')?.depletedAt).not.toBeNull()`
   passes if `gold` is absent from `depletions` (`undefined` is not null; depletions only lists refs the run uses,
   model.ts:166). The ticket wants this to "fail loudly instead of passing vacuously". Today ENG 1TC uses gold so
   it is present, and later assertions (status completed) would still catch it, but `toMatchObject({ depletedAt:
   expect.any(Number) })` on the found entry would make the guard exact. Worth folding into the rework.
2. m3-flow spec lines 10-12 redefine `INVALID_PASTE` (also aoe4-build-order.spec.ts:20, pin-compare.spec.ts:14),
   `COMPARE_KEYS` (= pin-compare `ROW_KEYS`, line 11) and `RESOURCE_CHARTS` (pin-compare line 10). Not required by
   the ticket; a candidate for helpers.ts in a later cleanup.
3. pin-compare.spec.ts:21-27 `run()` reimplements `runSimulation` under another name; outside this ticket's grep and
   scope. BACKLOG candidate.

## Coverage

Reviewed: acceptance/aoe4-build-order-m3-flow.spec.ts, acceptance/helpers.ts, acceptance/aoe4-build-order.spec.ts
(diff), siblings acceptance/aoe4-build-order-pin-compare.spec.ts and acceptance/aoe4-step-table.spec.ts,
lib/aoe4-build-order/model.ts (SimulationResult, NodeDepletion, SimWarning), lib/aoe4-build-order/depletion.ts
(depletionResults). REPO.md Review checklist: "Every diff" `next build` not run (test-only diff; acceptance/ is
not in the Next build graph); the page was loaded by Playwright through the real dev server. AoE4 build order
section's paths are not touched. No REVIEW.md at repo root; LESSONS.md files are empty; styleSources
ARCHITECTURE.md/tsconfig.json have nothing specific to acceptance specs beyond tsc.
Review worktree .claude/code-factory/worktrees/review-sgs-055 removed after the run; implementer worktree not touched.
