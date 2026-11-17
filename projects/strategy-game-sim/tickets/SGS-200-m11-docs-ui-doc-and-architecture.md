# SGS-200: Document the M11 page and module changes in the UI doc, the model and format docs, the lib README and ARCHITECTURE.md

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: low
- **Invariants**: A3 (the docs describe the busy-building rule that changes timing; adjacent, no code changes)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; about 100 to 150 changed doc lines across `docs/aoe4-build-order-ui.md`, the two other AoE4 docs, `lib/aoe4-build-order/README.md` and `ARCHITECTURE.md`)
- **Depends on**: SGS-190, SGS-191, SGS-192, SGS-193, SGS-197, SGS-198, SGS-199
- **On merge**: CONTEXT.md Key surfaces: add waitDetailText (lib/aoe4-build-order/wait-detail.ts), unitLineSeries and unitUpgradeDots (result-series.ts), MarkerControl and chart-markers.ts
- **Source**: milestone M11 criterion M11.7 (design/M11.md, M11.7 row); plans/M11-20261116.md outline K

## Context

M11 changes what the page draws and how waits read. The tickets of the milestone each fixed only the doc sentences their own change made untrue and left the new description to this ticket. Read at the integrated end state (every Depends-on ticket merged; the chart table, marker control and zoom tickets are ancestors of SGS-197 and SGS-198). The owner decided (Q128, option B) that the help modal lands last and already describes the finished page, so this ticket does not touch the help modal's content or `components/apps/aoe4-build-order/page-help.tsx`.

The module index of the engine is `lib/aoe4-build-order/README.md` ("Module map", "The event loop", "Where the pieces plug in"); `ARCHITECTURE.md` says where things go and "does not list every file", recording a file only where it carries a rule (an import restriction, the one home of a concern). New engine files are listed in the lib README; `ARCHITECTURE.md` gains only the M11 files that carry such a rule.

## Scope

Write every doc against the code at the base when the ticket starts, not against this ticket's wording. Each claim names a behavior the design (`design/M11.md`) states as a rule: the sections to cover are the rule groups B-T (chart table), B-M (marker control), B-Z (time window), B-U (unit lines and dots), B-H1 to B-H5, B-H7 to B-H9 (help button and dialog behavior, not its section text), B-W10 (wait text) and B-B (busy buildings). Docs describe rules, not measured timings.

