# SGS-167 implementer report 1

- Ticket: SGS-167. Branch: sgs-167-linendys-to-helpers. Tip: 8b017ef6a485ffdff5f3c379939ca168ab4e804c (base origin/main).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-167-linendys-to-helpers
- Status: needs_review

## Files touched
- acceptance/helpers.ts: exports `Layout`, `readLayout(root, selectors)` (rect, path `d`, text of every match per selector, one `evaluate`), and `lineEndYs(page, chartTestId, keys)` (moved, built on `readLayout`).
- acceptance/aoe4-chart-views.spec.ts: local `lineEndYs` and `drawn` removed; imports `lineEndYs`, `readLayout`; `foodPathData` reads current and pinned rate `food` paths in one call.
- acceptance/aoe4-build-order-pin-compare.spec.ts: three sites converted (below); adds `FOOD_PATHS`.
- acceptance/aoe4-gathered-resources.spec.ts: pinned vs current `food` `d` in one read.
- acceptance/aoe4-compact-view.spec.ts: legend bottom vs textarea top in one read.

## Sites changed
1. pin-compare, 1200 s vs 300 s test (was two `boundingBox` calls): one `readLayout` inside `expect.poll` (previously not polled; now polled, same relation `pinned.width > current.width * 2`).
2. pin-compare, poll after the invalid-input recovery: one `readLayout` per poll iteration, same relation `pinned.width < current.width` (also requires one match each).
3. pin-compare, axis label vs tick labels (spec-gate note, lines 421-425): label and ticks in one `readLayout`; tick filter `^\d+$` now applied to the read text; same disjoint assertion; asserts exactly one `.recharts-label` (as `boundingBox` strict mode did).
4. chart-views, view switch: before and after each one read of both food paths (`foodPathData`); not merged across the click; same three `not.toEqual` relations.
5. gathered-resources: `not.toBe` of the two `d` values, one read.
6. compact-view: `legendBottom <= textareaTop`, one read (not under poll, as before).
Checked, left unchanged: aoe4-split-scroll.spec.ts:77 (single `boundingBox` used for a mouse position, not compared); aoe4-step-table.spec.ts (layout reads already in one evaluate); chart-layout drag handle (single read); compact-view `clickLine` (a click point, not a comparison). The local `path`/`line` locators remain in use.

## Tests
- `npx tsc --noEmit`: pass. `npm run lint:dup`: 0 clones. `npx next build`: pass. `npm test`: pass (output tail only showed timing; no failures reported).
- `npm run acceptance` on chart-views, pin-compare, gathered-resources, compact-view: 72 passed, 0 failed (1.7m). The Buildings tests (separate lines, hide-a-line widens gap, pinned at current height) pass unchanged.
- No pre-existing assertions edited in meaning.

## Mutation checks (all undone, confirmed by grep and clean diff)
- helpers.ts `lineEndYs`: `.at(-1)` -> `.at(0)`: the Buildings tests failed (`townCenterEnd not.toBe barracksEnd`, `before toBeGreaterThan(0)`, pinned vs current at the same height).
- pin-compare 1200 s test: `>` -> `<`: failed at the poll's `toBe(true)`.
- gathered-resources: `not.toBe` -> `toBe`: failed at `expect(drawn.pinned[0].d).toBe(drawn.food[0].d)`.
- Not mutation-checked: the compact-view, label-vs-tick, poll-recovery and chart-views food-path conversions (same helper, code path covered by the checks above).

## Doc claims
- helpers.ts comment: "Rect, path `d` and text of every element matching each selector under `root`, all read in one evaluate so a comparison between them cannot span a smooth scroll or chart redraw. Compare values from one call only." True per `readLayout`.
- helpers.ts comment: "The end y of each series' path in a chart, in the order of `keys`; NaN for a series with no path." True per `lineEndYs` (`Number(undefined)`).

## Bug ticket / pinned outputs / codegen
None (chore; no codegen configured).

## Unverified assumptions added
None.

## Notes for the manager
- On merge (REPO.md, state branch): the `acceptance/aoe4-chart-views.spec.ts` exemplar `shows` text cites `lineEndYs`; point it at `lineEndYs` and `readLayout` in `acceptance/helpers.ts`. I did not edit REPO.md. LESSONS.md retire condition ("every spec uses it") is not met: many other specs still do inline single-evaluate reads, which are compliant but do not use the helper.
- Out-of-scope findings: none.
