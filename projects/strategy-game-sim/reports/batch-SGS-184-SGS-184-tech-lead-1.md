# Tech-lead gate: batch SGS-184-SGS-184

## Decision

PRs opened. No blockers and no untested hotspots.

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/194, base `main`, **new**, head `517ede8773e87f5e96ac3825d558cf1071669543` (draft)

### Merge risk
**low** - layout markup and CSS only; touches no API, schema, CLI, config or critical-path symbol; a revert restores the tab layout; acceptance specs pin the two-column server render, the width floor and the resize behavior

### Review focus
No hotspots: the change deletes the tab and breakpoint code paths and leaves one static layout. Every behavior it sets is pinned by an acceptance case: the no-JavaScript server render, no hydration warning, the section width and sideways scroll at 1199 and 390 px, the resize across 1200 px with no remount and no run, and table-row display at 390 px. The type checker covers each removed symbol's callers.

## What I reviewed

- Commits `c754c4c..517ede8` on `sgs-184-one-desktop-layout-width-floor`: 3 commits, 0902392 (the change), 9b06cb9 (rework 1, spec fixes) and 517ede8 (two added pins). The merge-base with `origin/main` is c754c4c.
- 14 files, +256/-300 in total. Reviewable production code is +43/-267: `workbench.module.css`, `pages/apps/aoe4-build-order.tsx`, `workbench-columns.tsx` (new), `build-input.tsx`, `step-table.tsx`/`.module.css`, `step-annotation.module.css`, plus the deleted `workbench-tabs.tsx` and `use-split-layout.ts`. I also read the specs: `acceptance/aoe4-min-width.spec.ts` (new), the `aoe4-split-layout.spec.ts` additions, the `helpers.ts` removals, and the `step-annotation.test.ts` regex update.
- Invariants: the A1-A3 paths are touched only in UI files. Nothing touches game numbers, the engine, payment or determinism. The diff has no S1 cross-app imports. S2 still holds because the page keeps `Layout`. No violations.
- criticalPaths: none touched. PROJECT.md has no open questions; the ticket's open questions are none.
- No security, concurrency, schema or API surface in the diff. The removed exports (`useSplitLayout`, `WORKBENCH_SPLIT_QUERY`, `WorkbenchTabs`, `nextTab`, `showTab`, `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH`) have no consumer left on the branch or on current `origin/main`.
- `origin/main` has moved by one commit (a0c8e2b, acceptance-only cleanup) since the merge-base. `git merge-tree` against it is clean.
- Stack check: single branch on `main`, and its diff holds only this task. The dependencies SGS-179 to SGS-183 are all integrated, so the stack footer lists only #194.
- Issue line omitted: the ticket Source names no `GitHub issue #<n>`.

## Non-blocking notes

- `.pageSection` `min-width: calc(1140px - var(--bs-gutter-x, 1.5rem))` depends on Bootstrap's container max-width at the xl breakpoint. A Bootstrap upgrade that changes container widths would shift the floor, but `aoe4-min-width.spec.ts` reads the 1200 px reference at runtime, so the drift would fail that spec rather than pass silently.
- The docs (`docs/aoe4-build-order-ui.md`, `ARCHITECTURE.md`) still describe tabs and breakpoints until SGS-185 lands, as the design's delivery order plans.
