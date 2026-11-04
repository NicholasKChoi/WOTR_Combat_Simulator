# SGS-084 spec gate 1

Verdict: NEEDS_SPEC (two small gaps, neither needs the owner). Risk tier `high` confirmed.

Checked against b9481e3: simulate.ts (incomePerSecond, NODE_REFS, nodeKindOf, gatherRates sample loop), model.ts, result-series.ts, results.tsx, line-chart.tsx, openapi.json (version 2.2.0, gatherRates required + property + example), docs/aoe4-build-order.md (gatherRates bullet, chart table), simulate-house-warnings.test.ts (digest minus warnings/gathered), step-table.tsx checkbox, pin-storage.ts (stores text only, so an old pinned run is re-simulated and carries gatherers; no stale-pin crash). cc9bb04 is an ancestor of b9481e3.

Gaps
1. Acceptance criterion 64 - compares a line's rendered height before and after the toggle. The y axis auto-rescales when the series change, so a per-villager line need not render lower; the check can fail or pass for the wrong reason. Fix: assert on data, not pixels: the y-axis max tick label (or tooltip text for the last sample) changes, or a rendered path point is compared after normalising to the axis. Simplest: read the Food series' last-point value from the tooltip/hover text before and after and expect after = before / food villagers, all in one evaluate/expect.poll.
2. Acceptance criterion 59 - "gatherers.wood drops ... by the same number gatherRates.wood drops by" mixes units (villagers vs wood/min). An implementer must guess. Fix: "gatherers.wood drops by n, the number of villagers pulled, and gatherRates.wood drops by n x the wood rate x 60." Name the build/step input used.

Notes
- Criterion 66's "git grep finds none" has no concrete pattern; name the phrase to search (for example "per minute" within the Gather rates row) or reword as "the Gather rates row and the toggle sentence are present".
- Depends-on text cites main cc9bb04; base is now b9481e3 (still correct, just stale).
- Risk: high is right. simulateBuildOrder is a criticalPaths symbol and its return changes, and a required field is added to the public response (strongModelTriggers: public API response).
- Invariants A2, A3, S3 correctly named. Contracts, OpenAPI bump (2.2.0 to 2.3.0), docs, existing-test rule (add the key, no re-pin), and no-diagram all check out. Input validation not applicable (no new input).
