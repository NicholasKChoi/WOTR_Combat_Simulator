# SGS-203 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-203-marker-control-stays-in-view.md (lint clean)

Summary: Bug, component aoe4-build-order, Milestone none, Priority medium, Risk standard, about 30 business-logic lines, no dependencies. Cause: `MarkerControl` (chart-legend.tsx, rendered in results.tsx) is a plain block above `chart-table` inside the self-scrolling `results-column`; `.legend` in results.module.css has no sticky positioning, so it scrolls out of view. Fix scoped as sticky at the top of the Results column with an opaque background, a z-order above chart content and below the run bar, and a measured scroll-padding (like `useRunBarHeight`) so focused chart controls are not hidden under it. Criteria cover: control visible with the last chart in view; hover and toggle work on a non-first chart; no overlap at scrollTop 0; focus clearance (fails if padding removed); wrapped-height case; stacking and dimming; no strip when no markers; doc update to docs/aoe4-build-order-ui.md "Marker control" paragraph. Regression is a Playwright spec (CSS-only behavior, so unit tests cannot discriminate); it fails at base.

Diagrams: none (single-component, no control loop).

Open questions: none. Interpretation noted in Context: the only zoom bar at base is per chart (`ChartZoomBar`, shown only while zoomed), so "with the zoom bar" was read as "at the top of the charts"; per-chart zoom bars are left with their charts and are out of scope. If the owner wants a shared zoom bar, that is a separate feature.

Overlap: none with open tickets (the other items in this batch were not read). Possible existing-test impact flagged in Scope: acceptance specs that scroll or focus within `results-column` (aoe4-chart-layout keyboard-reorder, aoe4-split-scroll).

No scratch checkout made; no criteria ran a command.
