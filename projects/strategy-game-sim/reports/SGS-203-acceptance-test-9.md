# SGS-203 acceptance-test 9

Verdict: PASS. Tip 85508a7fb229b315ab9cc6e9a45b2a7f4a73b424. No tests added, nothing committed (checkout clean, no new SHA).

## Run
Harness ran (Playwright, Chromium, `acceptanceSetup` run first). Specs run: `aoe4-marker-control-sticky`, `aoe4-marker-labels`, `aoe4-legend-pressed-state`, `aoe4-chart-layout`, `aoe4-split-scroll`, `aoe4-chart-views`, `aoe4-results-split`: 82 passed, 0 failed (51 s).

## Coverage of the criteria (implementer's `acceptance/aoe4-marker-control-sticky.spec.ts`, 5 tests)
- Pinned at column top at 3 scroll positions plus bottom, bottom within column, first chart header not covered at scrollTop 0: test 1.
- Hover labels the kind on the last chart; click hides and click restores its lines; `aria-pressed` follows: test 2.
- Drag handle focused below the control clears it (handle starts above column top, asserted first), also with the control wrapped taller: test 3.
- `elementFromPoint` returns the control over a plot beneath it, opaque background: test 4.
- No markers: no control, Results `scroll-padding-top` is 0, Build column never has padding, padding is >20 px with markers: test 5.
- Not covered by acceptance: "only the marker control sticks" (series/pinned legends scroll away), covered by the unit test per the manager; the dimmed-state-on-control and docs criteria are not asserted at the boundary. No uncovered criterion could be added as a test that can fail, so none added.

## Mutation checks (each undone with `git checkout -- components`, `git diff --exit-code` clean after each)
- `results.module.css:34` drop `position: sticky`: test 1 fails (`:86`, pinned at 518), test 2 fails (`:110`), test 4 fails (`:162`).
- `results.module.css:36` drop `z-index`: test 4 fails (`:162`, the onTop element of the tuple).
- `results.module.css:37` drop `background`: test 4 fails (`:162`, the opaque element).
- `results.module.css:38` `padding-bottom: 100rem` (control taller than column): test 1 `:86` (bottom within column), test 2 `:110`, test 3 and 4 fail.
- `results.module.css` `margin-bottom: -3rem`: test 1 fails at `:94` (first chart header covered at scrollTop 0).
- `workbench.module.css:45` `scroll-padding-top: 0px`: test 3 fails at `:145` (one-line case, received -74.17), test 5 fails at `:169` (padding > 20).
- `use-marker-control-height.ts:12` ResizeObserver callback emptied: test 3 fails at `:150` (wrapped case, received -90.73); the one-line case at `:145` still passes, so the claimed wrapped case has its own check.
- `use-marker-control-height.ts:16` drop `removeProperty` cleanup: test 5 fails at `:175` (Results padding non-zero after markers go).
- `chart-legend.tsx:77` always render control: test 5 fails at `:174` (control count 1, expected 0).
- `workbench.module.css` extra rule giving build-column 40 px only when no control present: test 5 fails at `:176`; same rule unconditional fails `:170`.
- `chart-markers.ts:90` `labelKindOf` returns null on hover: test 2 fails at `:114` (labels on last chart wrong).
- `line-chart.tsx:108` draw all markers ignoring hidden: test 2 fails at `:119`.
- `line-chart.tsx:108` hiding sticks after first toggle: test 2 fails at `:122` (restore).
- `line-chart.tsx:108` drop first marker: test 2 fails at `:111` (initial count).
- `chart-rows.ts:146` toggle only adds: test 2 fails at `:121` (aria-pressed 'true' after second click).
- `chart-legend.tsx:89` `aria-pressed` always true: test 2 fails at `:118`.
- Each scroll position of test 1 (max/3, 2max/3, bottom) shares one assertion; only the first position was seen to fail under the sticky break (reported failing at 518), the others were not isolated.

## Failures
None.

## Criteria not expressible
None beyond the unit-covered legend criterion and the dim/docs criteria noted above.
