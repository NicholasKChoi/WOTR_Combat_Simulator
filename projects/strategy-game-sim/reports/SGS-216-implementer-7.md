# SGS-216 implementer-7 (Rework 1)

- Ticket SGS-216, branch `sgs-216-population-chart-cap-mark`, tip `514c5f110ea4f76e06f1e8b535bf77333f71ce1e`, checkout `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-216-population-chart-cap-mark`.
- State found: the branch already held two commits after the reviewed tip `91c8dca`, made by an earlier unreported pass: `816c7e8` (adds `dy: -4` to the time-mark label in `line-chart.tsx`; replaces the `docs/aoe4-build-order-ui.md` label-side clause) and `514c5f1` (the two end-of-list `chart-layout.test.ts` rows name `'chart-population'` directly). I verified both against the Required-fixes text. The UI doc clause is exactly "the label to the right of the line unless its estimated width (8 px per character, wider than the drawn text) would pass the plot's right edge, and then to its left". This pass made no code commit; it did the measurement and the breaks, and ticked the five boxes in the ticket.

## Files touched this pass
None in the repo (no new commit). Ticket checklist ticked: `tickets/SGS-216-population-chart-cap-mark.md`.

## Fix 1: label above the x axis (measured, `dy: -4` in place)
A throwaway spec (deleted, not committed) read the `Population cap 18:15` text box and the x-axis line of `chart-population` at the default build (1200 s):

| width | label left..right | label bottom | axis line y | grid | overflow |
|---|---|---|---|---|---|
| 1200 | 988.7..1101.8 | 2988.78 | 2990.78 | 724..1138 | 0 |
| 1280 | 1028.7..1141.8 | 2988.78 | 2990.78 | 764..1178 | 0 |
| 1800 | 1370.8..1483.9 | 2956.39 | 2958.39 | 1024..1528 | 0 |

Label bottom is 2 px above the axis line at all three widths, the label sits inside the grid, and there is no horizontal overflow. The throwaway spec asserted `label bottom < axis y` and passed 3 of 3.

