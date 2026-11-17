# SGS-200 docs report 7

- Ticket: SGS-200 (Docs, risk low)
- Branch: `sgs-200-m11-docs`, base `origin/main` @ 74984be
- Tip SHA: `bb27bc2a4930c788bf3c8c8d9fd7068f905a1ed2` (one commit)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-200-m11-docs`
- Status: needs_review

The checkout was created fresh by `checkout.sh task`, so no pre-call record or own-commit check applied.

## Docs touched

- `docs/aoe4-build-order-ui.md`: chart table paragraph, chart controls (header row / body row), marker control paragraph, Units upgrade dots paragraph, zoom paragraphs, new "Help dialog" section, step-kind legend sentences (two), Units pinned-run sentence, Tab order and intro mention of the help button.
- `docs/aoe4-build-order-format.md`: `step-stuck` example cause, "units produced" chart sentence, `waitingFor` repeat-offer sentence, `building-busy` `every` clause.
- `docs/aoe4-build-order.md`: no change (all B-B rules already stated; see map).
- `lib/aoe4-build-order/README.md`: Module map (`engine-common.ts`, `research.ts`, `markers.ts` extended, `unit-lines.ts` added), event loop bullets, Where to change what.
- `ARCHITECTURE.md`: two rows in "Where files go".

## Doc claims (added or changed) and the code behind them

UI doc, chart table (B-T):
- "Results draws the charts as one table (`chart-table`, labelled `Results charts`) under the marker control ... Each chart is a row group ... of a header row (`chart-header-row`) and a body row (`chart-body-row`) ... four columns are fixed" : `results.tsx` `<table data-testid="chart-table" aria-label="Results charts">` with a `<colgroup>` of four `<col>`; `line-chart.tsx` `SeriesChart` returns `<tbody>` with `ChartHeaderRow` and `<tr data-testid="chart-body-row">`; `chart-header.tsx` four cells.
- "The table never makes the Results column scroll sideways, and each plot fills the width of its body row": `results.module.css` `.chartTable { width: 100%; table-layout: fixed }`, body cell `colSpan={4}`, `ResponsiveContainer width="100%"`.
- "Collapsing a chart hides its body row ... a collapsed chart is exactly its header row": `line-chart.tsx` `<tr data-testid="chart-body-row" hidden={collapsed}>`.
- "dims the moved chart's rows": `results.module.css` `.chartGroup[data-dragging='true'] { opacity: 0.6 }`.
- "The key results panel is outside the table": `results.tsx` (panel is not in `chart-table`; it is rendered by the page).

UI doc, marker control (B-M): `chart-legend.tsx` `MarkerControl`, `chart-markers.ts`, `results.tsx`.
- "one control titled "Markers" sits above the chart table ... inside `results-last-good`": `results.tsx` renders `MarkerControl` before `<table>` inside `div[data-testid=results-last-good]`; `<h3>Markers</h3>`.
- "one entry per marker kind present ... in the order Age-up, Economy, Unit tier, Blacksmith, Other ... named `<kind> markers`; a run with no markers draws neither lines nor the control": `MarkerControl` filters `CHART_MARKER_KINDS`, returns `null` for none, `aria-label={`${MARKER_KIND_LABELS[kind]} markers`}`; colours from `MARKER_COLORS`.
- "`aria-pressed` means shown": `aria-pressed={!hidden.has(kind)}`; "hidden entry is dimmed": `opacity: 0.5`.
- hover/focus labelling and fallback: `labelKindOf(markers, hidden, hover, focus)` = `activeMarkerKind(visibleMarkers(...))`; `labelledMarkers(visible, null)` = visible age-ups, so with age-up hidden nothing is labelled.
- "pinned `age-up` markers ... follow the `Age-up` toggle ... unless the current run has no age-up marker": `line-chart.tsx` `ageUpHidden = hidden.has('age-up') && ageUpMarkers(markers).length > 0`.
- "changes nothing else": `markerView` only feeds `visibleMarkers` / `labelledMarkers` in `SeriesChart`.
- "not stored: survive a new run, a view toggle, collapsing, reordering, zooming and pinning ... a kind that leaves a later run and returns is still hidden": `hiddenKinds` is `useState` in `Results`, never pruned; `Results` stays mounted across those.
- Tab order after the info toggle and before the first handle: DOM order in `results.tsx` (`InfoMessages`, help paragraphs, `MarkerControl`, table); no key handlers on the control.
- "Charts have no marker legend of their own": `line-chart.tsx` renders `SeriesLegend` and `PinnedLegend` only.

UI doc, upgrade dots (B-U): `result-series.ts` `unitLineSeries`, `unitUpgradeDots`, `visibleUpgradeDots`; `line-chart.tsx`.
- "one filled dot (`chart-upgrade-dot`) for each upgrade of that line the run researched ... markers entry whose `unit` names the line": `unitUpgradeDots`.
- "on the line at its value at the marker's time ... line's colour with a white outline ... above the lines": `visibleUpgradeDots` uses `valueAt`; `ReferenceDot r=4 fill=seriesColor stroke="#fff" zIndex=601`; hover title `<title>{label m:ss}</title>`.
- "An upgrade of a line the run never produced has no dot, judged per run": `unitUpgradeDots` filters by the run's own lines; `visibleUpgradeDots` is called with each run's series.
- "dashed ring (`chart-pinned-upgrade-dot`, white fill, dashed outline in the pinned line's colour, titled `<label> (pinned) <m:ss>`)": `ReferenceDot r=5 fill="#fff" stroke=pinnedColor strokeDasharray="3 2" zIndex=600`, `<title>`.
- "Hiding a line in the series legend hides its dots and rings": `visibleUpgradeDots` checks `isLineHidden(hidden, dot.key)`.
- "`Unit tier` item hides only that kind's vertical lines, not the dots; a pinned run's upgrades draw no vertical line": dots do not read `markerView`; only `pinnedAgeUps` are drawn for the pinned run.
- "outside a zoom window is not drawn": `visibleUpgradeDots` window check. "Buildings view draws none": `results.tsx` passes dots only when `unitsProducedView === 'units'`.
- "drawn from its own `gatherers`, unit lines or `productionBuildings` (matched by key, a unit line by its `baseId`)": `Results` passes `chart.series(pinned)`; `unitLineSeries` keys by `baseId`.

UI doc, zoom (B-Z): `chart-zoom.ts`, `use-chart-zoom.ts`, `chart-zoom-bar.tsx`, `line-chart.tsx`.
- 4 px threshold, primary button only, plot grid only: `use-chart-zoom.ts` `onPointerDown` (`event.button !== 0`, `insidePlot`, `DRAG_THRESHOLD_PX`); grid box from `readGridBox` (`.recharts-cartesian-grid`).
- "grey band (`chart-zoom-selection`)": `ReferenceArea`, `SELECTION_COLOR #6c757d`.
- "rounded to whole seconds ... shorter than 30 s, or spanning the whole game, changes nothing": `zoomTo`, `usableWindow`, `MIN_ZOOM_SECONDS = 30`.
- "Escape, a cancelled pointer or a lost pointer capture ... keeps the window": `onKey`, `onCancel` (`pointercancel`, `lostpointercapture`), `finish(true)`.
- "x axis spans the window ... lines draw only the samples in it, reaching both edges; the y axis fits them": `XAxis domain={[shown.from, shown.to]}`, `rowsInWindow`, YAxis default domain.
- markers/dots/pinned age-ups outside are not drawn, labels placed within the window, band cut: `drawn()`, `placeMarkers(..., shown.from)`, `bandIn`.
- `data-zoom-from`/`data-zoom-to`: `tbody` attributes. Zoom bar contents, names, `aria-disabled`, "half its length": `chart-zoom-bar.tsx`, `panStepSeconds`, `{formatMinSec} to {formatMinSec}`.
- Shift+drag pan, Escape restores, not zoomed does nothing: `use-chart-zoom.ts` (`mode === 'pan' && !clampWindow(...)` returns; `finish(true)` restores `startWindow`).
- "Reset ... moves focus to that chart's collapse caret": `line-chart.tsx` `onReset`.
- independence / survive / clamp / not stored: window is `useState` in `useChartZoom` inside `SeriesChart` (keyed by chart id); `seenEnd !== end` re-clamps with `clampWindow`; nothing in storage.
- "work while the charts are dimmed": `.dimmed` is `opacity: 0.5` only (`workbench.module.css`), no pointer-events rule.
- Tab order and "no keyboard way to select": DOM order in `line-chart.tsx` (header row, zoom bar, plot, legend); the only `keydown` listener is attached for the duration of a pointer session.

