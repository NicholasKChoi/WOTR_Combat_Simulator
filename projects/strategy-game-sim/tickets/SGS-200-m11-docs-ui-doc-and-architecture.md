# SGS-200: Document the M11 page and module changes in the UI doc, the model and format docs, and ARCHITECTURE.md

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: low
- **Invariants**: A3 (the docs describe the busy-building rule that changes timing; adjacent, no code changes)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; about 80 to 120 changed doc lines across `docs/aoe4-build-order-ui.md`, the two other AoE4 docs and `ARCHITECTURE.md`)
- **Depends on**: SGS-190, SGS-191, SGS-192, SGS-193, SGS-197, SGS-198, SGS-199
- **On merge**: CONTEXT.md Key surfaces: add waitDetailText (lib/aoe4-build-order/wait-detail.ts), unitLineSeries and unitUpgradeDots (result-series.ts), MarkerControl and chart-markers.ts
- **Source**: milestone M11 criterion M11.7 (design/M11.md, M11.7 row); plans/M11-20261116.md outline K

## Context

M11 changes what the page draws and how waits read. The tickets of the milestone each fixed only the doc sentences their own change made untrue and left the new description to this ticket. Read at the integrated end state (every Depends-on ticket merged; the chart table, marker control and zoom tickets are ancestors of SGS-197 and SGS-198). The owner decided (Q128, option B) that the help modal lands last and already describes the finished page, so this ticket does not touch the help modal's content or `components/apps/aoe4-build-order/page-help.tsx`.

## Scope

Write every doc against the code at the base when the ticket starts, not against this ticket's wording. Each claim names a behavior the design (`design/M11.md`) states as a rule: the sections to cover are the rule groups B-T (chart table), B-M (marker control), B-Z (time window), B-U (unit lines and dots), B-H1 to B-H5, B-H7 to B-H9 (help button and dialog behavior, not its section text), B-W10 (wait text) and B-B (busy buildings). Docs describe rules, not measured timings.

**`docs/aoe4-build-order-ui.md`**
- Chart series table row "Units produced (Units view)": says each `unitsProduced` `unitId` is a series named `<name> (tier <tier>)`. After SGS-198 it is one series per unit line, key `baseId`, name `lineName`, tiers summed. Rewrite the row and the sentences around it that depend on it (the Buildings view comparison, "pinned run follows the view, ... matched by key", the legend naming rule).
- Add the Units view's upgrade dots: one filled dot per `upgradeTargets` upgrade of a produced line at the line's value at that time, dashed rings for the pinned run's, hidden with their line, not affected by the marker control's `Unit tier` item, not drawn outside a zoom window, none in the Buildings view.
- Chart table: Results draws the charts as one table whose row groups are the charts (title row, body row), with the column shape and collapse behavior B-T states; the "Chart controls" paragraph's "title row" and "everything under the title row" wording is re-read against it.
- Marker control: the Results paragraph on markers (as edited by the marker-control ticket) is re-read end to end against the code and completed to B-M1 to B-M10: one control above the chart table, click hides a kind on every chart, `aria-pressed` means shown, hover/focus labelling and its fallback, pinned age-ups following the age-up toggle, not stored, reset on reload. Remove any leftover per-chart marker-legend statement (the phrase `MarkerLegend` and the "Show ... marker labels" wording are the known stale forms).
- Zoom: a new description of B-Z1 to B-Z15: drag-select on the plot zooms a chart (minimum span), Shift+drag pans, the zoom bar's range text, pan buttons and Reset, each chart's own window, survival across collapse, reorder, view toggle, a new run, pin and unpin, no storage, behavior on dimmed results, Escape cancels a selection, and the Tab order.
- Wait text: the sentence that lists each cause as `<cause> <m:ss>` "in that order" and the `still waiting on <cause>` form (cell paragraph, and the popover sentence if it quotes the text) are rewritten to the B-W10 table as built by the annotation ticket: entries in first-accrued order named by what is waited for, the `still waiting for <what>` tail for a `waiting` step, and the `still waiting on <cause>` fallback when the step has no `waitingFor`. `not reached (<cause>)` is unchanged.
- Step kind legend: the sentence that says the legend renders above the table and above the text editor is untrue after the help-modal ticket (B-H7); rewrite it to say the kinds are explained in the help dialog and the page no longer shows the legend above either view. Do not reproduce the dialog's section text.
- Help dialog: add a short section for the `How this page works` button and dialog behavior (B-H1 to B-H5, B-H8, B-H9): opens modally, closes by its button, Escape or a backdrop click, returns focus, always enabled, closed in the server render, in the heading row before the run bar. State that it explains the page; do not copy the sections' text.
- Re-read the rest of the page for sentences these changes touch (`grep` for `legend`, `marker`, `unitId`, `zoom`, `title row`) and fix any other that is untrue.

