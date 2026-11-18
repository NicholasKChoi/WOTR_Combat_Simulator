# Tech-lead: batch SGS-206-SGS-206

## Decision

PASS: no blockers and no untested hotspots. I opened one draft PR.

## PRs (bottom to top)

- SGS-206: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/214
  - base: `main`
  - kind: new
  - head pushed: `6b14c0d7c48c2147d88b30695cd6375a28503665`
  - branch: `sgs-206-chart-table-hover-and-drag`
  - draft: yes
  - body: set with `gh api` PATCH, and the PATCH succeeded

### Merge risk
**low** - presentation-only change in the chart table: a revert fully undoes it, no API, schema, config or stored-layout change, no `criticalPaths` symbol, and acceptance and unit tests pin the new behavior.

### Review focus
- [`components/apps/aoe4-build-order/use-chart-drag.ts:42-72`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/214/files#diff-8d151c6625dfae1bd230a55f9fe5f29ae74a54145c38ffe423ee5f56a85972e9R42-R72) - the drag position is now written into the DOM imperatively. If `finish` misses an end path, the chart stays shifted and the line stays drawn after the drag. If `onUp` and `onMove` measured different rects, the chart would drop somewhere other than where the line showed - check that both go through `slotAt` and that `finish` clears the transform and `indicatorTop` on every path - pinned by [`acceptance/aoe4-chart-row-feedback.spec.ts`: releasing ... drops where the indicator showed, and ... removes the indicator, the transform and data-dragging](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/214/files#diff-77cfd1fe71cd22ac6ffa5e275762cb2f30d2bffcabddccb3120dd2965b51747fR329-R451)

## What I reviewed

- Commit range: `0866156..6b14c0d`, 3 commits: `e9d0221`, `578c17a`, `6b14c0d`.
- Files changed: 9, for +663/-52 in total.
- Hand-written production code: +129/-48 across these files:
  - `chart-drag.ts`
  - `use-chart-drag.ts`
  - `results.tsx`
  - `chart-header.tsx`
  - `chart-header.module.css`
  - `results.module.css`
- Tests: the new 495-line acceptance spec `acceptance/aoe4-chart-row-feedback.spec.ts`, and 35 new lines in the `chart-drag.test.ts` table test.
- Docs: 4 lines added and 3 removed in `docs/aoe4-build-order-ui.md`.
- Invariants: A1, A2 and A3 cover these paths, and none is touched. The diff makes no engine, data or `criticalPaths` change. It makes no storage-key or `ChartLayout` change, and the drop rule is still `dropIndexAt` over the other charts' midpoints. No open question exists in PROJECT.md or the ticket.
- Overlap with #213 (merged as `68f37c7`, sticky marker control): `git merge-tree --write-tree origin/main <tip>` merges cleanly. The stacking order holds after the merge:
  - the dragged `tbody` is at z-index 2 and the drop indicator at 3;
  - the wrapper creates no stacking context;
  - the sticky marker control (z-index 5) and the sticky run bar (10) both stay on top.
- Untested-hotspot check: the Review focus entry is pinned by the acceptance tests below. Each one asserts the effect, not just that the code ran:
  - `releasing <case> drops where the indicator showed...` (five drop cases). It asserts the slot the indicator meets, the resulting order, the stored layout and the status text.
  - `<a drop | Escape | a cancelled pointer | a lost pointer capture> removes the indicator, the transform and data-dragging`. It first sees the indicator present, then sees it absent, the transform `none` and both `data-dragging` attributes null.
  - The `dropSlotAt` boundary and index rules are pinned by the `chart-drag.test.ts` table.

## Non-blocking notes

- Page scroll during a drag leaves the dragged group and the indicator where they were until the next pointer move. The ticket accepts this.
- The `chart-drop-indicator` `top` is computed only on pointer move, plus once on mount through the ref callback. A layout change mid-drag that has no pointer move (for example a data re-run) leaves the line stale until the next move. A release still uses fresh rects, so the drop itself is correct.
- I put the attribution line above the `<!-- cf-stack -->` marker, so the stack footer stays the last part of the body.
- There is no `Fixes`/`Refs` line, because the ticket `Source` names no GitHub issue.

## Cleanup

- I removed the scratch checkout `worktrees/tech-lead-SGS-206-SGS-206` after writing this report. If the remove fails, it is noted in the hand-back.
