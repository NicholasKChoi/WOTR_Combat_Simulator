# SGS-141 spec gate 2

Verdict: READY

Read at `origin/main` after `git fetch origin`, plus the SGS-132, SGS-134 and SGS-135 ticket files for the Depends-on end states.

## Gate 1 gaps

1. Walk could not reach chart handles and carets: closed. The walk now runs to the `chart-collapse` inside the last chart section, with a press cap, and the handle-before-caret rule is matched per chart section.
2. Results selectors unnamed: closed. `compare-collapse` (SGS-134 uses this id; gate 1 said `key-results-collapse`, which was wrong), `chart-drag-handle` and `chart-collapse` (SGS-135) are named and match those tickets. `CHART_IDS` is `RESULT_CHART_IDS` in `acceptance/helpers.ts` at the base.
3. Conditional helper source: closed. The rule is stated: import if the dependency tips export one, otherwise move `saveCopy` and `editedCopy`. Both are local to `acceptance/aoe4-my-builds.spec.ts` at the base (lines 574 and 589).
4. Optional `save-build`: closed. Two states, each asserting its precondition. This matches `save-build.tsx` at the base: `canSaveVersion` needs `edited` (the button is disabled otherwise) and `linkVisible` needs `sameInput`. The DOM order is `save-build`, `save-build-copy`, then the link and `copy-saved-link`.
5. Grep forbids accurate text: closed. `Per villager` and `strictNullChecks` moved to an audit criterion. The end-state grep terms no longer include them. Today the end-state grep matches only `docs/aoe4-build-order.md:981`, which a feature ticket removes.

## New gaps

None blocking.

## Notes

- The `compare-collapse` walk assumes `ComparePanel` renders whenever a result exists. At the base it renders `pin-run` and `unpin-run` unconditionally, and SGS-134 keeps them. The spec should wait for the run to settle before walking.
- `RESULT_CHART_IDS` appears in Scope as the chart test ids, and `CHART_IDS` is its alias in `acceptance/helpers.ts`. This is consistent.
- The M9.9 row staleness in the design is already in BACKLOG, as the caller said.
