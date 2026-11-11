# SGS-118 spec-readiness gate, round 1

Verdict: NEEDS_SPEC (three gaps, none owner-only)

Read at origin/main after `git fetch origin`. Checked: scope files and functions, criteria, open questions
(none), invariants (none adjacent; test-only), contracts (the `holdNextSimulate` signature matches
design/M8.md M8.7 detail), size (about 250 test lines), risk (standard is fine for test-only work), docs
(no doc names the helpers), LESSONS, and input validation (not applicable).

## Gaps

1. **Acceptance criteria, chart-id search (criterion 4) - cannot hold in the end state Scope requires.**
   The criterion says every match of `git grep -nE "'chart-[a-z-]+', *'chart-" -- acceptance` is in
   `helpers.ts` or `aoe4-chart-readability.spec.ts`. On origin/main,
   `acceptance/aoe4-narrow-layout.spec.ts:49` also matches. It lists
   `['chart-series-legend', 'chart-marker-legend', 'compare-scroll']`, which are legend ids and not
   `CHART_IDS` members. Scope does not touch that file, so the criterion fails after a correct
   implementation. An implementer would either fold legend ids into `CHART_IDS` (wrong) or edit an
   out-of-scope file. Proposed fix: replace the grep with the rule "no spec declares an array of the four
   chart ids that `CHART_IDS` holds". Alternatively name `aoe4-narrow-layout.spec.ts` (legend ids, a
   deliberate subset) next to `aoe4-chart-readability.spec.ts` as an allowed match. Also say that
   `RESOURCE_CHARTS` in `helpers.ts` is an allowed match.

2. **Scope 5 and criterion 10, import order - the stated rule contradicts the files.**
   The ticket says "case-insensitive alphabetical, the way the other edited specs do". The other specs
   sort by plain character code, so constants come first and functions follow:
   `SIMULATE_PATH, SPLIT_VIEWPORT, buildOrderFrom, openPage` in step-annotations,
   `AOE4_PAGE, SIMULATE_PATH, buildOrderFrom, expectNoRun` in auto-run. Case-insensitive order would put
   `AOE4_PAGE, buildOrderFrom, expectNoRun, ..., SIMULATE_PATH` and reorder every sibling. An implementer
   has to guess which rule applies and where `holdNextSimulate` goes. Proposed fix: state the rule as
   "uppercase constants first in code-point order, then functions in code-point order" (the existing
   convention). Then the only auto-run change is moving `TABS_VIEWPORT` up after `SIMULATE_PATH`, with
   `holdNextSimulate` placed between `expectNoRun` and `isSimulatePost`. Reword the criterion as "the
   list equals the same list sorted with the default `Array.prototype.sort`", or whichever rule is chosen.

3. **Scope 1 and criterion 1, hold semantics are inconsistent and the helper's test is unplaced.**
   - Scope says the route "holds every simulate POST that matches until release". Criterion 1 and the
     design say "holds the next simulate POST". Today's local copies hold every POST: they await one
     shared gate in every handler call, as in step-annotations, compact-view and the "first invalid load
     state" test. The contract spec's status-line test unroutes and holds twice, which only makes sense
     for hold-all. A "first POST only" implementation would let a later POST through and fail those
     specs. Proposed fix: state in Scope and the criterion that every matching POST is held until
     `release()`, and drop "next" from the criterion.
   - Criterion 1 requires a spec exercising each behavior but names none, and Scope adds no new spec. An
     implementer would guess between writing a new spec and relying on pin-compare. Proposed fix: name the
     carrier. For example, say the existing duration-filtered pin-compare tests already show that a POST
     for another duration resolves while the held one waits, and that the no-duration case is covered by
     the contract spec or step-annotations hold, each with an explicit assertion that the held request has
     not resolved before `release()`. Otherwise add a small `helpers` spec to Scope.

## Notes (non-blocking)

- Charts-dim replacement test (Scope 4): "shows the charts dimmed until the result lands" is racy if the
  result returns quickly. Say to use `holdNextSimulate` around the changed input, assert 0.5, release,
  then assert 1. This also exercises the new helper.
- Open-rows test (Scope 4): "the two builds' expected open-row lists differ" is ambiguous. In the test,
  `before` is build 0's list and `expected` is the list after selecting `BUILDS[2]`. Say to assert that
  `expected` contains at least one row open that is not open in `before`, since that is the case the test
  claims to cover. Check that `BUILDS[2]` satisfies it with the shipped data and name the build in the
  ticket if not.
- Results-split's local `CHART_IDS` is a mutable array, but the helpers export is `as const`. Its
  `toEqual(CHART_IDS)` and `.slice(-CHART_IDS.length)` still work, but the order must match the DOM, and
  the sibling ticket may reorder the list. The ticket already says specs must work with either
  definition; consider saying that this spec asserts DOM order against `CHART_IDS`.
- `aoe4-build-order-pin-compare.spec.ts:391` has a `page.route` that answers per duration. Confirm it is
  a fulfil route and not a hold, so criterion 3 (no gate-then-continue route) holds there.
- Mutation checks are well specified. Remember that criterion 7's `aria-describedby` mutation must fail
  every such test, including the `not.toHaveAttribute` assertions on the settled side, so the resolve
  check belongs only where the attribute is expected to be present.

Report path: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-118-spec-gate-1.md
