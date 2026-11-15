# SGS-165 review 1 - APPROVE

Tip 8330189 (Docs ticket). Diff: only docs/aoe4-build-order.md, one sentence added at ~line 1075.

Doc claim check: "an index past the last palette color wraps around to the start, so colors then repeat, as they do for current series."
- pinnedColor (chart-rows.ts:109-112) passes series.length + pinnedIndex to seriesColor, which returns PALETTE[index % PALETTE.length] (line 105). Wraps: true.
- Current series use seriesColor(i) (line 126): wrap applies: true.
- Existing statement (current-series count + pinned index) matches code line 111.

Acceptance:
- Wrap stated, matches pinnedColor/seriesColor: pass.
- No palette length or color count quoted in the doc (grep for palette/color: only line 1074-1075 states the palette rule; others are step-kind colors, unrelated): pass.
- Only docs/aoe4-build-order.md changed: pass.
- INVARIANTS: none touched, no code change: pass.

Lint/bot/UI: not applicable (docs only). No blocking findings.
Non-blocking note: the paragraph's line is long (hard-wrap style already inconsistent in that line before the diff); not worth a change.