UI doc, help dialog (B-H): `page-help.tsx`, `pages/apps/aoe4-build-order.tsx`.
- heading row with `h1` then `PageHelp`, before `BuildInput`: `pages/apps/aoe4-build-order.tsx` `workbenchStyles.headingRow`; `.headingRow { display: flex }`.
- always enabled: the `help-open` button has no `disabled` prop. Starts no run, changes no state: `open()` only calls `showModal()` and resets `scrollTop`.
- native `<dialog>` titled `How this page works`, `aria-labelledby`; `help-close` first in the dialog; Tab stays inside (`wrapTab`); scrolls inside (`max-height: 80dvh`, `overflow-y: auto`, `scrollTop = 0` on open).
- close by button, Escape (native) or backdrop click (`event.target === currentTarget && outsideRect`); focus returns to the opener: native `<dialog>` close behavior, not explicit code (see Out-of-scope notes). Inside click does not close: the `outsideRect` check.
- "The server render includes the dialog closed": `<dialog>` is rendered without an `open` attribute.
- Step kind legend sentences: `StepKindLegend` is imported only by `page-help.tsx`; `step-table.tsx` and `build-text-editor.tsx` no longer render it (`git grep StepKindLegend`).

Format doc:
- `step-stuck` example now "step 12 (build) was still waiting on prerequisite at 60:00, from 11:40.": `simulate.ts` `stepStuckWarning` message `was still waiting on ${waitingOn}`; `prerequisite` is a real `waitingOn` value.
- "units produced (one line per unit line, or per production building)": `result-series.ts` `unitsProducedSeries`.
- "A step offered more than once at one instant keeps the detail of the last offer, which the next waiting interval accrues": `simulate.ts` `offerStep` overwrites `timing.waitingFor`; `accrueDetail` reads it.
- "(and, for `building-busy`, its `every`)": `simulate.ts` `accrueDetail` matches by `waitTargetKey` (no `every`) and keeps the first entry's detail.

