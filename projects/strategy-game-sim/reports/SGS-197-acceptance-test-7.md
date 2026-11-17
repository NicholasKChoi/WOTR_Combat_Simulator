# SGS-197 acceptance-test 7

Branch `sgs-197-chart-zoom-pan`, tip 5156184 (unchanged; no commit made, working tree clean).

## Verdict: PASS

Harness ran: `acceptance:setup` (Chromium) then Playwright on the task checkout.

## Results

- `acceptance/aoe4-chart-zoom.spec.ts`: 30 passed, 0 failed.
- Neighbouring specs (aoe4-chart-layout, chart-readability, chart-views, results-split, split-tab-order, marker-labels, build-order-step-band, build-order-pin-compare, auto-run): 130 passed, 0 failed.

## Tests written

None. The existing zoom spec (written by the implementer, review-approved at this tip) already covers every acceptance criterion through the page boundary:
select, plot box at 1200/1800, zoom-in and Reset, Escape and pointercancel cancel, shown range and Buildings y axis, markers/pinned/legend/step band (including window-edge label and band crossing `shown.from`), pan buttons, Shift+drag, Reset via keyboard, independence, survival (collapse, reorder, view toggle, pin, duration re-clamp), reload and storage, Tab order, dimmed results, listener cleanup incl. collapse mid-drag.
`DRAG_THRESHOLD_PX` sharing is covered by the unchanged layout 4px cases (pass) and the typecheck.

## Mutation checks

Not run by me: I wrote no tests. Review 6 records the implementer's mutations for the four rework tests (press handler on tbody, ArrowDown mapping removed, full-game `end` to `placeMarkers`, `x1={highlight.from}`), each failing on the intended assertion. I did not re-verify them.

## Failures

None.

## Criteria not expressible

None found. I did not independently run lint here (review 6 recorded `tsc` and `lint:dup` clean at this tip; no files changed).
