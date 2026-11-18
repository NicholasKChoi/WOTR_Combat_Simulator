## Summary
The shared "Markers" control on the AoE4 build-order page now stays at the top of the Results column's visible area while that column scrolls. Before, it scrolled away with the first chart, so hovering, focusing or toggling a marker kind only worked against the top chart. It is now pinned with `position: sticky` and drawn opaque over the charts scrolled beneath it. The Results column gets a top scroll padding equal to the control's measured height, so a chart control that is focused or scrolled into view does not land under it. The padding follows the control's height as it wraps. A run with no markers draws no control and leaves no padding.

Non-goals: the per-chart zoom bar, the series and pinned legends, the run bar and the Build column keep their current behavior. Marker semantics and the control's tab order, DOM order and buttons are unchanged.

## Merge risk
**low** - CSS plus one client-side measuring hook; a revert fully undoes it, it touches no public surface or critical-path symbol, and the new acceptance spec pins the sticky, stacking, clearance and no-marker behavior.

## Review focus
- [`components/apps/aoe4-build-order/use-marker-control-height.ts:5-18`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-948fa4ad6bd782e6cf652d51fc4e67ba88f097740e381a2343bae675b6e20f1e) - the height is written as a custom property on the nearest `section` ancestor (the page section), which `.resultsColumn` reads through inheritance. If `Results` is ever wrapped in its own `section` below the column, the variable no longer reaches the column, the padding silently drops to 0, and focused chart handles slide under the control - check that the closest `section` is still an ancestor of `results-column` - pinned by [`acceptance/aoe4-marker-control-sticky.spec.ts`: a drag handle scrolled into view and focused below the control lands at or below the control, also after the control wraps taller](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-efac4e8c7b17aaf683914d1cfb3cd09cf1805353b00e4efda113c8323a57e63bR125-R151)

## Preview checks
- [ ] With a build that has markers (for example "ENG Knight/Longbow (King's Palace)"), scroll the Results column to the last chart: the Markers control stays pinned at the top of the column, opaque over the charts. Then Tab from a marker button to the next chart's drag handle: the handle shows fully below the control, not under it.

## Reviewer guide
Reviewable change: +38/-2 LoC (excluded: the acceptance spec, the unit test, the doc paragraph)
- [`components/apps/aoe4-build-order/use-marker-control-height.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-948fa4ad6bd782e6cf652d51fc4e67ba88f097740e381a2343bae675b6e20f1e) - new hook: a ResizeObserver writes the control's height to `--aoe4-marker-control-height` and removes it on unmount or when the control has no kinds. Verify the cleanup path, so a run without markers leaves no padding.
- [`components/apps/aoe4-build-order/results.module.css`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-9f2b00002aa1aeb652e168f76488feb98f9f333bef923d3d8f28b1cc7904d596) - new `.markerControl` class: sticky top 0, z-index 5 (above chart content, below the annotation popover at 1080 and the modal help dialog), opaque background, bottom padding in place of the old margin. The shared `.legend` class is untouched, so the series and pinned legends still scroll.
- [`components/apps/aoe4-build-order/workbench.module.css`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-6b0f7f80fc6f1e2c49c64fa638b0bfca12c30d9e945da107d700cd591c53e678) and [`workbench-columns.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-cf4e59f3404faf67dff8dd38900bd031639aada946273ea38e005a01b1a49cf2) - `.resultsColumn` adds `scroll-padding-top` from the variable (0 when unset) to the Results column only; the shared `.column` rule, which the Build column also uses, is unchanged.
- [`components/apps/aoe4-build-order/chart-legend.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/213/files#diff-ce3b1cfdc2e4edaa30b414bc06ed1ec480e0d3fd126b093ffbd1832baeab48fe) - `MarkerControl` takes a ref, calls the hook, swaps the `!important` `mb-3` utility for the new class.

## Invariants and scope
Invariants touched: none. No engine, data or API change; marker semantics, tab order and the legends' placement are unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #213
