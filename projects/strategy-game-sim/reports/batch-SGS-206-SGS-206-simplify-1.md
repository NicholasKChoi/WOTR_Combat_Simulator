# Simplify pass, batch SGS-206

Branch sgs-206-chart-table-hover-and-drag. Old tip 578c17a, new tip 6b14c0d7c48c2147d88b30695cd6375a28503665. Nothing pushed.

## Change (one commit)
- use-chart-drag.ts: removed `INDICATOR_HEIGHT_PX = 2` and the `- INDICATOR_HEIGHT_PX / 2` offset.
- results.module.css: `.dropIndicator` gets `transform: translateY(-50%)`, so the CSS owns the 2px height and the centering. The rendered box is the same; the acceptance spec reads bounding rects, not `style.top`.

## Reviewed, left as is
- dropSlotAt / chart-drag.ts, the drag hook's refs, results.tsx wrapper, header CSS, docs: no reuse or simplification win found; comments already meet the bar.

## Tests
`npm test` passed (2872 passed, 15 skipped) and `npx tsc --noEmit` was clean. No browser or acceptance tests were run, so the CSS-transform centering is not browser-verified.
