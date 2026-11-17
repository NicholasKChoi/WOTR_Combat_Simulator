# SGS-198 spec gate, round 1

**Verdict: NEEDS_SPEC**

Read at origin/main plus the design (M11.md C13, C16, C16a, B-U1..B-U9). SGS-191 and SGS-197 are not integrated, so the ticket's claims about their end state (`lineName`, `ChartMarker.unit`, tbody `SeriesChart`, `shown`, `markerLabel` in `chart-markers.ts`) could not be checked and are taken from their tickets and the design. The ticket matches the design text closely (names, radii, draw order, B-U rows). Base facts checked: `unitSeries` is used only by `result-series.ts`, `results.tsx` and `result-series.test.ts`; the `pin-compare` spec lines 75-79 loop over `unitId`; the Units view does not use `offsetLines` (only Buildings does), so dot y needs no offset.

## Gaps

1. **Acceptance criteria (Current dots, Overlap, Pinned dots) - server-render tests cannot observe dots - the implementer would guess or write an assertion that cannot fail.**
   Several criteria name "a `SeriesChart` server-render test" as the proof for: several upgrades of one line giving several dots, two upgrades at one instant giving two dots at one point, the pinned dot preceding the current dot in DOM order (B-U9), and the per-run rule (B-U3).
   I rendered a recharts 3.10.1 `ResponsiveContainer` > `LineChart` with a `Line` (carrying `data-series`) and a `ReferenceDot` through `renderToString`. The output was 139 characters and contained neither the line nor the dot, because the container has no measured size on the server. The existing `line-chart.test.ts` likewise asserts only the wrapper, title and legend, never any chart SVG.
   Proposed fix: make the dot rules testable without a browser. Put the decision in a pure function, for example `visibleUpgradeDots(dots, series, window)` in `result-series.ts` or `chart-rows.ts`. It returns the dots to draw, each with its series key, `at` and y (via `valueAt`), dropping dots whose key is not in the drawn series (per run) and dots outside `[from, to]`, and keeping same-instant duplicates. Unit-test that for: several dots on one line, two at the same instant (two entries, equal `at` and y), a stale key, a pinned-only line, and window edges. Keep the DOM-order and radius checks (B-U9) and the real-DOM checks in the acceptance spec only (pin the same build and show it again), and drop "or `SeriesChart` server-render test" from those criteria.

2. **Acceptance criteria (Pinned dots, last clause) - the per-run rule has no workable test - proof is deferred to "a `SeriesChart` or series-level unit test".**
   `unitUpgradeDots` already drops markers with no line, so the stale-key path exists only inside `SeriesChart`. It is unreachable from the page, and server render cannot see it (gap 1). Same fix as gap 1: the extracted pure function is the testable seam. State in Scope which function owns the rule.

3. **Docs - a doc made untrue is left stale on main - `docs/aoe4-build-order-ui.md` row "Units produced (Units view)" (line 114).**
   After this ticket the row (each `unitsProduced` `unitId` is a series named `<name> (tier <tier>)`) is false. The ticket defers it to SGS-200. The design assigned docs to M11.7, but the gate rule is that a stale doc left for later is a gap.
   Proposed fix: change just that row here to say that each `baseId` is one series named by `lineName`, with the summed counts. SGS-200 keeps the dot description and the rest. Alternatively, record this as an owner-accepted exception in the ticket.

## Notes (non-blocking)

- Unverified assumptions text is inaccurate about recharts 3.10.1. `ReferenceDot` forwards SVG props, including `data-*`, to the inner `Dot` (`svgPropertiesAndEvents`), but its `children` render as a sibling of the circle inside the wrapping `<g>`, not on the circle. So a `<title>` child is a sibling `<title>` in the same `<g>`, not a child of the element carrying `data-testid`. No criterion checks the title text, so add one (title text equals `markerLabel` form and `<label> (pinned) <m:ss>`) read from the `<g>`, or relax the assumption wording. Also note that `ReferenceDot` wraps in `ZIndexLayer` (default zIndex scatter). The ticket's DOM-order claim (pinned before current) relies on render order within one z-layer, so name this as an assumption verified by the acceptance spec.
- `ReferenceDot` defaults to `ifOverflow: 'discard'`, so a dot outside the y domain or x domain is dropped by recharts itself. This is consistent with B-U8, but the explicit window filter is still needed for the "not in the DOM" test. Say that the dot's explicit `ifOverflow` is the implementer's choice.
- Criterion "legend item names equal the `lineName`s in `unitsProduced`" should say de-duplicated per `baseId`, in order of first appearance. Otherwise a tier-2 and tier-3 entry give duplicate names.
- Existing tests: the other acceptance specs that touch `chart-units-produced` (m4-flow, step-band, results-split, split-scroll, inline-issues) only check visibility. `aoe4-chart-views.spec.ts` Buildings cases count `path[data-series]`, and dots are not paths, so they are unaffected. Only `result-series.test.ts` (names `Spearman (tier N)`, `unitSeries` imports) and `pin-compare.spec.ts` lines 75-79 depend on the change, and both are covered by the Scope rule.
- Risk `standard`, size (about 130 lines), dependencies, On merge `none`, Invariants, Diagrams and Open questions are fine.
