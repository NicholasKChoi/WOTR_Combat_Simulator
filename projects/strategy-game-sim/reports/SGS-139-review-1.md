# SGS-139 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-139-marker-legend-hover-focus-labels`, tip `a04ccdc`, base `origin/main` 4f369f3 (merge-base 4f369f3). Full review, not delta mode.

## Blocking findings

1. `acceptance/aoe4-marker-labels.spec.ts:26` and `:68-75` - test - the label overlap check cannot fail. `setup` picks the first non-age-up kind in `CHART_MARKER_KINDS` order, which is `economy`. In this build `economy` has exactly one marker. I simulated "ENG Knight/Longbow (King's Palace)" with `simulateBuildOrder` and got one economy marker (`horticulture`, 6:12), one `unit-tier` marker and eight `blacksmith` markers. The UI inspection agrees: hovering Economy shows the single label `horticulture 6:12`. With one label, `rects.some((a, i) => rects.some((b, j) => i < j && ...))` has no pair to compare and always returns `false`. So the criterion's check that label rects do not overlap passes whatever `placeMarkers` does. Why it matters: the stacking that keeps a hovered kind's labels readable is untested. The ticket's acceptance criterion ("the label rects do not overlap each other") is unverified.
   Direction:
   - In `setup`, pick the non-age-up kind that has the most markers. In this build that is `blacksmith`: 8 markers, 60 s apart. A shared `kind` keeps every other case working; `tabTo` already uses `present.indexOf(kind)`.
   - In the hover test, before the overlap poll, assert `expect(labelsOf(result, kind).length).toBeGreaterThanOrEqual(2)`. A data change then fails loudly instead of leaving the check vacuous.
   - Production break it must fail on: in `components/apps/aoe4-build-order/line-chart.tsx:57-58` (`placeMarkers`), replace the row search with `const row = 0` so every label shares row 0.
   - Precondition: at 1280 px each blacksmith label is about 110-160 px wide, while consecutive blacksmith markers are about 20 px apart on the x axis (inspection: `data-label-rows` is 8 with blacksmith hovered). Several labels therefore start inside a neighbour's span.
   - Value before the break: the poll returns `false` (inspection at 1280 px found no overlapping labels). After the break: `true`.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `labelledMarkers` null / kind / kind with none | pass | `line-chart.tsx:69-70`. The table at `line-chart.test.ts` "labelledMarkers(markers, %s)" fails if null returns all markers (4 instead of 2) or if a kind also returns age-ups. |
| (respec 1) `activeMarkerKind` table | pass | `line-chart.tsx:72-74`. The 7-row table covers every listed row plus one more (focus without markers). The hover-without-markers rows fail if the has-markers check is dropped. The "both" row fails if the order is swapped. |
| (respec 2) `liveMarkerKind` table; `SeriesChart` resets only through it | pass | `line-chart.tsx:78-79` and `:107-111`. Both slots go through `liveMarkerKind` (set-state-during-render, guarded by `!==`). There is no other reset logic. The 4-row table fails if `collapsed` is ignored or the has-markers check is dropped. |
| `MarkerLegend` static markup and `data-active` | pass | `chart-legend.tsx:74-95`. "marks only the item whose kind is active" fails if every item or no item gets `data-active`. The edited "lists one marker legend item per kind present" test pins `li > button`, `aria-label` and kind order. |
| (respec 2) Playwright drawing rule | pass (by reading) | Spec test 2 asserts a non-zero marker count, then a line count equal to `result.markers.length` and hover titles on the age-up lines. The old `kind !== 'age-up'` filter would drop the age-up lines and fail it. Inspection: 12 `chart-marker` lines in every state, and titles on the 10, 4 and 11 unlabelled lines respectively. |
| Playwright hover labels, no age-up label, no overlap, precondition | **fail** | The label-set and precondition checks are sound. The no-overlap check is vacuous: see Blocking 1. |
| Playwright leave / Tab / blur / hover-over-focus / Escape-Enter | pass (by reading) | Spec test 3. Hover-over-focus focuses Age-up and hovers the chosen kind. It checks `data-active` on both items, which tells "focus falls back" apart from "default null"; the label sets could not. Inspection confirmed that two Tabs from the last series item land on Economy. Clicking is exercised through Enter (which activates the button) rather than a mouse click. Acceptable, but a mouse click is not literally tested. |
| (respec 2) Playwright collapse reset | pass (by reading) | Spec test 4: asserts `data-active` before the collapse, collapses with `dispatchEvent('click')` (the `CollapseCaret` `onClick` at `collapse-caret.tsx:18`), asserts the legend is gone, moves the pointer away, expands, then asserts age-up labels and no `data-active`. Without the reset, `hoverKind` would survive the collapse and the item would come back active. |
| Active looks different; focus indicator; 390 px no overflow | pass | Inspection (computed style): an inactive button has `bg rgba(0,0,0,0)` and a transparent border. The active button (hover or focus) has `bg rgba(13,110,253,0.12)` and border `rgb(13,110,253)`. A keyboard-focused button has outline `solid 2px rgb(13,110,253)` (otherwise `none`). At 375 and 390 px the legend's scrollWidth equals its clientWidth (321/321, 336/336) and the page scrollWidth equals the viewport. |
| Pinned runs unaffected | pass | `line-chart.tsx:229-241` is unchanged: only pinned age-ups are drawn, dashed, with a title and no label. Spec test 6 asserts the dashed count before and after hover, with no text in their layers. |
| Docs | pass | `docs/aoe4-build-order.md:989-995`. Every claim checked against the code (see Doc claims below). A grep of `docs/` and `ARCHITECTURE.md` for `marker legend`, `text label`, `chart-marker-legend-item` and `hover title` found no other contradicted sentence. |
| tsc, lint:dup, npm test, next build | pass | I ran them in the review worktree: `tsc --noEmit` clean; jscpd 0 clones; `npm test` 2501 passed, 15 skipped; `next build` succeeded. |
| No INVARIANTS regressions | pass | See below. |