Lib README: `unit-lines.ts` / `unitLineName` (used by `simulate.ts` `unitSeries`); `instanceFree` (`engine-common.ts:73`); `research.ts` `researchHandler` (`instances.find(... instanceFree ...)`); `markers.ts` `researchMarker(entry, at, unit?)`; event loop bullets name `offerStep`, `waitingFor`, `accrueWait`, `waitBreakdown`, `waitDetails`, `instanceFree`, `offerSteps`, `held`, `startProduction` (all exist in `simulate.ts`, checked with grep); `wait-detail.ts` entry was already present and matches the code (builders, `waitReasonOf`, `waitTargetKey`, `waitDetailText`; value imports `model.ts`, `engine-common.ts`, `landmarks.ts`).

ARCHITECTURE.md: `wait-detail.ts` value imports only `./engine-common`, `./landmarks`, `./model` and a type from `./simulate`; `MARKER_COLORS`, `MARKER_KIND_LABELS`, `placeMarkers` are defined only in `chart-markers.ts` (`git grep`); `chart-zoom.ts` has one `import type` and no React.

## Removed claims

- UI doc: "a legend of the step kinds (`step-kind-legend`) above the table (the text view shows the same legend above its editor)" and "The kind legend renders above the text editor as well as above the step table ...": `StepKindLegend` is rendered only by `page-help.tsx`.
- UI doc: "each chart's title row", "everything under the title row (the series legend and the plot)": the chart header is `ChartHeaderRow` and collapse sets `hidden` on `chart-body-row`; the body also holds the zoom bar and pinned legend.
- UI doc: marker-control sentences "survive a new run, collapsing and reordering" and the entry list, reworded in a fuller paragraph (not contradicted, extended).
- Format doc: "was still waiting on resources" in the example (kept the message form, changed the cause); "units produced (by unit and tier)": the chart groups tiers into one line per unit line.

## Rule maps

### UI doc: B-T, B-M, B-Z, B-U (section, sentence)

