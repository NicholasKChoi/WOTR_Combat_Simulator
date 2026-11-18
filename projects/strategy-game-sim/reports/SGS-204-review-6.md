# SGS-204 review 6

Verdict: **NEEDS_SPEC**. The ticket is typed Chore, but it adds text the owner can see on the chart. The diff also has three blocking findings (one correctness, one test, one convention). They should be fixed in the rework that follows the re-spec.

Branch `sgs-204-upgrade-dot-tier-indicator`, tip 1f5ebe0, base `origin/main`. Full review, not delta mode.

## Spec gaps (NEEDS_SPEC)

1. **Type is Chore, but the change is visible to the owner.** The review rule for a Chore is that no behavior the owner sees changes. When a change cannot be made without that, the rule says NEEDS_SPEC: it is not a Chore. This ticket's whole purpose is new visible text beside each dot, so the type cannot be right. The ticket's own "The type is Chore as assigned" does not change that. A Chore is also the type that skips acceptance-test, so the five new acceptance cases were written and run only by the implementer. Nobody independent has authored or checked them.
   - **Who decides:** the manager, with a ticket re-spec. Either re-type it as a Feature, so acceptance-test owns and runs the spec cases, or the owner records that this Chore may change visible behavior.
   - **Placement rule:** the re-spec should also state the rule for dots that are close together but not at the same point (finding 1 below). As written, the rule covers only "dots that share a point", and that gap is where the defect came from.

## Blocking findings

1. `components/apps/aoe4-build-order/result-series.ts:57-66` (`tierTextSlots`) and `upgrade-tier-text.tsx:22-25` - correctness
   - **What:** tier texts of two dots that are close on the plot overlap and cannot be read. `tierTextSlots` groups dots only by exact data point (`at:value`). Two upgrades researched one after another land a few seconds and one unit-count apart, so they get separate slots of size 1. Both texts are then placed right of their own dot at almost the same pixels.
   - **Evidence:** UI inspection at 1280 px, "ENG Spear/Longbow into MAA/Crossbow" build with `research early-men-at-arms` and `research men-at-arms` inserted before `research steeled-arrow`. This is the exact state of criterion 4 and of the spec's two-tier case.
     - `Early` box: x 1110-1137, y 662-675.
     - `Upgrade` box: x 1116-1162, y 658-671.
     - The two boxes overlap. In the screenshot (`w1280-maa-two-tiers.png`) the texts render on top of each other as "EUpgrade".
   - **Why it matters:** the case this ticket exists for (telling two tiers on one line apart) shows unreadable text.
   - **Direction:** decide overlap in pixel space, not by exact data equality. For example, group or stack dots whose estimated text boxes would intersect. One way is a placement step in `SeriesChart` that has the x/y scale (the plot box and window are already known there). Another is a slot pass over the dots' pixel positions. The ticket lets the placement function take "whatever shape the implementer needs". Then:
     - add a unit test where two dots are a few pixels apart and must get text boxes that do not overlap;
     - update the docs sentence "texts of dots and rings at one point stack at different heights" to state the new rule.

2. `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (two-tier test, `expect(sameBox(line[0].rect, line[1].rect), 'the two texts do not cover each other').toBe(false)`) - test
   - **What:** the message claims the texts do not cover each other, but the check only rejects boxes that are identical to within 0.5 px. It passes today on texts that overlap (see finding 1).
   - **Direction:** assert `expect(overlap(line[0].rect, line[1].rect), 'the two texts do not cover each other').toBe(false)`, reading both rects from the same `readTiers` snapshot as now.
     - It fails on the current `tierTextSlots` (result-series.ts:57-66), which gives the two dots separate size-1 slots.
     - Before the fix: boxes x 1110-1137 / 1116-1162 and y 662-675 / 658-671 (overlap true).
     - After the fix: the overlap is false.
     - Precondition, already asserted: the two markers `early-men-at-arms` and `men-at-arms` both exist on the Man-at-arms line.

3. `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (pin test, second `expect.poll`: `const rings = await readTiers(chart(page), PINNED_TIER, PINNED_DOT)` then `const dots = await readTiers(chart(page), \`${TIER}[data-series="${LINE}"]\`, DOT)`) - convention (LESSONS.md, `acceptance/**`)
   - **What:** the poll compares ring and dot positions, and ring-text and dot-text rects, from two separate `evaluate` calls.
   - **Why it matters:** a recharts redraw between the two calls can split the reading. That is the flake class the lesson records (pin-compare, step-band).
   - **Direction:** read all four in one call. Use `readLayout(chart(page), { rings: PINNED_DOT, dots: \`${DOT}[data-series="${LINE}"]\`, ringTexts: PINNED_TIER, dotTexts: \`${TIER}[data-series="${LINE}"]\` })` from `acceptance/helpers.ts:145`, or widen `readTiers` to take both pairs of selectors. Compare only values from that one result.

## Implementer deviations (as asked)

- **Criterion 4 uses `early-men-at-arms` / `men-at-arms` instead of `elite-longbowmen`.** Not a defect. The criterion asks for "a second tier on a line the run produces" and names no line. The two texts differ (`Early`, `Upgrade`), and the spec checks each against `upgradeTierName`. The ticket's Context sentence about a run reaching age 4 is outside this diff; the manager may want to correct it in the re-spec.
- **Text width estimated at 8 px/char.** Not a defect on its own. It reuses the shared `estimateLabelWidth` (`chart-markers.ts:36`) instead of copying it, and it over-estimates (for example, the estimate is 56 px and the real width of `Veteran` at 12 px is 43 px), so the text can only flip to the left early, never cross the edge. `SeriesChart` measures marker-label widths with `measureRef` (line-chart.tsx:133, 356), so a measured width is available if the finding 1 fix wants exact boxes. That is optional.
- **Three exported functions instead of two.** Not a defect. The ticket says the placement function takes "whatever shape the implementer needs", and the split has a reason: a label render knows only its own dot's box, so grouping is a separate pass. The manager should name all three in the CONTEXT.md Key surfaces On-merge step: `upgradeTierName`, `tierTextSlots`, `placeTierText`.

