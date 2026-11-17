# SGS-200 review 8

- Ticket: SGS-200 (Docs, risk low), branch `sgs-200-m11-docs`, tip bb27bc2
- Verdict: APPROVE

## Blocking findings

None.

## What I checked

Read every changed sentence in the diff (ARCHITECTURE.md, format doc, UI doc, lib README) against the code at the tip.

- Changed files are `ARCHITECTURE.md`, `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md` and `lib/aoe4-build-order/README.md`. No code, test, OpenAPI, data, `pages/apps/aoe4-build-order.tsx` or `page-help.tsx` change. Pass.
- Stale-phrase search over `docs/` for `tier <tier>`, `kind legend renders above`, `still waiting on resources`, `Queue length is not consulted`, `replaces its order \(a switch\)`, `MarkerLegend`, `Show .* marker labels` and `in that order`: no matches. `unitId` in the UI doc: no matches. `legend[^.]*above` in the UI doc: no matches. Pass.
- `marker legend` matches once, UI doc line 135: "Charts have no marker legend of their own; the marker control below is the only one." It states there is none. Pass.
- `step-kind-legend` matches once, in the Help dialog section, placed inside the dialog. In `page-help.tsx`, `StepKindLegend` is rendered in the `help-kinds` section. Pass.
- Help dialog section matches `page-help.tsx` and the heading row in `pages/apps/aoe4-build-order.tsx` (lines 335-337):
  - `<dialog>` is native and titled `How this page works`.
  - The Close button is first in the dialog.
  - `wrapTab` keeps Tab inside the dialog.
  - Backdrop-click closes through `outsideRect`.
  - Content scrolls inside the dialog and `scrollTop` resets on open.
  - The button has no `disabled` prop and `open()` only calls `showModal()`.
  - The section list in the doc (editor views, step kinds, tint and Blocked by, charts, pin, save) matches the dialog's sections.
- Chart table and marker control:
  - `chart-table` is labelled `Results charts` and has a four-column `colgroup` and no `thead`.
  - Each chart is a `tbody` carrying its chart id as `data-testid`, `data-zoom-from` and `data-zoom-to`, with `chart-body-row` `hidden={collapsed}`.
  - The "Markers" `h3` and the `<kind> markers` button names match `chart-legend.tsx`, `aria-pressed={!hidden.has(kind)}` and `opacity: 0.5`.
  - The control sits inside `results-last-good`.
- Zoom:
  - `MIN_ZOOM_SECONDS = 30`, and `zoomTo` returns null for a whole-game window.
  - Escape is handled in `use-chart-zoom.ts`.
  - The zoom bar's `aria-disabled` and its button names match.
  - Reset focuses `chart-collapse`.
- Upgrade dots: the `chart-upgrade-dot` and pinned-ring titles, the dashed `3 2` stroke and the z-index constants match `line-chart.tsx`.
- Format doc:
  - The `step-stuck` example cause `prerequisite` is a real `waitingOn` value, and the message form matches `stepStuckWarning`.
  - "last offer keeps the detail" matches `offerStep`, which overwrites `waitingFor`, and `accrueDetail`, which reads it.
  - The `every` clause matches `accrueDetail`, which keeps the first entry's detail.
  - "one line per unit line" matches `unitSeries` and `lineName`.
- Lib README:
  - `unitLineName`, `unitSeries`, `offerStep`, `offerSteps`, `engine.held`, `startProduction`, `accrueWait`, `instanceFree` and `researchMarker(entry, at, unit?)` all exist.
  - `unit-lines.ts` and `wait-detail.ts` are each listed once.
  - The implementer's Module map listing of every non-test file against `git ls-files` is plausible; not re-run in full.
- ARCHITECTURE.md:
  - `wait-detail.ts` has value imports only from `engine-common`, `landmarks` and `model`, plus a type import from `simulate`.
  - `chart-zoom.ts` has one `import type` and no React.
  - The "does not list every file" sentence is unchanged.
  - The unit-lines, `use-chart-zoom.ts` and `page-help.tsx` entries are left out, as ticket respec 1 asks.
- Implementer's rule maps (B-T, B-M, B-Z, B-U, B-H, B-B, B-W) are present and the spot-checked quoted sentences are in the docs. Not-applicable marks (B-T4, the `null` detail of an unknown unit, the B-B9 `nextWake` half, B-H6, B-B13, B-W10) carry reasons.
- Wait-text verification (B-W10): the UI doc sentences agree with `blockedByText`, `annotationDetailText` and `waitDetailText`. The fixed reason order is no longer described.

## Acceptance criteria

All pass: stale-phrase search, marker legend search, step-kind-legend placement, `in that order`, `unitId`, Chart controls wording (the Key results title row is unchanged), Units row and its surroundings, UI rule map, B-B and B-W map, wait-text verification, help-dialog section and map, lib README, ARCHITECTURE.md, names exist, scope of the diff, and no INVARIANTS regression (docs only; A3 is described, not changed).

## Invariants

A3: docs only, no code change; the busy-building description matches the code read above. Holds.

## Linter and bot

`commands.lint` checks code only, and no code changed, so I did not run it. REPO.md has no `reviewBot.cli`, so there are no bot findings. UI inspection was skipped: the diff changes only docs.

## Non-blocking notes

- `lib/aoe4-build-order/README.md`, "Where to change what", new wait detail kind bullet: "a route change also updates `docs/api/openapi.json`" is loosely worded. A new detail kind changes the result schema, not a route. This is harmless; `building-busy` does appear in `openapi.json`.
- The format doc sentence "A step offered more than once at one instant..." is inserted mid-bullet and makes a long line. This is readable.
- Implementer's out-of-scope note stands: `SeriesLegend`'s `aria-pressed` means hidden, the opposite of the marker control's. This is a possible follow-up, not a doc defect.

## Coverage

Reviewed the full diff of all four files against the code files named above. Not reviewed: the implementer's full B-Z sentence-by-sentence mapping beyond the spot checks above, and the complete Module-map-versus-`ls-files` listing, which I did not re-run.
