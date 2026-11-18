# SGS-206 spec gate (report 6)

Verdict: READY

Read at origin/main (fetched; main is now 0866156). No dependencies. Re-spec 2 closed both gaps of report 4: the drop slot is a pure function in `chart-drag.ts` that `onUp` and the indicator both call, with a table test; the no-tint criterion now Tab-focuses the handle and then drags it, with the observed "no `:hover` while the handle holds capture" assumption; plus the 1.1:1 floor, the `page-help.tsx` wording, fresh-page mouse-click setups and the SGS-203 stacking note.

## Checked

- Grounding: `use-chart-drag.ts` (`targetIndex`, `finish`, `onMove`, `onUp`, `sectionRef`), `chart-drag.ts` (`DRAG_THRESHOLD_PX`, `dropIndexAt`), `chart-header.tsx` (`ChartControls` with `dragging` and the other fields, `ChartHeaderRow`, `chart-drag-handle`), `line-chart.tsx` (`tbody` with `data-dragging`, `chartGroup`), `results.tsx` (`chart-table` at line 116), `results.module.css` (`.chartGroup[data-dragging='true']` opacity 0.6), `chart-header.module.css` (no row background today, so the tint is new). The Chart controls and Chart table paragraphs and the quoted "dims the moved chart's rows" sentence exist in `docs/aoe4-build-order-ui.md` (the sentence wraps across a line; the quote is accurate).
- Optional `ChartControls` fields keep the existing literals compiling. No stale statement about hover or drag elsewhere that Scope misses.
- Criteria are observable. Each acceptance case fails at the base (no tint, no indicator, no transform), and none is a search over code. No pinned counts or stale lists; the 1.1:1 and 4.5:1 floors are rules.
- Open questions none; Decisions and Invariants (A1 to A3 not adjacent) fine; Contracts: no new cross-ticket names; On merge `none`; Diagrams not triggered (single component, no control loop); Input validation not applicable; Risk `standard` right (no `criticalPaths` symbol, no trigger); LOC about 120.
- No throwaway overlap: SGS-203 (sticky marker control) and SGS-204 (Units chart dots) touch other areas; the ticket states the paint-order overlap and has the implementer check and report it.
- Unverified assumptions cover the Chromium behaviors the tests rely on (transform on `tbody`, `:hover` during capture, `:focus-visible` heuristic, `:has()`).
- Feasibility of the contrast pair: Bootstrap grey `btn-outline-secondary` text (#6c757d) falls below 4.5:1 on a tint of at least 1.1:1 over white, which the ticket already handles with scoped opaque button backgrounds.

## Notes (non-blocking)

- The slot function returns the boundary in viewport coordinates (it takes `getBoundingClientRect` values); the indicator is positioned inside the new `position: relative` wrapper, so the hook converts by the wrapper's top. The indicator-position acceptance criterion catches a miss, so no spec change is needed.
- The `ChartControls.dragging` flag is today true for the whole drag session start (set after the threshold); the new offset and drop-index fields can ride beside it, but the implementer should keep `data-dragging` driven by the same threshold, as the "no `data-dragging` before the threshold" criterion requires.
- Scratch checkout not needed; none made. No process started.
