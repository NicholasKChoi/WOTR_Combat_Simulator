# Tech-lead gate: batch SGS-203-SGS-203

## Decision

OPENED - no blockers, no untested hotspots.

## PRs (bottom to top)

- SGS-203: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213 - base `main` - new (draft) - head pushed 85508a7fb229b315ab9cc6e9a45b2a7f4a73b424 (branch `sgs-203-marker-control-stays-in-view`)

### Merge risk
**low** - CSS plus one client-side measuring hook; a revert fully undoes it, it touches no public surface or critical-path symbol, and the new acceptance spec pins the sticky, stacking, clearance and no-marker behavior.

### Review focus
- [`components/apps/aoe4-build-order/use-marker-control-height.ts:5-18`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-948fa4ad6bd782e6cf652d51fc4e67ba88f097740e381a2343bae675b6e20f1e) - the height is written as a custom property on the nearest `section` ancestor (the page section), which `.resultsColumn` reads through inheritance. If `Results` is ever wrapped in its own `section` below the column, the variable no longer reaches the column, the padding silently drops to 0, and focused chart handles slide under the control - check that the closest `section` is still an ancestor of `results-column` - pinned by [`acceptance/aoe4-marker-control-sticky.spec.ts`: a drag handle scrolled into view and focused below the control lands at or below the control, also after the control wraps taller](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-efac4e8c7b17aaf683914d1cfb3cd09cf1805353b00e4efda113c8323a57e63bR125-R151)

## What I reviewed

- Range: `636193dcf07db9771772d1a143a8ea7b9e0395f1...85508a7` (2 commits: 6c71747, 85508a7), base `origin/main` merge-base.
- Files: `components/apps/aoe4-build-order/{chart-legend.tsx, chart-legend.test.ts, results.module.css, use-marker-control-height.ts (new), workbench-columns.tsx, workbench.module.css}`, `docs/aoe4-build-order-ui.md`, `acceptance/aoe4-marker-control-sticky.spec.ts` (new).
- LoC: +225/-3 total; reviewable +38/-2 (excludes the acceptance spec, unit test, docs).
- Checked: INVARIANTS (AoE4 A1-A3 and S1-S3 not touched: UI-only CSS/hook, no engine, data, API), no criticalPaths symbol, no public surface, PROJECT.md Open questions (none). Verified `control.closest('section')` resolves to the page section (`pages/apps/aoe4-build-order.tsx:334`), an ancestor of `results-column`; `ComparePanel`'s `section` is a sibling of `Results`, not an ancestor. Commit author email is the Vercel-team address.
- Hotspot pin: the focus-clearance test asserts the handle starts above the column top, then that handle top >= control bottom after scrollIntoView+focus, at one-line and wrapped heights; review-8 recorded the mutation (padding 0px) failing it. The no-marker test pins cleanup (padding returns to zero).
- Stack check: single member on `main`, diff contains only this task. No existing PR before create. Issue line: ticket Source is BACKLOG.md, no `GitHub issue #<n>`, so none. Preview checks: one, from the ticket's Unverified assumptions.

## Non-blocking notes

- `use-marker-control-height.ts` couples to DOM structure via `closest('section')` and writes the variable on the page section rather than the Results column the ticket names; behaviorally equivalent today (only `.resultsColumn` reads it), noted in Review focus.
- PR body source file left at `$PROJECT_DIR/reports/pr-213-body.md` (applied successfully; not a stale body).
