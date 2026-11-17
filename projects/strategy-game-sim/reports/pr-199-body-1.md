## Summary
Adds the pure time-window math for the AoE4 build-order charts (`zoomTo`, `clampWindow`, `panWindow`, `panStepSeconds`, `timeAtX`, `rowsInWindow`) and a `ChartZoomBar` component (range label, pan earlier/later, reset). Nothing imports them yet, so no behavior changes until a later change wires them into the charts. A drag shorter than 30 s or covering the whole game yields no zoom; pan keeps the span and stops at the game edges; `rowsInWindow` keeps one row on each side of the window so lines reach the plot edges. Non-goals: chart wiring, drag handling.

## Merge risk
**low** - new files only, no importer, no public surface or critical-path symbol touched; a revert removes them.

## Review focus
- [`components/apps/aoe4-build-order/chart-zoom.ts:40-45`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-6ba97bf41cd6680c17c37a79385c89eabd39bb2297de2b6dd4d1d875c1becfa7R40-R45) - a wrong edge-row choice draws lines that stop short of the plot edge or drop a point - check the before/after row logic when the window starts or ends exactly on a row - pinned by [`chart-zoom.test.ts`: rowsInWindow](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-a34511a6e39a589755787b5f1966ca7879f5b731cc0c92086cf38dd807cbb624R81-R103)
- [`components/apps/aoe4-build-order/chart-zoom.ts:25-29`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-6ba97bf41cd6680c17c37a79385c89eabd39bb2297de2b6dd4d1d875c1becfa7R25-R29) - a pan past an edge could shrink the span or leave the game - check the clamp keeps the span - pinned by [`chart-zoom.test.ts`: panWindow](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-a34511a6e39a589755787b5f1966ca7879f5b731cc0c92086cf38dd807cbb624R38-R49)

## Reviewer guide
Reviewable change: +93/-0 LoC (unit tests excluded)
- [`components/apps/aoe4-build-order/chart-zoom.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-6ba97bf41cd6680c17c37a79385c89eabd39bb2297de2b6dd4d1d875c1becfa7) - window math; verify the 30 s minimum and full-game cases return null
- [`components/apps/aoe4-build-order/chart-zoom-bar.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199/files#diff-f8af8b3e2559b18a72a2b55a78ba9b51a8b6044c8bda95ff61c889c005ed1682) - edge pan buttons use aria-disabled (stay focusable), not disabled

## Invariants and scope
Invariants touched: none

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #199
