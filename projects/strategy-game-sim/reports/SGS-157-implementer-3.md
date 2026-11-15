# SGS-157 implementer report (3): rework 1

Status: needs_review
Branch: sgs-157-buildings-chart-overlap, tip 5d970560fb5c83291d6303a14a8b4cd9b8218bb2 (c8cb3b3 + one commit, on e50e074; not rebased, origin/main's new commits touch other files)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-157-buildings-chart-overlap

All four Rework 1 required fixes are ticked in the ticket.

## Files touched (this pass)
- components/apps/aoe4-build-order/chart-rows.ts: new `wholeNumberAxis(rows, hidden)` returns `{ domain: [0, top], ticks }`. `top` is max(1, ceil(highest visible drawn value)). Ticks are whole multiples of `ceil(top / 5)`. A private `seriesKeyOf` strips the `pinned:` prefix and is now shared by `toOffsetChartRows` and `wholeNumberAxis`.
- components/apps/aoe4-build-order/line-chart.tsx: rows are computed once as `chartRows`. With `offsetLines`, `YAxis` gets `domain`/`ticks` from `wholeNumberAxis(chartRows, hidden)` and `allowDecimals={false}` is removed. Without `offsetLines`, both props are `undefined`, so recharts' `resolveDefaultProps` falls back to its defaults (same as before).
- components/apps/aoe4-build-order/chart-rows.test.ts: `wholeNumberAxis` tests.
- acceptance/aoe4-chart-views.spec.ts: `hoverPlot(page, id = RATES)` and `readTooltip(page, id = RATES)`. The Buildings ticks test now asserts a precondition (max count 1) and a largest tick of 2, and it uses the shared helpers (the copied hover code is removed). There is a new test, `Buildings draws two buildings with equal counts as separate lines`.
- docs/aoe4-build-order.md: line 991 was replaced verbatim with the Rework 1 text.

## Tests
- chart-rows.test.ts: 44 passed (6 new: 5 table rows and 1 hidden-series test).
  - Invariants: the axis top is the smallest whole number at or above the highest drawn value, with at least 1 (1.225 gives 2, 0.3 gives 1, 0 gives 1, 3 gives 3, 13.2 gives 14). Ticks are whole, start at 0 and number at most 6 (13.2 gives 0,3,6,9,12). Hidden buildings and their pinned lines do not raise the top.
- `npm test`: 83 files passed (1 skipped), 2566 passed / 15 skipped.
- acceptance/aoe4-chart-views.spec.ts (run because the rework requires acceptance assertions there): 9 passed.
- Pre-existing tests edited: none of the base's tests. Within the file, I reshaped this branch's own Buildings ticks test, as Rework 1 requires (hoverPlot/readTooltip reuse, largest tick 2). Existing `hoverPlot`/`readTooltip` call sites are unchanged; the parameter defaults to RATES.
- Pinned outputs: none. The largest tick of 2 is the value the ticket specifies, not an engine pin.

## Bug regression on base
- Test: `acceptance/aoe4-chart-views.spec.ts` "Buildings draws two buildings with equal counts as separate lines".
- Base: e50e0749ac1b59657daf9d5283a5e67935d90e25. I ran it in the scratch checkout regress-SGS-157 with the spec file copied in: `npx playwright test acceptance/aoe4-chart-views.spec.ts -g 'equal counts as separate lines'`.
- Result: it failed at spec line 194, `expect(townCenterEnd).not.toBe(barracksEnd)`, with "Expected: not 5": both paths end at y=5. The data preconditions (both last counts 1) passed. The scratch checkout was removed.

## Mutation checks (each undone with `git checkout --` on the committed file; the tree is clean)
- chart-rows.ts:89, dropped the `!hidden.has(seriesKeyOf(key))` filter: "ignores hidden buildings..." fails, expected [0,10] to equal [0,2].
- chart-rows.ts:89, `hidden.has(key)` in place of `seriesKeyOf(key)` (pinned line of a hidden key counted): the same test fails, [0,10] vs [0,2].
- chart-rows.ts:92, step forced to 1: the 13.2 row fails on its ticks.
- chart-rows.ts:91, `Math.round` in place of `Math.ceil`: the 1.225 row fails (domain [0,1] vs [0,2]), and so do the 13.2 row and the hidden test.
- line-chart.tsx:162 restored to the tip's `allowDecimals={false}`, together with line-chart.tsx:139 forced to `toChartRows` (one run, both breaks applied together):
  - the ticks test failed on `expect(Math.max(...tickValues)).toBe(2)`: Expected 2, Received 4;
  - the separate-lines test failed on `not.toBe`: "Expected: not 245", meaning both paths ended at the same y.
  - I did not run the two breaks separately. The review independently measured largest tick 4 at the tip.

## Doc claims
- docs/aoe4-build-order.md:991 is the Rework 1 text verbatim. Each claim and the code behind it:
  - "at or a small amount above ... none for the first ... always below half a building": `lineOffsets` (i*0.45/n; slot 0 gets 0).
  - "the same at every time": `toOffsetChartRows` adds one offset per key.
  - "y axis shows whole numbers only": `wholeNumberAxis` ticks are integer multiples of an integer step.
  - "tooltip shows each building's true count": `trueCountFormatter` → `trueCount`.
  - "pinned ... same offset": `seriesKeyOf` in `toOffsetChartRows`.
  - "hidden ... takes no offset": `offsetSlotKeys` filter.
- chart-rows.ts comment on `wholeNumberAxis`: "The top is the smallest whole number at or above the highest visible drawn value (at least 1). Ticks are whole multiples of a step chosen so there are at most MAX_Y_TICK_STEPS steps; the top itself may fall between ticks." This matches `wholeNumberAxis`: `Math.max(1, Math.ceil(...))`, `step = ceil(top / MAX_Y_TICK_STEPS)`, and `floor(top/step)+1` ticks.

## Codegen / build / lint
- codegen: not set.
- `next build`: passes.
- `tsc --noEmit`: clean.
- `lint:dup`: 0 clones.
- `git diff --stat e50e074` lists only the six ticket files. No tool-made changes. No processes or listeners left running.

## Invariant check
A1-A3 are upheld. The change is display-only: no simulation, data or randomness is involved, and the axis is a pure function of the rows.

## Unverified assumptions added
None. The new reliance on recharts `YAxis` honoring explicit `domain`/`ticks`, and treating `undefined` props as defaults (`node_modules/recharts/lib/util/resolveDefaultProps.js`), is exercised by the real acceptance run, not faked. The ticket's `allowDecimals={false}` assumption no longer applies to the code.

## Out-of-scope findings
- The pre-existing overlap of the `0:00` x tick label with the `0` y tick label (from review notes) is not touched here.