**`docs/aoe4-build-order-ui.md`**
- Chart series table row "Units produced (Units view)" (respec 2): SGS-198 owns the row (one series per unit line, key `baseId`, name `lineName`, tiers summed, per `unitLineSeries`). Check it against the code; do not rewrite it. Rewrite only what SGS-198 left: the sentences around the row that depend on it (the Buildings view comparison, "pinned run follows the view, ... matched by key", the legend naming rule) and the upgrade-dot description below.
- Add the Units view's upgrade dots: one filled dot per `upgradeTargets` upgrade of a produced line at the line's value at that time, dashed rings for the pinned run's, hidden with their line, not affected by the marker control's `Unit tier` item, not drawn outside a zoom window, none in the Buildings view.
- Chart table: Results draws the charts as one table whose row groups are the charts (header row, body row), with the column shape and collapse behavior B-T states. The "Chart controls" paragraph's "title row" and "everything under the title row (the series legend, the plot and the marker legend)" wording is re-read against it: collapse hides the chart's body row, and nothing a chart holds is a marker legend. The "Key results" title row of the key results panel is a different row, outside the chart table (B-T6), and keeps its wording.
- Marker control: the Results paragraph on markers (as edited by the marker-control ticket) is re-read end to end against the code and completed to B-M1 to B-M10: one control above the chart table, click hides a kind on every chart, `aria-pressed` means shown, hover/focus labelling and its fallback, pinned age-ups following the age-up toggle, not stored, reset on reload. Remove any leftover per-chart marker-legend statement: at the base the Results paragraph says a marker legend titled "Markers" sits in its own row below the series legend, that a run with no markers draws no marker legend, what the marker legend lists, and that the pinned legend comes after the marker legend.
- Zoom: a new description of B-Z1 to B-Z15: drag-select on the plot zooms a chart (minimum span), Shift+drag pans, the zoom bar's range text, pan buttons and Reset, each chart's own window, survival across collapse, reorder, view toggle, a new run, pin and unpin, no storage, behavior on dimmed results, Escape cancels a selection, and the Tab order.
- Wait text (respec 2): SGS-193 owns the run-cell wait sentences (the `<cause> <m:ss>` list and the `still waiting on <cause>` form) and keeps the gutter popover sentence true (`annotationDetailText` forms, `Still waiting. Blocked by: ...`). Check, do not rewrite, these sentences: confirm they agree with `waitDetailText` and the B-W10 rules as SGS-193 built them (follow SGS-193's as-built text if its open owner question is answered later). Fix only a sentence still untrue after SGS-193, for example another sentence quoting the old wait text. `not reached (<cause>)` is unchanged.
- Step kind legend: two sentences place the legend on the page and become untrue after the help-modal ticket (B-H7): the cell paragraph's "a legend of the step kinds (`step-kind-legend`) above the table (the text view shows the same legend above its editor)" and the text-view paragraph's "The kind legend renders above the text editor as well as above the step table ...". Rewrite both to say the kinds are explained in the help dialog and the page no longer shows the legend above either view. Do not reproduce the dialog's section text.
- Help dialog: add a short section for the `How this page works` button and dialog behavior (B-H1 to B-H5, B-H8, B-H9): opens modally, closes by its button, Escape or a backdrop click, returns focus, always enabled, closed in the server render, in the heading row before the run bar. State that it explains the page; do not copy the sections' text.
- Re-read the rest of the page for sentences these changes touch (`grep` for `legend`, `marker`, `unitId`, `zoom`, `title row`, `wait`, `blocked`, `queue`) and fix any other that is untrue.

**`docs/aoe4-build-order.md` and `docs/aoe4-build-order-format.md`**
- Check, do not rewrite, the sentences the busy-building, unit-line and wait-detail tickets already edited (Priority, Queues and research paragraphs of the model doc; the format doc's `steps` field list, wait-reasons table, `unitsProduced` and `markers` result sentences). Fill any B-B rule or `waitingFor`/`waitDetails` rule still missing, and any sentence still saying queue length is not consulted, that a produce on a busy producer replaces its order, or that `waitingOn`/`waitBreakdown` are the only wait records.
- The `step-stuck` message example in the format doc quotes `was still waiting on resources`, which the search below matches. The message itself is unchanged (B-W12); change the example's cause to one that does not contain that phrase (for example `prerequisite`, a real `waitingOn` value) so the example still reads as the message form.
- The format doc's `unitsProduced` description (one `UnitSeries` per unit entry and tier, keyed by `unitId`) stays true of the API result; only the chart groups by line. Leave it unless the unit-line ticket left it untrue.

**`lib/aoe4-build-order/README.md`** (respec 1)
- Module map: add `wait-detail.ts` (building, keying and wording wait details; browser-safe, because the page imports it, so it value-imports only the modules the design allows) under the section that fits it, and `unit-lines.ts` (the unit line display name used for `unitsProduced`). Extend the `engine-common.ts` entry with `instanceFree`, the one test of whether a building instance is free for a step. Extend the `markers.ts` and `research.ts` entries if their M11 changes (research marker unit, busy research target) make them incomplete. Follow the file's style: what the file owns and its main exports, no rules (the README states none and links the docs).
- The event loop and "Where the pieces plug in": re-read against the code and fix what M11 makes untrue or incomplete, at least: a step waiting for a busy building (held instance, `startProduction` skipping held instances), handlers reporting a wait detail that `offerStep` stores, and wait time accrued per detail (`waitDetails`) as well as per reason. Name functions the code has; link the model or format doc section for the rule.
- Data flow "Result" bullet and "Where to change what": fix any line M11 makes untrue (for example a new wait detail kind lives in `wait-detail.ts`); leave the rest.

**`ARCHITECTURE.md`** (respec 1)
- Record only the M11 files that carry a rule of the kind this file already records, in the "Where files go" table (a new row, or an extended AoE4 row): `lib/aoe4-build-order/wait-detail.ts` (browser-safe, imported by the page, so it value-imports only the modules the design allows), `components/apps/aoe4-build-order/chart-markers.ts` (the one home of every chart marker rule: colours, labels, kinds shown, label placement) and `components/apps/aoe4-build-order/chart-zoom.ts` (pure time-window math, no React). Each entry says what the file owns and its rule; do not restate behavior the docs hold.
- `unit-lines.ts`, `use-chart-zoom.ts` and `page-help.tsx` carry no such rule; they are not added (the lib README covers `unit-lines.ts`), and the header sentence "It does not list every file" stays.

**Out of scope:** any code, test, OpenAPI or data change; any file other than `docs/**`, `lib/aoe4-build-order/README.md` and `ARCHITECTURE.md`; the help modal's content and `page-help.tsx` (Q128); `docs/api/openapi.json` (changed by the engine tickets); `data/aoe4-build-order/README.md` (SGS-190 edits it); measured results (timings, counts); factory files (the On merge line covers CONTEXT.md).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 2) End-state verification (the checks match SGS-198's and SGS-193's edits; this ticket edits none of them): stale-phrase search, run with `git grep -n -i -E` over `docs/` and shown in the report: `tier <tier>`, `kind legend renders above`, `still waiting on resources`, `Queue length is not consulted` and `replaces its order \(a switch\)` find nothing. Each of these matches at origin/main except where a Depends-on ticket already removes it (`Queue length is not consulted` and `replaces its order (a switch)`, model doc, removed by SGS-190); `still waiting on resources` is the `step-stuck` example Scope changes. `MarkerLegend` and `Show .* marker labels` also find nothing (absent at origin/main; kept so wording the marker-control ticket might add is caught).
- [ ] (respec 1) Search `git grep -n -i "marker legend" docs/`: every match, if any, states that charts have no marker legend; none describes one as drawn, listed, collapsed or placed relative to another legend. At origin/main it matches the UI doc's Results and Chart controls paragraphs.
- [ ] (respec 1) Search `git grep -n "step-kind-legend" docs/` and `git grep -n -i -E "legend[^.]*above" docs/aoe4-build-order-ui.md`: every `step-kind-legend` match is in the help-dialog section and places the legend inside the dialog, and no sentence places the kind legend above the editor or the step table. At origin/main both match the cell paragraph and the second matches the text-view paragraph.
- [ ] (respec 2) End-state verification: `git grep -n "in that order" docs/aoe4-build-order-ui.md` finds no match in a wait-text sentence (run cell or gutter popover) at the integrated end state. SGS-193 removes the match; this ticket only checks it.
- [ ] (respec 2) End-state verification: `git grep -n "unitId" docs/aoe4-build-order-ui.md`: no match says a Units chart series is keyed or named by `unitId`; a match that remains says the chart does not key by it. SGS-198 rewrites the Units produced row; this ticket only checks it and the sentences around it.
- [ ] (respec 1) The Chart controls paragraph describes collapse as hiding the chart's body row and lists nothing under the header that is a marker legend; the key results panel's "Key results" title row sentence is unchanged unless the code makes it untrue.
- [ ] (respec 2) Verification of the Units produced row (SGS-198's) and its surroundings: the UI doc's Units produced description matches the code: one line per unit line keyed `baseId` and named `lineName`, with upgrade dots for the current run and rings for a pinned run. A reader can tell what B-U1 to B-U9 specify.
- [ ] The UI doc states each of B-T, B-M and B-Z (rule groups) in at least one sentence per rule number (B-T1 to B-T6, B-M1 to B-M10, B-Z1 to B-Z15, B-U1 to B-U9), and the report maps each rule to the doc location that states it; a rule that does not apply to a doc (such as B-T4 persistence, which only restates an unchanged layout rule) is marked as such with the reason.
- [ ] (respec 2) Verification, no rewrite implied: the UI doc's wait text sentences (run cell and gutter popover, as SGS-193 left them) agree with the B-W10 table and with the text `waitDetailText` produces for at least one reason of each `kind`; the old fixed reason order (`resources, villagers, population, prerequisite`) is no longer described as the order of the entries. The report quotes the doc sentence and the code it was checked against.
- [ ] The UI doc has a help-dialog section whose claims match the code in `pages/apps/aoe4-build-order.tsx` and `page-help.tsx` (read only).
- [ ] (respec 1) `lib/aoe4-build-order/README.md` lists `wait-detail.ts` and `unit-lines.ts` in its Module map and names `instanceFree` in the `engine-common.ts` entry; its event-loop and "Where the pieces plug in" bullets mention the busy-building wait and where a wait detail is recorded and accrued, naming only functions that exist at the integrated end state. Every file in `lib/aoe4-build-order/` that is not a test or test-support file has a Module map entry (the report shows `git ls-files lib/aoe4-build-order/` against the map).
- [ ] (respec 1) `ARCHITECTURE.md` names `lib/aoe4-build-order/wait-detail.ts`, `components/apps/aoe4-build-order/chart-markers.ts` and `components/apps/aoe4-build-order/chart-zoom.ts`, each with its directory and the rule it carries (browser-safe and imported by the page; the one home of chart marker rules; pure, no React); each file exists at the integrated end state (every Depends-on ticket merged). Its "does not list every file" sentence is unchanged. The report marks `unit-lines.ts`, `use-chart-zoom.ts` and `page-help.tsx` as not applicable (no rule to record).
- [ ] Every test id, file, function and field a doc names exists at the integrated end state (the report lists the ids and names it checked by `git grep`); a name the code does not have is removed or corrected.
- [ ] (respec 1) Only `docs/**`, `lib/aoe4-build-order/README.md` and `ARCHITECTURE.md` change (`git diff --name-only` over the ticket's branch); no code, test, OpenAPI or data file, and neither `pages/apps/aoe4-build-order.tsx` nor `page-help.tsx`.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-16

- Underspecified: the engine module index `lib/aoe4-build-order/README.md` was left out (and forbidden), so six file entries were forced into `ARCHITECTURE.md` against its "does not list every file" rule; and the stale-phrase search missed real stale forms (`marker legend`, the cell paragraph's `step-kind-legend` sentence, `in that order`, `unitId` in the Units row).
- Changed: Scope and criteria add the lib README (Module map entries for `wait-detail.ts`, `unit-lines.ts`, `instanceFree`; event-loop re-read); `ARCHITECTURE.md` now records only `wait-detail.ts`, `chart-markers.ts` and `chart-zoom.ts`; the search criterion is split into per-form checks that match at origin/main; "title row" is kept for the chart header (SGS-194 keeps it true) and the Key results row is named as unchanged; end-state existence replaces "exists at the base"; the grep list adds `wait`, `blocked`, `queue`.
- Branch work: none exists yet.

## Re-spec 2 - 2026-11-16

- Underspecified: Scope had this ticket rewrite the Units produced row (SGS-198's), the run-cell wait sentences (SGS-193's) and a gutter popover sentence that stays true, so two tickets would edit the same text.
- Changed: the Units row and the wait sentences become checks against the code; this ticket rewrites only the sentences around the row and the upgrade-dot description; the gutter-popover rewrite is dropped; the related criteria become end-state verifications.
- Branch work: none exists yet.