B-T (UI doc, "Chart table" and "Chart controls" paragraphs)
- B-T1: "Every chart's handle, title, caret and toggle therefore line up in their columns, whatever mix of charts is collapsed or expanded, at 1200 px and wider." and "a collapsed chart is exactly its header row".
- B-T2: "Collapsing a chart hides its body row (the zoom bar, the plot, the series legend and the pinned legend)".
- B-T3: "A chart is reordered by dragging its handle ..." (unchanged text) plus added "dims the moved chart's rows".
- B-T4: not applicable (it restates the unchanged layout rule; the existing `{ version, order, collapsed }` / `aoe4-build-order.chart-layout` paragraph is untouched).
- B-T5: "The table never makes the Results column scroll sideways, and each plot fills the width of its body row."
- B-T6: "Results draws the charts as one table ... Each chart is a row group ... the title is the row group's header cell ... The key results panel is outside the table." (the Key results title row paragraph is unchanged.)

B-M ("Marker control" paragraph)
- B-M1: "one control titled "Markers" sits above the chart table, shared by all the charts, inside `results-last-good` so it dims with them. It lists one entry per marker kind present ...; a run with no markers draws neither lines nor the control."
- B-M2: "Clicking an entry, or pressing Enter or Space on it, hides that kind's vertical lines and their labels on every chart at once ...; focus stays on the entry."
- B-M3: "`aria-pressed` means shown: "true" while the kind is drawn and "false" while it is hidden, and a hidden entry is dimmed."
- B-M4: "Hovering or focusing an entry labels that kind's markers on every chart in place of the age-up labels (... a hovered entry wins over a focused one)."
- B-M5: "A hovered or focused hidden kind has nothing to label, so the age-up labels show instead".
- B-M6: "with the `Age-up` kind hidden and no entry hovered or focused, no chart shows a label."
- B-M7: "The pinned run's `age-up` markers ... follow the `Age-up` toggle ... unless the current run has no age-up marker, when they always show." The chart paragraph still says hiding every pinned line removes the pinned legend "unless a pinned age-up marker is drawn" (the `pinnedLegendShown` count).
- B-M8: "The hidden kinds are not stored: they survive a new run, a view toggle, collapsing, reordering, zooming and pinning, and a kind that leaves a later run and returns is still hidden. They reset on reload." (The `liveMarkerKind` reset of a hovered kind that leaves the run is an internal fix-up and not stated.)
- B-M9: "changes nothing else: not the series, the step band, the upgrade dots or any zoom".
- B-M10: "The entries come after the info messages toggle and before the first chart's drag handle in the Tab order, and the control has no arrow-key handling."

B-Z ("Zoom" paragraphs)
- B-Z1: "Pressing the primary mouse button inside a chart's plot area (the grid, not the axes, the marker label rows, the legends or the zoom bar) ... Nothing happens until the pointer has moved 4 px"; "A collapsed chart has no plot to select in." (Tooltip pause while captured: not stated, an implementation effect.)
- B-Z2: "a grey band (`chart-zoom-selection`) follows the pointer".
- B-Z3: "on release the chart zooms to the selected seconds, rounded to whole seconds. A selection shorter than 30 s, or one that spans the whole game, changes nothing, and the band is gone after every release."
- B-Z4: "Selecting inside a zoomed chart zooms further, and Reset still returns to the whole game, not to the previous window."
- B-Z5: "Escape, a cancelled pointer or a lost pointer capture during a selection removes the band and keeps the window."
- B-Z6: "While a chart is zoomed its x axis spans the window and its lines draw only the samples in it, reaching both edges; the y axis fits them. ... `data-zoom-from` and `data-zoom-to` in whole seconds." (Tick format `m:ss` unchanged and not restated.)
- B-Z7: "A marker, upgrade dot, pinned upgrade dot or pinned age-up outside the window is not drawn, marker labels are placed within the window, and the highlighted step span is cut to the window (and absent when it lies wholly outside)."
- B-Z8: "A pan button moves the window by half its length. At the start or end of the game the matching button is dimmed and does nothing, and it stays focusable (`aria-disabled`, not `disabled`)." (Enter/Space activation is native button behavior, not stated.)
- B-Z9: "Dragging inside a zoomed chart's plot area with Shift held pans instead: after 4 px the window follows the pointer, release keeps the new window, and Escape or a cancelled pointer restores the window from before the drag; with the chart not zoomed, Shift and drag does nothing."
- B-Z10: "Reset, by click, Enter or Space, shows the whole game again, removes the zoom bar and moves focus to that chart's collapse caret."
- B-Z11: "Zooming one chart changes no other chart, the step highlight, which marker kinds are hidden or any series' hidden state." (First sentence of the paragraph: "each chart has its own time window".)
- B-Z12: "A chart's window survives collapsing and expanding, reordering, the view toggle, a new run, and a pin or unpin; when a run or a pin changes the game's length the window is cut to the new length, and when nothing usable is left (...) the chart is unzoomed."
- B-Z13: "Windows are not stored, so every chart shows the whole game after a reload."
- B-Z14: "In a zoomed chart the Tab order is the handle, the caret and the view toggle of its header row, then Show earlier, Show later and Reset zoom (the range text takes no focus), then the plot's own stops, then the series legend. There is no keyboard way to select a range, and Escape outside a drag does nothing."
- B-Z15: "Zoom, pan and Reset work while the charts are dimmed."