**`docs/aoe4-build-order.md` and `docs/aoe4-build-order-format.md`**
- Check, do not rewrite, the sentences the busy-building, unit-line and wait-detail tickets already edited (Priority, Queues and research paragraphs of the model doc; the format doc's `steps` field list, wait-reasons table, `unitsProduced` and `markers` result sentences). Fill any B-B rule or `waitingFor`/`waitDetails` rule still missing, and any sentence still saying queue length is not consulted, that a produce on a busy producer replaces its order, or that `waitingOn`/`waitBreakdown` are the only wait records.
- The `step-stuck` message example in the format doc quotes `was still waiting on resources`, which the search below matches. The message itself is unchanged (B-W12); change the example's cause to one that does not contain that phrase (for example `prerequisite`, a real `waitingOn` value) so the example still reads as the message form.

**`ARCHITECTURE.md`**
- Name the modules M11 adds, in the places the file already describes AoE4 files: `lib/aoe4-build-order/wait-detail.ts` (builders and readers of wait details; browser-safe, imported by the page), `lib/aoe4-build-order/unit-lines.ts` (the unit-line name), and under `components/apps/aoe4-build-order/` `chart-markers.ts` (all marker code), `chart-zoom.ts` (time-window math), `use-chart-zoom.ts` (the drag-select hook) and `page-help.tsx` (the help dialog). Each entry says what the file owns and, where a module has an import rule (browser-safe, no React), that rule. Add a row or extend one; do not restate behavior the docs hold.

**Out of scope:** any code, test, OpenAPI or data change; the help modal's content and `page-help.tsx` (Q128); `docs/api/openapi.json` (changed by the engine tickets); measured results (timings, counts); factory files (the On merge line covers CONTEXT.md).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A search of `docs/` for the stale phrases `MarkerLegend`, `tier <tier>`, `Show .* marker labels`, `still waiting on resources`, `kind legend renders above`, `Queue length is not consulted` and `replaces its order (a switch)` finds nothing; this is the plan's check, run with `git grep -n` over `docs/` and shown in the report. It must hold although `still waiting on resources` is today the `step-stuck` example in the format doc (Scope changes that example).
- [ ] The UI doc's Units produced description matches the code: one line per unit line keyed `baseId` and named `lineName`, with upgrade dots for the current run and rings for a pinned run, and says no series is keyed by per-tier `unitId`. A reader can tell what B-U1 to B-U9 specify.
- [ ] The UI doc states each of B-T, B-M and B-Z (rule groups) in at least one sentence per rule number (B-T1 to B-T6, B-M1 to B-M10, B-Z1 to B-Z15, B-U1 to B-U9), and the report maps each rule to the doc location that states it; a rule that does not apply to a doc (such as B-T4 persistence, which only restates an unchanged layout rule) is marked as such with the reason.
- [ ] The UI doc's wait text sentences agree with the B-W10 table and with the text `waitDetailText` produces for at least one reason of each `kind`; the old fixed reason order (`resources, villagers, population, prerequisite`) is no longer described as the order of the entries. The report quotes the doc sentence and the code it was checked against.
- [ ] No doc says the step kind legend renders above the editor or the step table, and the UI doc has a help-dialog section whose claims match the code in `pages/apps/aoe4-build-order.tsx` and `page-help.tsx` (read only); neither is edited (`git diff --name-only` over the ticket's branch lists only `docs/**` and `ARCHITECTURE.md`).
- [ ] `ARCHITECTURE.md` mentions `wait-detail.ts`, `unit-lines.ts`, `chart-markers.ts`, `chart-zoom.ts`, `use-chart-zoom.ts` and `page-help.tsx`, each with the right directory, and each file exists at the base. A doc-only search over `ARCHITECTURE.md` and `docs/` for each of those six names finds it.
- [ ] Every test id, file, function and field a doc names exists at the base (the report lists the ids and names it checked by `git grep`); a name the code does not have is removed or corrected.
- [ ] Only `docs/**` and `ARCHITECTURE.md` change; no code, test, OpenAPI or data file.
- [ ] No INVARIANTS.md regressions

## Open questions

none
