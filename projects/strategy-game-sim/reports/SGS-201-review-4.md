# SGS-201 review 4

Branch `sgs-201-series-legend-aria-pressed`, tip bce76f4b3d9796cbd9adc50ea7131065d0b61ac7, base origin/main. Full review (not delta).

Verdict: APPROVE

## Blocking findings
none

## Spec gaps
none

## Acceptance criteria
1. Unit test over rendered SeriesLegend: pass. `chart-legend.test.ts` "SeriesLegend markup" reads every item's pressed value and style in one render (all shown; then `b` and `p` hidden, `p` being the pinned-only key). It fails if the value is inverted. I ran it: 45 passed across chart-legend and line-chart tests.
2. Live-page check: pass by reading. `aoe4-build-order-pin-compare.spec.ts` asserts all items true (total > 1), clicks `food`, then asserts the item is false, exactly 1 false, total-1 true, and opacity 0.5. It clicks again and asserts true, total true, and opacity 1. Not run (acceptance is not a review-gate run).
3. Series legend and marker control agree: pass. Second unit test compares the two controls' pressed value shown and hidden, and the first test pins absolute values, so a both-inverted regression is also caught.
4. No sighted change: pass. The diff leaves style, `onToggle`, testids and swatch untouched, and the existing opacity assertions are unchanged.
5. Existing tests: pass. Only tests pinning the inverted value changed: line-chart.test (false to true), pin-compare, chart-layout (2 checks), chart-views (2 checks), units-chart-upgrade-dots. help-modal is an equality snapshot and is unchanged. A grep of `chart-series-legend-item` and `aria-pressed` found no unflipped reader (zoom spec does not read pressed).
6. Docs: pass. The sentence in `docs/aoe4-build-order-ui.md` matches `chart-legend.tsx:27` (series) and `:85` (marker), and the earlier clause about hiding and dimming survives.
7. INVARIANTS: A1 to A3 not touched.

## Lint
`tsc --noEmit` clean; `lint:dup` 0 clones.

## Bug-type record
The implementer's report records that reverting the fix fails all three unit tests on the pressed-value assertions, so the base fails on the assertion naming the bug.

## Bot reconciliation
No reviewBot configured.

## Non-blocking notes
- The regression record came from reverting the fix in the task checkout rather than a separate base checkout; the evidence is equivalent.
- UI inspection not run: no visual change (one ARIA attribute), and the unit and acceptance tests cover the attribute and the opacity.

## Coverage
Reviewed the full diff (7 files), chart-legend.tsx MarkerControl siblings, and greps over acceptance/ and components/. Browser acceptance not run, per the gate rules.