B-U ("Chart" table row plus the "Upgrade dots" paragraph)
- B-U1: table row "Units produced (Units view) | each `unitsProduced` `baseId` ... | the entry's `lineName`" (SGS-198's row, checked, unchanged), with the legend naming rule "one item per series, named without a suffix".
- B-U2: "each unit line that the run produced carries one filled dot (`chart-upgrade-dot`) ... on the line at its value at the marker's time ... in the line's colour with a white outline and above the lines, so two upgrades at one instant draw two dots at one point."
- B-U3: "An upgrade of a line the run never produced has no dot, judged per run."
- B-U4: "Hiding a line in the series legend hides its dots and rings, and showing it brings them back."
- B-U5: "With a pinned run, each of its upgrades of a line it produced is a dashed ring (`chart-pinned-upgrade-dot` ...) on the pinned dashed line, so a line only the pinned run has gets its rings"; "a pinned run's upgrades draw no vertical line". Unpin removing them / recompute on re-run: follows from "each chart draws the pinned run" and is not restated.
- B-U6: "the Buildings view draws none."
- B-U7: "The marker control's `Unit tier` item hides only that kind's vertical lines, not the dots".
- B-U8: "A dot or ring outside a zoom window is not drawn".
- B-U9: "where a ring and a dot share a point both show, the ring around the dot". (The hover-title-topmost sentence was cut: nothing in the code sets it.)

### UI doc: help dialog (B-H)

- B-H1: "Help dialog" section: "The button opens a modal dialog ... While the dialog is open the page behind it is inert, focus is on its Close button ... Its content scrolls inside the dialog and starts at the top on every open." and "clicking it ... starts no run and changes no page state".
- B-H2: "The Close button, Escape, or a click on the backdrop outside the dialog's box closes it, and focus returns to the `How this page works` button; a click inside the dialog does not close it."
- B-H3: "The content is the same on every open, and the dialog keeps nothing between opens."
- B-H4: "Tab and Shift+Tab move among the dialog's own controls only."
- B-H5: "It is always enabled, with no result, invalid text or a run in flight".
- B-H7: Text view paragraph: "The step kinds are explained in the help dialog (see below); the page shows no kind legend in the text view or the table view."; cell paragraph: "the help dialog explains the step kinds, and the page shows no legend of them in either view."; Help dialog section: "`step-kind-legend`, which is shown only in the dialog". Kept-on-page items (pinned legend, marker control, hidden reorder help) are unchanged text.
- B-H8: "The page title's heading row holds the `h1` and, beside it on one line, a `How this page works` button (`help-open`), inside the page section. The button comes before the run bar's controls in the DOM and Tab order." and the Page paragraph's Tab order sentence.
- B-H9: "The server render includes the dialog closed."
- B-H6 not mapped, per ticket.

### Model and format docs: B-B and B-W

B-B (model doc `docs/aoe4-build-order.md`, "Model rules"; unchanged by this ticket)
- B-B1: Queues: "An instance is free for a step when nothing is paid in its queue and it is not held for another step; an instance whose order cannot pay right now is free."
- B-B2: Research paragraph: "A `research` step pays its cost when it starts, on an instance with nothing paid ... a `produce` or `research` step waiting for that instance keeps waiting ... Two researches at one instance therefore run one after the other with no gap, each paid when it starts."
- B-B3: "A `produce` step ... checks, in order: the unit is known and at or below the current age, a targeted instance exists, supply has room for one unit per target, resources cover one unit per target, and every target is free. It starts only when every target is free at one offer"; Priority: "a step waiting for a busy building reserves its cost"; format doc: "waiting on `resources` or on a busy building reserves its cost".
- B-B4: "it then pays its first unit on every target and replaces each target's order"; "Because it starts only on idle instances, the units the old order paid have all finished: nothing is cancelled and there is no refund"; format doc: "A `produce` step completes when no instance carries its order any more".
- B-B5: "While the step that blocks later steps waits for busy targets, it holds the targets that are already free: their orders pay nothing ... The hold is worked out again at each offer, so it ends when the step starts, when it fails an earlier check, or when another step blocks later steps instead."
- B-B6: "A reaction `produce` or `research` treats held instances as busy and never holds one."; Priority: "a reaction never reserves"; format doc: "A reaction waits for the same reasons from its run-out instant on".
- B-B7: "A `research` step's candidate buildings are `at` if given, else the tech's `producedBy` (snapshot order). It checks, in order: ... It takes the first free instance in candidate order, then instance number, so while every candidate is busy it waits and takes whichever frees first." with the archery range/council hall-style examples in the next sentences.
- B-B8: "While it runs, the instance's order pays nothing ... when the research ends, a step waiting for that instance takes it first, else the order pays its next unit."
- B-B9: Priority: "At one instant, steps start before orders pay, so a step wins a tie with an order payment: an instance whose unit or research ends at that instant is free for a waiting step before its order pays its next unit." The "wake times unchanged" half is an engine internal (`nextWake` candidates) no doc names: not applicable.
- B-B10: "The hold is worked out again at each offer" and, format doc, "it is set at each offer the step fails" (`waitingFor`).
- B-B11: Priority: "A step waiting on supply, on an age or on a building instance that does not exist reserves nothing"; `produce` check "a targeted instance exists"; format doc wait-reasons table "no targeted instance exists" (`building`).
- B-B12: "a target that never frees leaves it `waiting` at the horizon with the `step-stuck` warning. `pause`, `rally`, `build` and `move` never wait for a building."; format doc: `earlier-step` / `not-reached` for later steps.
- B-B13: not mapped (SGS-190).

B-W (format doc `docs/aoe4-build-order-format.md`, Outputs and "Wait details"; the model doc's Ordering paragraph repeats the check order)
- B-W1: wait-reasons table (`prerequisite` / `villagers` / `population` / `resources` rows with their `waitingFor` kinds) and the Wait details table (`age`, `building`, `building-busy`, `villagers`, `population`, `resources` "given when" column); "An action with no handler always reports it, with a `null` detail". The `null` detail of an unknown unit is schema-impossible: not applicable.
- B-W2: "The order is an age, then a missing building (both `prerequisite`; a `produce` whose unit is above the age and whose producer is not built reports the age), then `villagers` or `population`, then `resources`, then, for `produce` and `research`, a busy building"; model doc: "(an age, then a missing building, then villagers or population, then resources, then a busy building)".
- B-W3: "`waitingFor` is what the last failed check waits for ...: it is set at each offer the step fails, `null` once the step starts" plus the sentence added here: "A step offered more than once at one instant keeps the detail of the last offer, which the next waiting interval accrues." (added)
- B-W4: "so at the horizon a `waiting` step has the detail of its last failed offer and every other step has `null`."
- B-W5: "`waitDetails` holds one `StepWaitEntry` (`detail`, `seconds`) per target ... Each interval the step waits under a `waitBreakdown` reason adds its seconds to the entry whose target matches `waitingFor`, or appends an entry."
- B-W6: "Targets match by kind and, for `age`, the age; ... An entry keeps the numbers of the interval that created it".
- B-W7: "an `age` entry takes the landmark a later interval names, and a later `null` landmark does not clear it."
- B-W8: "in the order each was first waited for ... A target never waited on for any time has no entry."
- B-W9: "so for each reason the seconds of its entries add up to `waitBreakdown`"; "one `StepWaitEntry` ... per target" (unique keys).
- B-W11: "`building` and `building-busy`, the buildings and instance (so a missing Barracks and a busy one are two entries)"; "`age`, `building` and `building-busy` entries count under `prerequisite`"; "(and, for `building-busy`, its `every`)" (added: `every` keeps the value of the creating interval).
- B-W12: `step-stuck` message example in `Outputs` (`... was still waiting on prerequisite at 60:00, from 11:40.`, example cause changed); message form matches `stepStuckWarning`.
- B-W10 (UI wait text): see next section.

Still-stale-sentence search in the model doc: no sentence says queue length is not consulted, that a produce on a busy producer replaces its order, or that `waitingOn`/`waitBreakdown` are the only wait records (searched `queue`, `busy`, `free`, `waitingFor`, `waitDetails`, `waitBreakdown`, `waitingOn`).

### Wait text verification (no rewrite)

UI doc sentences (run cell paragraph): "A step that waited lists each thing it waited for, named by what it was (such as `50 gold` or `a free Archery Range`), with a non-zero time as `<what> <m:ss>`, in the order the result records them and joined with `, `; an entry with no time is left out. A `waiting` step ends with `still waiting for <what>`, or with `still waiting on <cause>` when the result names no `waitingFor` for it, and a `not-reached` step reads `not reached (<cause>)`. The popover's `Blocked by:` part shows the same text."
Checked against `step-annotations.ts` `blockedByText` (`waits` from `timing.waitDetails` with `seconds > 0`, `<text> <m:ss>`, then `still waiting for ${waitingForText}` or `still waiting on ${timing.waitingOn}`; `not reached (${timing.waitingOn})`), `annotationDetailText` (`Still waiting. Blocked by: ...` / `Waited <time>. Blocked by: ...`), and `wait-detail.ts` `waitDetailText`, one reason per kind: `age` -> `Castle Age (King's Palace)` form, `building` -> `a Barracks` / `Town Center 2`, `building-busy` -> `a free Archery Range`, `villagers` -> `N more villagers at <node>`, `population` -> `N population space (u/s used)`, `resources` -> `50 gold and 20 wood`. The old fixed reason order is not described anywhere (`git grep "in that order"` finds nothing). All agree; nothing rewritten.

Units produced row (SGS-198's): "each `unitsProduced` `baseId`, in order of first appearance (one line per unit line, every tier summed) | the entry's `lineName`" matches `unitLineSeries` (key `baseId`, name `lineName`, tiers summed, first-appearance order). Unchanged.

## Acceptance searches (`git grep -n -i -E` over `docs/`)

- `tier <tier>|kind legend renders above|still waiting on resources|Queue length is not consulted|replaces its order \(a switch\)|MarkerLegend|Show .* marker labels`: no matches.
- `git grep -n -i "marker legend" docs/`: one match, `docs/aoe4-build-order-ui.md:135`, "Charts have no marker legend of their own; the marker control below is the only one."
- `git grep -n "step-kind-legend" docs/`: one match, `docs/aoe4-build-order-ui.md` Help dialog section ("`step-kind-legend`, which is shown only in the dialog"). `git grep -n -i -E "legend[^.]*above" docs/aoe4-build-order-ui.md`: no matches (the two rewritten sentences are phrased "in the text view or the table view" / "in either view" so the pattern stays empty).
- `git grep -n "in that order" docs/aoe4-build-order-ui.md`: no matches.
- `git grep -n "unitId" docs/aoe4-build-order-ui.md`: no matches. (`unitId` remains in the format doc's `unitsProduced` bullet, which stays true of the API result.)

## Module map check (lib README)

`git ls-files lib/aoe4-build-order/` non-test files, each with a Module map entry: `api-route.ts`, `api.ts`, `blob-build-store.ts`, `build-store.ts`, `builds-routes.ts`, `builds.ts`, `civ-rules.ts`, `construction.ts`, `data-schema.ts`, `data.ts`, `depletion.ts`, `effects.ts`, `engine-common.ts`, `english-catalog.ts`, `format-time.ts`, `gather.ts`, `houses.ts`, `landmarks.ts`, `markers.ts`, `model.ts`, `named-builds-routes.ts`, `named-builds.ts`, `parse-text.ts`, `production-buildings.ts`, `research.ts`, `save-rate-limit.ts`, `saved-builds.ts`, `schema.ts`, `simulate.ts`, `step-options.ts`, `text-to-build.ts`, `unit-lines.ts` (added), `wait-detail.ts` (listed once, already present). `production-floors.ts` is listed under Test support. `README.md` itself is the index.

## ARCHITECTURE.md

Added rows "AoE4 wait wording" (`lib/aoe4-build-order/wait-detail.ts`: browser-safe, imported by the page, value imports only `model.ts`, `engine-common.ts`, `landmarks.ts`) and "AoE4 chart markers and zoom" (`components/apps/aoe4-build-order/chart-markers.ts` the one home of chart marker rules; `chart-zoom.ts` pure, no React). All three files exist. "It does not list every file" sentence unchanged. Not applicable (no rule to record): `unit-lines.ts`, `use-chart-zoom.ts`, `page-help.tsx`.

## Names checked by `git grep`

Test ids: `chart-table`, `chart-header-row`, `chart-body-row`, `chart-zoom-bar`, `chart-zoom-range`, `chart-zoom-pan-earlier`, `chart-zoom-pan-later`, `chart-zoom-reset`, `chart-zoom-selection`, `chart-upgrade-dot`, `chart-pinned-upgrade-dot`, `chart-marker-legend`, `chart-marker-legend-item`, `chart-pinned-legend`, `help-open`, `help-modal`, `help-close`, `step-kind-legend`, `results-last-good`, `data-zoom-from`, `data-zoom-to`. Functions and fields: `waitDetailText`, `unitLineName`, `instanceFree`, `offerStep`, `offerSteps`, `startProduction`, `accrueWait`, `held`, `waitingFor`, `waitDetails`, `researchHandler`, `researchMarker`, `unitLineSeries`, `unitUpgradeDots`, `lineName`, `MarkerControl`. All found.

## CONTEXT.md rows to add or change (manager applies)

Key surfaces, per the ticket's On merge line: add `waitDetailText` (`lib/aoe4-build-order/wait-detail.ts`), `unitLineSeries` and `unitUpgradeDots` (`components/apps/aoe4-build-order/result-series.ts`), and `MarkerControl` (`components/apps/aoe4-build-order/chart-legend.tsx`) with `chart-markers.ts`. The Design docs table needs no change (no doc moved or renamed).

## Lint, codegen, link check

- `commands.lint` (`npx tsc --noEmit && npm run lint:dup`) checks code and tests, not Markdown, and no code changed; not run. `commands.codegen` is empty; no generated docs.
- Links added: `../../docs/aoe4-build-order-format.md#wait-details`, `../../docs/aoe4-build-order.md#model-rules` (lib README), `docs/aoe4-build-order-format.md#wait-details`, `docs/aoe4-build-order-ui.md` (ARCHITECTURE.md). The targets exist (`### Wait details` in the format doc, `## Model rules` in the model doc, the UI doc file).
- `git diff --name-only origin/main`: `ARCHITECTURE.md`, `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md`, `lib/aoe4-build-order/README.md`. No code, test, OpenAPI, data, `pages/apps/aoe4-build-order.tsx` or `page-help.tsx` change.

## Out-of-scope findings

- The help dialog returns focus to `help-open` through the browser's native `<dialog>` close behavior; `page-help.tsx` has no explicit focus restore. The doc states the behavior as the design does (B-H2); an acceptance spec covers it. If a browser did not restore focus, only the acceptance spec would show it.
- The series legend's `aria-pressed` (`chart-legend.tsx` `SeriesLegend`) is `true` when a series is hidden, the opposite meaning from the marker control's (`true` when shown). The UI doc states the marker control's meaning only; the inconsistency is a possible follow-up, not a doc fix.
- Zoom B-Z1 detail (tooltip hovering pauses while the pointer is captured) and B-H1's "max height about 80% of the viewport" are not stated in the docs (implementation effects, not rules a reader needs).

## Status

needs_review
