# SGS-204 implementer 11 (Rework 1)

- Ticket: SGS-204 (Rework 1, after Re-spec 2 and 3)
- Branch: `sgs-204-upgrade-dot-tier-indicator`, tip `d09af46ef1a068b0978c5afd4b0c7420591edea2` (one new commit on top of 1f5ebe0; not rebased, still forked from main 0866156)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-204-upgrade-dot-tier-indicator`
- Own-commit check: skipped. Before the call the checkout had no `origin/sgs-204-upgrade-dot-tier-indicator` ref, and `checkout.sh task` reused it at the same tip (1f5ebe0).

## Required fixes (all ticked in the ticket)

1. Overlap is decided in pixel space. `tierTextSlots(dots, height, bounds)` now takes each dot's pixel position, radius and text width. Each text starts alone beside its dot. When two texts in different groups have boxes that intersect, their groups merge. Each group becomes a stack, one row per text, centred on the mean height of its dots, with the topmost dot's text in the top row. The loop runs until no two boxes intersect. `placeTierText(dot, slot, height, bounds)` places one text from its dot and its group slot. It keeps the right-edge flip and the top/bottom clamp. The new unit test covers two dots a few pixels apart and fails when grouping is by exact point (M3 below).
2. The two-tier acceptance test now asserts `!overlap(line[0].rect, line[1].rect)`. The check runs inside `expect.poll`, reading from a single `readTiers` evaluate. `sameBox` is removed.
3. The pin test now reads rings, dots and both kinds of text in one `readTiers` call, using comma selectors (`${PINNED_TIER}, ${TIER}[data-series=…]` and `${PINNED_DOT}, ${DOT}[data-series=…]`). It splits the result by the `pinned:` series prefix.
4. The docs sentence "at one point stack" is replaced with the overlap rule.
5. The invented-id case was already on the branch at 1f5ebe0 (`upgradeTierName` > "works for an id and unit no data lists": `mighty-widgets` with `widget` gives `Mighty`). It was mutation-checked again (M12).
6. The On merge item is for the manager. Nothing to do here.

## Where pixel positions come from

`UpgradeTierText` (the `ReferenceDot` `label` content) uses three recharts 3.10.1 hooks: `usePlotArea` for the bounds, and `useXAxisScale` / `useYAxisScale` for each dot's pixel point. I read the source:

- `lib/hooks.js` `useXAxisScale`/`useYAxisScale` return `selectAxisScale(state, axis, id, isPanorama).map`.
- `lib/cartesian/ReferenceDot.js` `useCoordinate` maps the dot through the same `selectAxisScale` selectors via `CartesianScaleHelperImpl.map`.
- `lib/util/scale/RechartsScale.js` `map` is an arrow function, so it works unbound. For a numeric axis it returns `d3Scale(input)` with no band offset.

So a text's dot point is the point where `ReferenceDot` draws the dot. The ticket's Unverified assumptions already lists this case ("if the placement takes pixel positions from recharts' plot or scale hooks"), so I added no new assumption. `SeriesChart` passes every drawn dot and ring (`at`, `value`, radius, tier text) to each label. Each label lays out the whole set and draws its own entry, so every text on the chart sees every other one. Text widths still come from `estimateLabelWidth`.

## Files touched (this pass)

- `components/apps/aoe4-build-order/result-series.ts`: `TierTextDot`, the `TierTextSlot` with its stack `centre`, `placeTierText` with a new signature, the new `tierTextSlots` merge loop, and the internal `tierTextBox`, `boxesIntersect` and `groupSlots`.
- `components/apps/aoe4-build-order/upgrade-tier-text.tsx`: lays out all texts from the axis scale hooks. `viewBox` is no longer used.
- `components/apps/aoe4-build-order/line-chart.tsx`: builds the `tierTexts` list (pinned first, then current) and passes `texts`/`index` to each label. The old `dotSlots` is gone.
- `components/apps/aoe4-build-order/result-series.test.ts`: the `tierTextSlots` and `placeTierText` tests are rewritten.
- `acceptance/aoe4-units-chart-upgrade-dots.spec.ts`: the two-tier non-overlap poll, the pin test's single read, and `sameBox` removed.
- `docs/aoe4-build-order-ui.md`: the overlap-rule sentence.

## Tests

- `result-series.test.ts`: 51/51 pass.
- `npm test` (full unit suite): 91 files passed and 1 skipped; 2892 tests passed and 15 skipped.
- `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` alone, after `acceptanceSetup`: 17/17 pass (46.5 s).

Invariants the tests encode:
- Two texts on one chart never intersect, whether their dots share a point, lie a few pixels apart, or would cascade into a third text.
- Every text stays inside the plot, including near the right, top and bottom edges.
- No text covers its own dot's point.
- Texts that would not touch alone stay alone beside their dots.
- A stack's order follows dot height, and it is centred on the dots' mean height.
- Tier names come from the two ids alone.

Pre-existing tests edited: none. Every edit is to tests this branch added at 1f5ebe0.

## Mutation checks

Unit tests: each break was applied by a script to `result-series.ts`, the vitest run was made, and the file was restored. `git status` was clean afterwards and the scratch script was deleted.

| Break | Test / row that failed, assertion line |
|---|---|
| M1 `if (!clash) return slots` → `return slots` (no merging) | all 6 table rows at `result-series.test.ts:220` (pairwise no-intersect), including row "a ring and a dot at one point"; "stacks a group…" at :232 |
| M2 return after the first merge | only row "three texts where moving the first two apart pushes one into the third", pairwise assertion (expected true to be false) |
| M3 merge only dots at one exact `cx`/`cy` (time-and-value grouping) | row "two dots a few pixels apart" at :220, plus the 3-text and edge rows; row "a ring and a dot at one point" passes, as expected |
| M4 `fitsRight = true` | row "near the right edge" at :221 (inside bounds); "flips a text…" (`{x:487,anchor:'start'}` vs `{x:473,anchor:'end'}`) |
| M5a top clamp → 0 | row "near the top edge" at :221; "moves a stack near the top edge" (15 vs 27) |
| M5b bottom clamp → 0 | row "near the bottom edge" at :221; "moves a stack near the bottom edge" (371 vs 359) |
| M6 `gap = 0` | all table rows at :222 (own dot covered); "puts a lone text to the right…"; "flips…" |
| M7 stack order by input index only | "stacks a group with the higher dot text on top…" |
| M8 centre on the first member's `cy` | "stacks a group … around the dots mean height" |
| M9 `boxesIntersect` always true | "leaves texts that would not touch alone beside their own dots" (slots 3 vs 1) |
| M10 `x += cx * 10` | row "two dots a few pixels apart" at :218 (the "would cover each other if placed alone" precondition) |
| M11 every row at `0.5 * height` | "stacks the rows of a group around its centre"; table rows at :220 |
| M12 a known tier-word list before the capitalise | "works for an id and unit no data lists" (`mighty-widgets`) |

The `upgradeTierName` table and the named cases are unchanged from 1f5ebe0, where implementer-5 recorded their mutation checks.

Acceptance spec, same method, run with `-g` on the two changed tests:
- A1: M3 (exact-point grouping). The two-tier test failed at `aoe4-units-chart-upgrade-dots.spec.ts:519`, the `!overlap` poll with the message "the two texts do not cover each other". The pin test passed, as expected, because its dots share a point.
- A2: M1 (no merging). The two-tier test failed at :519, and the pin test failed at :543, the single-read ring/dot non-overlap poll.

In both, the poll's other terms (`tiersMatchDots`, `sharing`) hold on the unmutated branch, and each break moves only text positions. Every break was undone.

## Doc claims

- `docs/aoe4-build-order-ui.md`: "tier texts on one chart (of dots and rings alike) whose boxes would overlap where each sits alone, whether their dots share a point or only lie a few pixels apart, are moved apart into a stack of one row each around their dots' mean height, the higher dot's text on top, and a text or stack stays inside the plot's top and bottom edges."
  - "whose boxes would overlap where each sits alone … moved apart": `tierTextSlots` (alone slots, merge on `boxesIntersect`).
  - "dots and rings alike": `line-chart.tsx` `tierTexts` holds pinned and current dots in one list.
  - "stack of one row each around their dots' mean height, the higher dot's text on top": `groupSlots`, which sorts by `cy` and uses the mean `cy` as `centre`.
  - "stays inside the top and bottom edges": `placeTierText` `shift`.
- Code comments added or changed:
  - `result-series.ts` `TierTextSlot`: "A text's row in its group's stack, and the pixel height the stack is centred on."
  - `placeTierText`: "…a group's texts stack in rows of `height` around its centre, and the stack moves down or up as a whole…"
  - `groupSlots`: "One stack per group, centred on its dots' mean height, with the topmost dot's text in the top row."
  - `tierTextSlots`: "Texts start alone beside their dots; any two in different groups whose boxes intersect merge their groups, until no two boxes intersect."
  - `upgrade-tier-text.tsx`: "Rendered through a ReferenceDot's label prop. Every text on the chart is laid out together, from the axis scales the dots are drawn with, so each text clears the others." This rests on the shared `selectAxisScale`, read above.

## Build, lint, codegen

- codegen: not set.
- `next build`: succeeded.
- lint: `tsc --noEmit` is clean, and `lint:dup` found 0 clones.
- `git diff --stat 0866156`: only the 7 files the ticket names. No tool-made changes.

## Invariant check

- A1 holds: no tier word, unit name or game number was added. The only new values are UI pixel quantities (the row height `fontSize + 2`; the existing gap of 3).
- A2 and A3 are untouched.
- S1 holds: imports stay within the app and recharts.

## Unverified assumptions added

None. The recharts scale-hook assumption is already in the ticket. The unit tests use plain pixel inputs, and only the acceptance spec in Chromium exercises the hooks.

## Out-of-scope findings

None.

## Notes

- Review 6's non-blocking note (`pinnedColor(...)` written twice in the pinned block) is unchanged, since review did not flag it as a required fix.
- If a merged stack were taller than the plot, its rows could not all fit inside the edges. With row height 14 and a 360 px chart, that would take more than about 20 overlapping texts.

## Status

`needs_review`
