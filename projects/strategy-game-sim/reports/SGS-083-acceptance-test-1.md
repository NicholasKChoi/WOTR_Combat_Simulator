# SGS-083 acceptance-test 1

Verdict: PASS. Tip: see commit below (spec added on top of b43d72a). Harness ran: Playwright, Chromium, own next dev; 9/9 passed.

## Tests (acceptance/aoe4-build-order-step-band.spec.ts, 1280x800)
1. No band before any hover.
2. Hover a completed step and an in-progress step: exactly one chart-step-band per chart (4), data-from/to equal startedAt and completedAt (or durationSeconds) from the simulate response; non-zero height, fill set.
3. Pointer off the row removes all bands.
4. Focus a row shows the band, Tab moves it to the next row's span, blur removes it.
5. Zero-length step (pasted build with `pause`, instant): one band per chart, from === to, height > 0, visibility visible, stroke set.
6. Geometry (single evaluate): Age up step; band right edge within 1 px of the age-up chart-marker x, band inside .recharts-cartesian-grid extent, on all four charts.
7. Rows with no start (waiting and not-reached, pasted build): hover marks the row active, no band.
8. Active style: first td computed box-shadow differs from pre-hover, on a completed row and on a flagged (waiting) row.
9. New Run via keyboard (focus Run, Enter) while the pointer stays on the row (:hover still true): no band, no data-active.

## Mutation checks (each reverted by git checkout; tree clean after)
- ReferenceLine branch disabled: 1 failed (zero-length test).
- Active step not tied to result: 1 failed (reset test).
- table-active class removed: 1 failed (active style).
- onBlur removed / onFocus removed / onPointerLeave removed: 1 failed each.
- in-progress span uses completedAt: 1 failed.
- no-start row returns {0,0}: 1 failed.
- band x2 scaled by 0.9: 1 failed (geometry).
- last chart given highlight null: 6 failed.
- data-active removed: 3 failed.

## Checks
tsc --noEmit clean; lint:dup 0 clones on the tree with the spec. Browser criteria ticked in the ticket (7 of the 8 browser items; the final tsc/dup/npm test/acceptance item left for the suite gate).

## Failures / gaps
None. Note: Run was triggered by focusing the Run button and pressing Enter; this blurs nothing because no row held focus.