## Invariants touched

- A1, A2, A3 (paths match `components/apps/aoe4-build-order/**`): hold. No simulation, data or engine file changed. The new code is pure UI state over `result.markers`.
- S1: holds. `chart-legend.tsx` and `line-chart.tsx` import only same-app and `lib/aoe4-build-order` modules.
- S2, S3, W*, H*: not touched.

## Doc claims checked

- "By default only `age-up` markers carry a text label ... stacked in rows by their measured width": `labelledMarkers(markers, null)` feeds `placeMarkers` with measured widths (`line-chart.tsx:112-126`). True.
- "A marker without a text label stays a line and shows `<label> <m:ss>` as a hover title": `line-chart.tsx:225`, `markerLabel`. True. Inspection: unlabelled lines carry titles.
- "each a button: hovering or focusing it labels that kind's markers in place of the age-up labels": `chart-legend.tsx:83-86`, then `activeMarkerKind` and `labelledMarkers`. True.
- "the age-up labels return when no entry is hovered or focused, and a hovered entry wins over a focused one": `activeMarkerKind` order `[hoverKind, focusKind]`. True.
- "clicking or pressing a key on it does nothing more than focus it": no click or key handler. True for click, Enter, Space and Escape (see note 1 on Tab).
- "collapsing the chart clears it": `liveMarkerKind(..., collapsed)`. True.
- Code comments at `line-chart.tsx:68` and `:76-77`: consistent with the code.

## Bot reconciliation

No `reviewBot` CLI or rules file is configured in REPO.md. Nothing to reconcile.

## UI inspection

I served the task worktree with `npx next dev -p 3587` through serve.sh and ran `inspect.cjs` with the repo's Playwright. I loaded `/apps/aoe4-build-order`, selected "ENG Knight/Longbow (King's Palace)", opened the Results tab when needed, and inspected `chart-gather-rates` at 375, 390 and 1280 px in these states: default, hover Blacksmith (8 labels), hover Economy, hover Unit tier, and keyboard focus on Economy (two Tabs from the last series item).
- Clipped overflow (hidden or clip with scroll > client) inside the chart: none in any state or width.
- Overlapping marker-legend items: none.
- Mid-word wraps in the legend: none. At 375 and 390 px the Blacksmith item wraps whole onto a second line.
- Overlapping chart labels: none, including the 8 stacked blacksmith labels. No label falls outside the SVG.
- Computed styles: active and inactive differ, and focus shows a 2px outline (values in the criteria table).
- Page horizontal overflow: none (scrollWidth equals the viewport at every width).
- Screenshots I read: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/ea918271-89a9-476e-95c2-a67b7d3c8a20/scratchpad/w1280-hover-blacksmith.png`, `w375-hover-blacksmith.png`, `w1280-focus-economy.png` and `w375-default.png` (same directory). Labels anchor at their lines, and the active and focused items are visibly marked.
- I stopped the server (port 3587 free).

## Non-blocking notes

1. `docs/aoe4-build-order.md:994`: "pressing a key on it does nothing more than focus it" is loose; Tab moves focus away and clears the labels. Optional wording: "clicking it or pressing Enter, Space or Escape on it does nothing more than focus it".
2. `components/apps/aoe4-build-order/results.module.css:38,42`: hard-codes `#0d6efd`. The sibling `workbench.module.css:92` uses `var(--bs-primary, #0d6efd)` and `step-annotation.module.css:32` uses `var(--bs-primary)`. Prefer the variable.
3. `components/apps/aoe4-build-order/line-chart.test.ts` "renders one button per kind present, in kind order, and nothing without markers" repeats what the edited "lists one marker legend item per kind present, in kind order" (line 27) and "has no marker legend when markers are empty or omitted" (line 40) already check. One of them can go.
4. Hovering a kind with many close markers (Blacksmith here) stacks 8 label rows. The 360 px chart's plot area shrinks by about 112 px while the item is hovered (visible in `w375-hover-blacksmith.png`). This is the designed `placeMarkers` stacking, not a defect. Noted in case the owner finds the plot jump distracting.
5. Spec test 3 covers "clicking changes nothing" with Enter (button activation), not a mouse click. Adequate, since there is no click handler.

## Coverage

- Reviewed: every changed file. That is `line-chart.tsx`, `chart-legend.tsx`, `results.module.css`, `line-chart.test.ts`, `acceptance/aoe4-marker-labels.spec.ts` and `docs/aoe4-build-order.md`. I also read the siblings `chart-header.tsx`, `collapse-caret.tsx`, `acceptance/aoe4-chart-readability.spec.ts`, `acceptance/helpers.ts` and `workbench.module.css`, and the M9 design C8 and Marker labels (M9.7) rules.
- I ran `tsc --noEmit`, `lint:dup`, `npm test` and `next build`. Per the gate rules I ran no acceptance or Playwright test files; the new spec is judged by reading.
- REPO.md review checklist: I did "Every diff" (build, loaded the page, user-visible flow) and "AoE4 build order" (no copied helpers; doc sentences checked; screenshots at 375/390/1280 rather than 360x760/768; no axis or label overlap; no Bootstrap utilities mixed with module CSS on the button). I did not inspect the 768 and 700 px widths that section names. The legend layout is width-independent flow, and nothing found at 375-1280 suggests a regression in between.
- No LSP caller search was needed: `MarkerLegend` has one production caller (`line-chart.tsx:250`), confirmed by grep.
