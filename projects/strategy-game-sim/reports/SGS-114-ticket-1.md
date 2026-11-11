# SGS-114 ticket 1 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-114-chart-layout.md (edited in place; lint clean)

## Summary

SGS-114 "Collapse and move each result chart, persisted per browser". Component aoe4-build-order, M8.2 / M8.9, Risk standard, about 220 business-logic lines, no dependencies, On merge none. The ticket covers `browser-storage.ts` (moved from the page), the C9 `chart-layout.ts` contract with a zod schema, `use-chart-layout.ts` (hydration-safe), rendering changes in `results.tsx` and `line-chart.tsx`, `results.module.css`, `acceptance/helpers.ts`, the new `aoe4-chart-layout.spec.ts`, and a "Chart controls" paragraph in the docs. The criteria cover normalisation, move and toggle, storage that throws, SSR markup, the moved `browserStorage`, mouse and keyboard collapse and move with focus, persistence across reloads, blocked storage, hover band and pins after a reorder, unedited existing specs, and the docs.

## Spec-gate findings folded in

1. CHART_IDS (gap 1): `helpers.ts` keeps the name and defines `export const CHART_IDS = RESULT_CHART_IDS` (design C9). `RESOURCE_CHARTS` stays a standalone `as const` literal. `aoe4-results-split.spec.ts` keeps its local literal, because SGS-118 replaces it. Criterion (respec 1): the branch's diff under `acceptance/` lists only `helpers.ts` and the new spec, and every existing spec passes unedited.
2. Collapsed body (gap 2): the `chart-body` wrapper is always rendered with `id` `${testId}-body`, which is the `aria-controls` target. When collapsed it carries `hidden` and has no children. The measure svg (`measureRef`) stays a direct child of the container, outside the body. New SSR criterion (respec 1) pins this.
3. Header wrapper (gap 3): the `d-flex flex-wrap align-items-baseline column-gap-3` wrapper is removed, and the header row is styled with module CSS. The same SSR criterion checks that collapsed markup has no `d-flex` / `flex-wrap`. It checks only the collapsed state because the series legend in `chart-legend.tsx` legitimately uses `d-flex flex-wrap`.
4. Notes: Scope now hints at an explicit focus restore after a keyed reorder. Viewports are named: the hover-band and pin case runs at `SPLIT_VIEWPORT`, and all others run at `TABS_VIEWPORT` plus `showTab(page, 'results')`. The spec criterion is tagged (respec 1).

## Checks run

- `git grep -n "function browserStorage" origin/main -- pages components` finds only `pages/apps/aoe4-build-order.tsx` today, which is consistent with Scope moving it.
- The docs anchor "A 200 draws four line charts" exists in `docs/aoe4-build-order.md` at origin/main.
- Existing users of `CHART_IDS`: pin-compare, chart-readability, gather-rates-per-villager, gathered-resources and split-layout. `aoe4-results-split` has a local literal. All of them keep the default order, so the re-export keeps them passing.

## Diagrams

None. This is a single-component change outside the core loop, and the ticket states "no diagram required".

## Open questions

none

## Overlap

- SGS-118 replaces the local `CHART_IDS` in `aoe4-results-split.spec.ts` and does not redefine `CHART_IDS`, so it is consistent.
- SGS-113 edits `line-chart.tsx` (legend) in other hunks.
- SGS-115 edits `acceptance/helpers.ts`. This ticket touches only the `CHART_IDS` line and its import.
