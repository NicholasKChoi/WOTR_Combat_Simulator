# SGS-195 review 3

- Branch `sgs-195-marker-control`, delta `d570df7..0d9591b` (two acceptance specs). Verdict: **APPROVE**

## Delta

`git diff d570df7..0d9591b --stat` shows only `acceptance/aoe4-chart-layout.spec.ts` and `acceptance/aoe4-split-scroll.spec.ts`. No production change. The diff removes two lines: the old `scrollIntoView({ block: 'start' })` and the unscoped `h3` query. Nothing else is removed.

## Re-spec 1 criteria

1. **`aoe4-chart-layout` first/last-chart arrow-key tests: pass.**
   - No assertion was removed or loosened. `before.top > 0`, `before.top < before.max`, the `top` and `windowY` equality after the key, `expectLayout`, the empty status, focus on the handle and `stored` being null are all unchanged. The two lines the diff removes are the placement lines only.
   - The placement is now robust. The handle is centred, then `scrollTop` is capped at `max - 40`. The cap only lowers `scrollTop`, so there is always at least 40 px of room below, whatever follows the last chart. A new `toBeInViewport()` check on the handle also holds.
   - I measured it on the branch at 1280x720, the Desktop Chrome default the spec uses:

     | Chart | `scrollTop` | max | clientHeight |
     |---|---|---|---|
     | first (units) | 56 | 1710 | 530 |
     | last (floating) | 1523 | 1710 | 530 |

     Both satisfy `0 < top < max`.
   - The test still fails if the key press scrolls the column or the window, moves a chart, announces, stores a layout, or moves focus. Those assertions are untouched.

2. **`aoe4-split-scroll` heading test: pass.**
   - The query is now `[data-testid="chart-table"] h3`. In the code, `MarkerControl` (`results.tsx:107`, the `Markers` `h3` in `chart-legend.tsx:75`) renders outside the table. The only `h3` inside the table is the chart title in `chart-header.tsx:53`. `compare-heading` is also outside the table.
   - `expect(sizes.charts).toHaveLength(1)` is kept, so the test still fails if two chart titles differ in size. The implementer's mutation check (dropping the scope) failed with `["22.5px","18px"]`, which confirms the scope is what excludes `Markers`.

## Blocking findings

None.

## Notes

- The `windowY` was 245 after centring in my measurement. It is a pre-existing part of the test (it compares before and after the key press) and does not weaken it.
- I ran no acceptance tests. I only measured scroll geometry with a throwaway script and stopped the server afterwards.
- Not re-reviewed, per delta mode: all production code, the unit tests, `aoe4-marker-labels.spec.ts` and the doc edit, which were approved at `d570df7`.
