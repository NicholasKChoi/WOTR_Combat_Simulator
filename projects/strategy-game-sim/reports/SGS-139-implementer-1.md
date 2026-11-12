# SGS-139 implementer report 1

Status: needs_review

- Branch `sgs-139-marker-legend-hover-focus-labels`, tip `a04ccdc`, base 4f369f3.
- Worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-139-marker-legend-hover-focus-labels`.

## Files touched
- `components/apps/aoe4-build-order/line-chart.tsx`: added `labelledMarkers`, `activeMarkerKind` and `liveMarkerKind`. `SeriesChart` gained `hoverKind` and `focusKind` state, reset through `liveMarkerKind` by set-state-during-render for both slots. `active` feeds `labelledMarkers`. Drawing is one `markers.map` giving every marker one `chart-marker` line: placed label if labelled, else a `<title>`.
- `components/apps/aoe4-build-order/chart-legend.tsx`: `MarkerLegend` items are `li > button` with `data-testid`, `data-kind`, `data-active`, `aria-label` and the mouse and focus handlers.
- `components/apps/aoe4-build-order/results.module.css`: `.markerButton` with hover, active and focus-visible styles. Module CSS only on the button, no utilities.
- `components/apps/aoe4-build-order/line-chart.test.ts`: new unit tables and static-markup cases.
- `acceptance/aoe4-marker-labels.spec.ts`: new Playwright spec. NOT RUN (only the acceptance gate runs browser tests). It type-checks under `tsc`.
- `docs/aoe4-build-order.md`: chart-marker paragraph updated.

## Tests
- Vitest `line-chart.test.ts`: 39 pass. Full `npm test`: 2501 passed, 15 skipped, 0 failed.
- Invariants encoded:
  - `labelledMarkers`: null gives age-ups only; a kind gives only that kind; no markers gives empty.
  - `activeMarkerKind`: 7 rows, including hover without markers falling through to focus, and hover beating focus.
  - `liveMarkerKind`: 4 rows (null, kept, no markers, collapsed).
  - `MarkerLegend` markup: `data-active` on exactly the active kind; one button per present kind in kind order; empty when no markers.
- Pre-existing test edited: `line-chart.test.ts`, "lists one marker legend item per kind present, in kind order". The regex now reads the button markup and aria-label. The ticket explicitly allows this move. The other legend tests (regexes matching `data-testid="chart-marker-legend-item" data-kind=`) pass unedited because the attribute order is unchanged.
- `aoe4-chart-readability.spec.ts` was not edited. Its default-state checks hold under the new drawing rule, but it was not run.

## Mutation checks
Each break was made to the production line the test exercises, run, and reverted. A script restored the file after each; `git status` showed only intended changes.
- `labelledMarkers` null returns all markers: "labelledMarkers(markers, null)" failed.
- A non-null kind also returns age-ups: the economy and age-up rows failed.
- `activeMarkerKind` drops the has-markers check: two "hover without markers" rows failed.
- `activeMarkerKind` swaps hover and focus order: "hover and focus both" failed.
- `liveMarkerKind` ignores `collapsed`: "kind with markers, collapsed" failed.
- `liveMarkerKind` drops the has-markers check: "kind with no markers left" failed.
- `data-active` always `'true'`, and always undefined: "marks only the item whose kind is active" failed both times.
- The Playwright spec has no mutation checks because it was not run.

## Doc claims
`docs/aoe4-build-order.md` chart-marker paragraph, each sentence true of `line-chart.tsx` and `chart-legend.tsx`:
- "By default only `age-up` markers carry a text label": `labelledMarkers(markers, null)`.
- "A marker without a text label stays a line and shows `<label> <m:ss>` as a hover title": the `<title>{markerLabel(marker)}</title>` branch in `SeriesChart`.
- "each a button: hovering or focusing it labels that kind's markers in place of the age-up labels (the age-up labels return when no entry is hovered or focused, and a hovered entry wins over a focused one...)": `MarkerLegend` handlers and `activeMarkerKind`.
- "clicking or pressing a key on it does nothing more than focus it": there is no click or key handler.
- "collapsing the chart clears it": `liveMarkerKind` with `collapsed`.
- Grep of `docs/` and `ARCHITECTURE.md` for `marker legend`, `text label` and `chart-marker-legend-item` found no other contradicted statement.

## Pinned outputs
None.

## Codegen, build, lint
- No codegen configured.
- `tsc --noEmit` clean; `lint:dup` 0 clones.
- `next build` succeeds.

## Invariant check
No INVARIANTS.md entry applies (UI only). Pinned markers are untouched: only pinned age-ups are drawn, dashed, never labelled.

## Unverified assumptions added
None beyond the ticket's list.
- Those are covered only by the unrun Playwright spec, because `renderToStaticMarkup` fires no events.
- One new behavior: before `chartWidth` is known, age-ups now render as titled plain lines, then switch to labelled on the same key. This relies on recharts re-rendering a keyed `ReferenceLine` from `<title>` to `label`, which the ticket's list already names.

## Out-of-scope findings
None.

## Notes for the manager
- The ticket asks for `acceptance/aoe4-marker-labels.spec.ts`, so it was authored. The prompt says a separate gate owns acceptance tests, and I ran none. The acceptance-test gate should run this spec, and the readability and narrow-layout specs.
- The Playwright hover-wins-over-focus case focuses the age-up item and hovers another kind. Most builds have only one non-age-up kind, so a two-non-age-up pair would not be guaranteed.
