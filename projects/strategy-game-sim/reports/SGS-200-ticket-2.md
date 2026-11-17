# SGS-200 ticket report (n=2, re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-200-m11-docs-ui-doc-and-architecture.md (ticket-lint exit 0)

Verified against origin/main 87f0cd7.

## Summary

Docs ticket, component aoe4-build-order, M11, risk low, about 100-150 doc lines, depends on SGS-190, 191, 192, 193, 197, 198, 199. Re-spec 1 folds in spec-gate-1:

- Gap 1 (taken as the report proposed, not an owner call): `lib/aoe4-build-order/README.md` added to Scope (Module map entries for `wait-detail.ts`, `unit-lines.ts`, `instanceFree` under `engine-common.ts`, `markers.ts`/`research.ts` entries if incomplete; re-read of The event loop, Where the pieces plug in, Data flow Result, Where to change what). `ARCHITECTURE.md` now records only `wait-detail.ts` (browser-safe), `chart-markers.ts` (one home of marker rules), `chart-zoom.ts` (pure); `unit-lines.ts`, `use-chart-zoom.ts`, `page-help.tsx` marked not applicable in the report; its "does not list every file" sentence stays. Changed-files criterion and Out of scope widened to the lib README.
- Gap 2: the one search criterion is split into per-form checks, each run at origin/main:
  - `tier <tier>`, `kind legend renders above`, `still waiting on resources`, `Queue length is not consulted`, `replaces its order \(a switch\)` all match at base (correction to the gate: `kind legend renders above` does match, UI doc line 20 text-view paragraph; the gate looked only at the cell paragraph). `MarkerLegend` and `Show .* marker labels` kept as belt-and-braces, noted as absent at base.
  - New: `marker legend` (every match must say charts have none), `step-kind-legend` plus `legend[^.]*above` over the UI doc (matches lines 20 and 99 at base), `in that order` (UI doc run-cell sentence), `unitId` in the UI doc (Units row).
  - `title row` is not a stale-phrase search: SGS-194 states the chart "title row" sentences stay true, and B-T6 calls the title cell a row-group header; the ticket instead requires collapse to be described as hiding the body row with no marker legend, and names the Key results title row (outside the chart table, B-T6) as unchanged.
- Notes: "exists at the base" replaced by "at the integrated end state"; Scope grep list adds `wait`, `blocked`, `queue`; the gutter popover sentence (UI doc line 20) is named in the wait-text bullet; `unit-lines.ts` described as the unit line display name.

## Diagrams

None (docs only).

## Open questions

None.

## Overlap

None. SGS-190 owns the model-doc queue phrases and `data/aoe4-build-order/README.md` (left out of scope here); SGS-194/195 own their title-row and marker-paragraph edits, which this ticket re-reads. No Depends-on ticket edits `lib/aoe4-build-order/README.md`.

Scratch checkouts: none made.