## Acceptance criteria

1. Tier-name unit table over `upgradeTargets`, plus the man-at-arms cases and veteran vs elite: **pass**. The table reads `loadGameData('english').upgradeTargets`, and the named cases are present. The implementer reports mutations caught for: returning the whole id, `<=` changed to `<` (gives `Men`), and dropping the capital letter. 44/44 pass in my run.
2. Placement unit tests: **pass**, with a note.
   - Covered: shared point, right-edge flip, top edge, bottom edge.
   - "A pinned ring and a current dot" has no unit row of its own. `tierTextSlots` has no pinned/current input, so the case reduces to the shared-point row. The pin acceptance test covers how it is wired into the chart.
3. Current dot texts on Knight/Longbow: **pass** (`expectTiers` reads text, dot and plot in one evaluate under `expect.poll`; the content is compared with `upgradeTierName`).
4. Two tiers show different text: **pass on content** (`Early` vs `Upgrade`), but the texts render overlapping (finding 1), and the test's no-cover check is weak (finding 2).
5. Pinned text opacity lower, and ring/dot texts not coinciding: **pass on behavior**. Inspection measured opacity 0.6 vs 1; at duration 1190 at 1200, 1280 and 1800 px the boxes are stacked 14 px apart with no overlap. The spec reads the second check across two evaluates (finding 3).
6. Text follows its dot (legend, zoom, Buildings, other charts, restore): **pass**. The text is the dot's `label` child, and the spec checks every transition and its restore.
7. Right-edge dot text inside the plot: **pass**. The spec asserts the dot is within 40 px of the plot's right edge and the text box is inside the plot.
8. Existing dot properties unchanged and no `recharts-label` class: **pass**.
   - No pre-existing assertion was edited; the only change to an existing line is an import.
   - The dot props in line-chart.tsx are untouched apart from the added `label`.
   - tsc is clean, and `result-series.test.ts` passes 44/44. I did not run the full unit suite; the implementer reports 2885 passed.
9. Docs and help: **pass** against the current code. Each doc sentence checks out against `upgradeTierName` and `placeTierText`. The help text keeps `upgrade dot` and `unit line`. The "at one point stack" sentence must change with the finding 1 fix.
10. A1, no hard-coded tier or unit words: **pass**. `upgradeTierName` works from segment counts; `Upgrade` is the specified fallback.

## Invariants touched

- **A1:** holds. No game number, tier list or unit list was added; only UI pixel constants (gap 3, opacity 0.6).
- **A2, A3:** not touched (no `lib/` or data change).
- **S1:** holds; every import is within the app or to the shared acceptance helpers.

## Chore check

- **Pre-existing test assertions:** none changed. That passes.
- **Visible behavior:** it changes. That is the spec gap above.

## Lint

`npx tsc --noEmit` is clean, and `npm run lint:dup` found 0 clones. `npx next build` succeeded in the scratch.

## UI inspection

- **How it ran:** `npx next dev` served the task checkout on port 3871 and `inspect.cjs` loaded the page with the repo's Playwright (stopped afterwards; the port is free).
- **States at 1200, 1280 and 1800 px:** Knight/Longbow current only; pinned plus a rerun at 1190 s (ring and dot at one point); pinned plus a rerun at 900 s. At 1280 px only: Spear/Longbow edited with the two MAA tiers.
- **Checks on every state:**
  - every text inside the plot;
  - no text covers any dot centre;
  - no horizontal document overflow;
  - the pinned text has opacity 0.6 and the current text 1, with the same fill;
  - no page errors.
- **Overlap:** only one, in the MAA two-tier state (finding 1).
- **Screenshots read:** `w1280-pinned-shared.png` (the two "Veteran" texts stacked and readable) and `w1280-maa-two-tiers.png` (overlap).

## Bot reconciliation

There is no `reviewBot` CLI or rules file, so this section is not applicable.

## Non-blocking notes

- `line-chart.tsx` pinned block: the `pinnedColor(series, dot.key, pinned?.series.findIndex(...) ?? 0)` expression is now written twice, for the stroke and the text colour. A local value per dot would keep the two in step.
- **Unit tests depending on data:** the `upgradeTargets` table never asserts that the data has at least one row that takes the `Upgrade` branch. The named `men-at-arms` case covers the branch, so this is only a note.

## Coverage

- **Files reviewed:** all 7 changed files:
  - `result-series.ts`, `result-series.test.ts`, `upgrade-tier-text.tsx`, `line-chart.tsx`, `page-help.tsx`;
  - `docs/aoe4-build-order-ui.md`;
  - `acceptance/aoe4-units-chart-upgrade-dots.spec.ts`.
- **Context read:** `chart-markers.ts` `estimateLabelWidth`, and `acceptance/helpers.ts` `readLayout`.
- **Not run:** acceptance and browser test files (not run by design).
- **REPO.md review checklist:** "Every diff" and "AoE4 build order" sections applied.
- **LSP:** not available; I found callers by grep (only `line-chart.tsx` and the spec import the new functions).
