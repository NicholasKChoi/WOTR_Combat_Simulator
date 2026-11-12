# SGS-139 ticket author 3 (re-spec 2)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-139-marker-legend-hover-focus-labels.md
Lint: `ticket-lint.py` clean.

## Summary

SGS-139 "Marker legend items label that kind's markers on hover or focus", component aoe4-build-order, M9 / M9.7, risk standard, ~100 LOC business logic, depends on SGS-138 (SGS-135 transitively). Criteria cover `labelledMarkers`, the `activeMarkerKind` table, a new `liveMarkerKind` reset table, `MarkerLegend` button markup and `data-active`, Playwright for the drawing rule, hover, focus, hover-over-focus, collapse reset, styling and 390px fit, pinned markers unchanged, docs, and gates.

## Findings folded in (spec-gate 1)

- Gap 2 (reset path either-or): Scope now names one pure function, `liveMarkerKind(markers, kind, collapsed)`, returning `kind` only when non-null, expanded and with markers; `SeriesChart` applies it to both `hoverKind` and `focusKind` and has no other reset logic. New `(respec 2)` Vitest table: null kind, kind kept, kind with no markers, kind in collapsed chart. It covers both design rules (stale markers and collapse).
- Gap 1 (collapse case vacuous): the Playwright collapse case now asserts the item is `data-active="true"`, collapses with `dispatchEvent('click')` on `chart-collapse` (no pointer or focus change), asserts the legend is gone, moves the pointer away, expands, and checks age-up labels and no `data-active`. The Chromium assumption that no `mouseleave`/`blur` reaches React for the removed item is listed under Unverified assumptions. The collapse rule for focus is covered by the shared function's Vitest row.
- Note on the drawing rule: Playwright now owns it (count of `chart-marker` lines equals the run's markers while a non-age-up kind is active; unlabelled age-ups have a title).
- Note on the readability spec: Scope says it may need no edit.
- Also removed a dictated aria-label string (no design text fixes it); Scope states what it must say.

## Ordering against SGS-137

Graph: SGS-139 dependsOn SGS-138; SGS-137 dependsOn SGS-134, SGS-135, SGS-136, SGS-138. No edge between them, and the ticket states none is needed: either merges first, the second rebases. SGS-137's current ticket explicitly excludes `line-chart.tsx` and `chart-legend.tsx`; the only shared file is `docs/aoe4-build-order.md`, different paragraphs. The ticket says to keep both changes if SGS-137 does touch `line-chart.tsx`. No graph change needed. (The graph row for SGS-137 lists SGS-138 but its ticket header still says `SGS-134, SGS-135, SGS-136`; the manager may want SGS-137's header synced.)

## Diagrams

None (single component, not a core control loop).

## Open questions

none

## On merge

CONTEXT.md Key surfaces: add `liveMarkerKind` (a name not in design C8).

## Overlap

None beyond the docs file shared with SGS-137.
