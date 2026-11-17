# SGS-196 review 1

Verdict: APPROVE. Branch sgs-196-chart-window-math, tip 7364631ff491489f3e01599afac930da4da88606, base origin/main.

## Blocking findings
None.

## Spec gaps
None.

## Acceptance criteria
- zoomTo (29/30 s, order, clamp before span, full game incl. from clamping): pass. chart-zoom.ts:15-17; table rows cover each.
- clampWindow (null, short span, from at/past end, full game, to capped): pass. chart-zoom.ts:19-21; a from past end gives a negative span, so null.
- panWindow (span kept at both edges, rounding): pass. chart-zoom.ts:23-27; both edge rows assert the span.
- panStepSeconds (Math.round, floor 1, spans 0 and 1): pass. A 31 s span gives 16, so truncation fails it.
- timeAtX (left, middle, right, outside clamped): pass.
- rowsInWindow (both edge rows, no extra row on an exact edge, between two rows, before all, after all, empty, order): pass. Traced `before` and `after`; the filter keeps ascending order.
- ChartZoomBar markup, order, names, text: pass.
- aria-disabled at edges, never `disabled`: pass.
- Typecheck passes; the diff holds only the four new files: pass (`git diff --stat` lists exactly four files; `tsc --noEmit` and `lint:dup` clean, 0 clones).
- No INVARIANTS regressions: none touched; nothing imports the new files.

## Invariants touched
None apply (ticket: none).

## Linter
`npx tsc --noEmit && npm run lint:dup`: zero issues. I did not run next build or tests; I relied on the implementer's record (the gate runs no tests).

## Bot reconciliation
No reviewBot configured.

## Non-blocking notes
- chart-zoom-bar.tsx:27,37: the pan onClick guards (`!atStart && onPan(...)`) go beyond the ticket, which leaves the no-op-when-disabled rule to the drag-select acceptance spec. The guard is harmless and matches the spec's intent. The static-render test cannot exercise it.
- chart-zoom.ts:30-32: timeAtX returns `shown.from` for `plot.width <= 0`; the ticket is silent and the test covers it.
- The implementer did not mutation-check the 30 s threshold; the 29/30 table rows would fail it.
- Siblings compared: chart-legend.tsx:20-29 (button classes, data-testid style) and chart-legend.test.ts (it.each). Both are consistent.

## Coverage
Reviewed all four files in full and the ticket. UI inspection skipped: the component is not rendered anywhere yet (nothing imports it) and the diff changes no visible UI. Doc claims: none added, no comments in the diff.