## Mutation checks
Run in the `mutate-sgs-216` scratch (branch `sgs-216-population-chart-cap-mark`, committed state, nothing uncommitted to copy). Provisioned with `link-node-modules.sh .` and `npm run acceptance:setup` through `run.sh`. `tree-record.sh` on the task checkout before the scratch and after its removal: both `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty status listing. Each file was reset with `git checkout -- <file>` and `git diff --exit-code` passed after every break. Scratch removed.

### Fix 3 break
`result-series.ts:137` `run.populationCapReachedAt === null ?` to `=== undefined ?`. `result-series.test.ts` "is null when the cap was not reached" failed on `toBeNull()` (Expected null, received an object). 1 failed of 55.

### Fix 4: `chart-layout.test.ts` (changes as in `91c8dca^..HEAD`)
Prepend break (`chart-layout.ts:3`, `'chart-population'` first): failed "ends the default layout with the Population chart, expanded", `returns an equal layout for down at the end`, `returns null for down at the end` (the two `['down', 'chart-population']` rows; 3 failed of 50).

Other changed items, each with the break that failed it on its own `toEqual`:
- Break D "drop the missing Population id" (`chart-layout.ts` `missing` filter adds `&& id !== 'chart-population'`) failed: "drops unknown and duplicate ids ...", "drops key-results and unknown ids from order", "reads an M8-shaped four-chart value with the Population chart appended and its collapsed kept", "normalises a stored layout that misses an id" (4 failed).
- Break R "listed order reversed" (`order: [...listed].reverse().concat(missing)`) failed: "round-trips a valid layout unchanged", "drops unknown and duplicate ids ...", the M8 test, the three "keeps the Population chart where a stored layout has it" rows (first, middle, collapsed), "normalises a stored layout that misses an id", and two storage round-trip tests (9 failed).
- Break S "swap two places" (`moveChart`: `from - 2` / `from + 2`) failed all six `moveChart` swap rows (up rates, down units, down gathered, up floating, down floating, up population) and the `moveChartByKey` second-move test (8 failed with "returns null when the second of two moves would pass the end").
- Break C "clamp to length - 1" (`moveChartTo` splice) failed the last-index and above-the-last rows (2 failed). Break P "index + 1" failed the first-index, middle-index, current-index and below-0 rows (4 failed). Together all six `moveChartTo` rows are failed, each by its own `toEqual`.

### Fix 5: edited acceptance specs, whole file run under each break
Commands: `npx playwright test acceptance/<file> --reporter=line` through `run.sh <scratch>`, after `acceptance:setup`.

Break (a) `results.tsx:125` `layout.order.map(` to `layout.order.filter((id) => id !== 'chart-population').map(`:
- `aoe4-chart-layout.spec.ts`: 28 failed, 3 passed. Failed: default order, collapse (POPULATION body visible), help/status, ArrowDown row, ArrowUp, last-chart ArrowDown row, announcement test, Enter/Home/End/Space, reloads, the three stored-value rows (missing ids included), blocked localStorage, both alignment tests (count 5), the five-chart drag title test and other drag tests, the build-view layout test.
- `aoe4-chart-row-feedback.spec.ts`: 25 failed, 4 passed (header tint rows, drag feedback `others` with POPULATION, drop indicator slot rows, drop cases).
- `aoe4-chart-views.spec.ts`: 4 failed, 9 passed (the y-label entry tests among them).
- `aoe4-results-split.spec.ts`: 1 failed, 3 passed ("the five charts are the row groups ...").
- `aoe4-build-order-step-band.spec.ts`: 10 failed, 3 passed ("... on each of the five charts" and the others reading five charts).

Break (b) `use-chart-drag.ts:19` `latest.current.order.flatMap(` to `latest.current.order.slice(0, -1).flatMap(`:
- `aoe4-chart-row-feedback.spec.ts`: 2 failed, 27 passed: the new slot-4 row in "the indicator spans the table width ..." and "releasing below the last chart ...".
- `aoe4-chart-layout.spec.ts` (whole file): 31 passed. None of its changed items depends on the last slot, so (b) is not a break for them; its changed items are failed by (a) as listed.
- Not run under (b): chart-views, results-split, step-band (no drop or drag items changed).

Break (c) `results.tsx:87` `of ${layout.order.length}` to `of 4`:
- `aoe4-chart-row-feedback.spec.ts`: 4 failed, 25 passed: the status-text `of ${CHART_IDS.length}` assertion in four drop cases (the "inside the chart own rows" case asserts empty status, so it is not failed by this break).
- `aoe4-chart-layout.spec.ts`: 31 passed (its status assertions are regexes on the position, so they did not change in this ticket and are not claimed). chart-views 13 passed, results-split 4 passed, step-band 13 passed under (c): they carry no status-text item.

No item was rewritten or deleted: every item changed in the five specs is failed by (a), (b) or (c) as above. Title-only changes (step-band, results-split) are failed by (a) through the assertions in the same tests.

## Clean stage (task checkout, after the breaks)
- codegen: not set. `tsc --noEmit` and `lint:dup`: clean, 0 clones. `npx next build`: succeeded. `npm test`: 95 files passed, 1 skipped; 3148 tests passed, 15 skipped.
- Edited acceptance specs run whole, unbroken, in the task checkout: chart-layout 31 passed, chart-row-feedback 29 passed, chart-views 13 passed, results-split 4 passed, build-order-step-band 13 passed.
- Working tree clean after the run.

## Doc claims
None added this pass. The existing sentence in `docs/aoe4-build-order-ui.md` (label side by estimated width, 8 px per character) is made true by `chart-markers.ts:timeMarkLabelPosition` with `line-chart.tsx` passing `estimateLabelWidth` (the measured text, 113 px, against a 160 px estimate).

## Other
- Bug regression, pinned outputs: not applicable (Feature).
- Invariant check: no `lib/` or simulation file touched; A1 to A3 not at risk.
- Unverified assumptions added: none.
- Out-of-scope findings: none.

Status: needs_review
