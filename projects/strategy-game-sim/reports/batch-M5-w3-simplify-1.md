# Simplify, batch M5-w3 (SGS-077)

Branch sgs-077-aoe4-gathered-resources-chart, diff vs origin/main ae2d45f. Tip unchanged: e9a428d.

## Trimmed
Nothing.

## Considered and left
- lib/aoe4-build-order/simulate.ts creditIncome: `drawn[ref] ?? 0` and `unstocked[kind] * seconds` each appear twice (resources and gathered). Hoisting a local saves nothing real and the two-line parallel update reads clearly; left.
- results.tsx: the new SeriesChart repeats the sibling charts' prop pattern; the file uses that convention, no shared helper warranted.
- simulate-series.test.ts: two new tests share a little setup; they check different invariants, left (tests not to be restructured).
- Comments: model.ts "Cumulative resources gathered; starting resources excluded." and the spec's compile-time note each carry a fact the code does not, kept. No narrating comments found.
- Test comment edits in simulate-house-warnings.test.ts and docs are accurate.

## Tests
Not run: no code changed.
