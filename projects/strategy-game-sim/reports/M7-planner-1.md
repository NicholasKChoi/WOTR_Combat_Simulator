# M7 planner report 1 (2026-11-10)

Verdict: plan written, with 5 outlines. Every M7 criterion and all four backlog items are covered. Outline E (M7.8) is blocked on DQ1.

Plan: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/plans/M7-20261110.md
Base read: origin/main 68dd089. Since the design's starting state 85979c5, the only change is `scripts/smoke-preview.mjs`.

## Outlines
- A: step annotation model (`step-annotations.ts` via git mv, plus `alignSteps`, `buildAnnotations`, `finishedText`, `stepSpan(timing)` and `resultsStale`). Root. Risk: standard. Covers M7.1, M7.2 and M7.4 (model).
- B: run cell, kind legend and stale dimming on the step table, plus page wiring. Also takes backlog items 1–3 (Build-panel sideways scroll and the two doc wording fixes). New `aoe4-step-annotations.spec.ts`. Depends on A. Risk: standard. Covers M7.1, M7.2, M7.4 and part of M7.7.
- C: row hover/focus shades the charts; removes the step timeline and its CSS; rewrites the five timeline specs. Depends on B. Risk: standard. Covers M7.3, M7.5 and part of M7.7.
- D: Text-tab gutter compact view (`annotationsByLine`, editor props, `aoe4-compact-view.spec.ts`). Depends on B and C. Risk: standard. Covers M7.6 and part of M7.7.
- E: house-gate rule change in simulate.ts, with a test for build 259's case (backlog item 4). Root, independent of the UI chain. Risk: high (simulator rule; possible OpenAPI warning removal; prebuilt timings shift). Covers M7.8. blocked-on: DQ1.

## Uncovered criteria
None.

## Design questions (details in the plan)
- DQ1 (E): which house rule. Options: A) drop the gate (recommended); B) yield only while a reached house step has not started; C) open the gate when supply blocks production; D) a per-build setting.
- DQ2 (B): how the Build-panel scroll is fixed. Options: (a) make the table fit, with a table-own scroll fallback (recommended); (b) move only the overflow onto the table; (c) cards in split.
- DQ3 (D): show the kind legend above the Text editor? Recommend yes.
- DQ4 (D): reuse the `step-started`/`step-finished` ids in the gutter? Recommend yes.
- DQ5 (D): caret plus gutter hover. Recommend last event wins.
- DQ6 (C): remove the `results-split` wrapper and its id? Recommend yes.
- DQ7 (B): keep `aria-describedby` on results only while the status text is non-empty. Recommended.

## Spec gaps
1. The design does not cover M7.8 (DQ1).
2. Build 259's paste text is not available. Recommend a reduced synthetic fixture of the same shape.
3. The design does not cover the scroll backlog item (DQ2).
4. The backlog's doc line numbers have shifted (874 is now ~875, 878 is now ~896).

## Human actions
The owner answers DQ1 and DQ2. There are no ops or evidence criteria and no new tools or environment prerequisites. No 390 px checks are planned.
