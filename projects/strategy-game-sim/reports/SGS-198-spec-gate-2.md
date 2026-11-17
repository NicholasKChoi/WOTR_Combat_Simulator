# SGS-198 spec gate, round 2

**Verdict: READY**

Read at origin/main plus design/M11.md (C13, C16, C16a, B-U1..B-U9, M11.2 row) and the SGS-191 ticket. SGS-191 and SGS-197 are not integrated, so their end state is taken from their tickets and the design.

All three round-1 gaps are closed:
- The dot rules now live in the pure `visibleUpgradeDots`, which has its own unit-test criterion covering several dots, same-instant dots, a stale key, a pinned-only line, a hidden key, window edges and a between-samples value. DOM order, radius and title checks sit in the acceptance spec only.
- The per-run stale-key rule has one named owner, `visibleUpgradeDots`.
- The "Units produced (Units view)" docs row (docs/aoe4-build-order-ui.md line 114) is rewritten in this ticket and has a criterion. No other row or sentence in that doc names per-tier series.

Base facts verified:
- `unitSeries` in `result-series.ts` is used only by `results.tsx` (as a type) and `result-series.test.ts`. The acceptance contract spec's `unitSeries` is a local variable, and the engine's `unitSeries` is a different function.
- The Units chart does not use `offsetLines`, and Lines are the default linear type, so linear `valueAt` matches the drawn path.
- `isLineHidden`, `pinnedKey`, `pinnedColor`, `seriesColor`, `PinnedSeries` and `markerLabel` exist as the ticket describes. `markerLabel` currently lives in `chart-rows.ts` and moves to `chart-markers.ts` under SGS-195.
- Names match design C13, C16 and C16a. On merge is well-formed. Risk `standard` is right: no criticalPath symbol is touched. Invariants, Diagrams and Open questions are fine.
- The existing-test rule covers `result-series.test.ts` and the `pin-compare` spec's `unitId` loop. `aoe4-chart-views` keeps its assertions.

## Notes (non-blocking)

- `pinnedColor(series, key, pinnedIndex)` needs the pinned series' index. The ticket says only "`pinnedColor`". The implementer can take it from the key's position in `pinned.series`, but one phrase would remove the guess.
- The `valueAt` criterion does not name a test file. The design says `chart-rows.test.ts`.
- "Delete `unitSeries`" is under the `result-series.ts` bullet. The engine has an unrelated `unitSeries` in `lib/aoe4-build-order/simulate.ts`, which must stay. Adding "(the UI one)" would avoid a mistake.
- Known overlap, not a SGS-198 gap: SGS-200's Scope still rewrites the same docs row.
