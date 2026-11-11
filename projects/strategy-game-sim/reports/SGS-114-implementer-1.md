# SGS-114 implementer report 1

- Ticket: SGS-114 (collapse and move each result chart, persisted per browser)
- Branch: sgs-114-chart-layout, base origin/main (b3da879)
- Tip SHA: 72ac4acb410237a084cecf551c139e8f36672b72
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-114-chart-layout

## Files touched (components/apps/aoe4-build-order/ unless noted)

- `browser-storage.ts` (new): `browserStorage()`, moved unchanged from the page.
- `chart-layout.ts` (new): C9 contract (ids, key, default, zod schema, normalize, read, write, move, toggle).
- `use-chart-layout.ts` (new): `useChartLayout()`; default state first, hydration effect reads storage and does not write; move and toggle write.
- `results.tsx`: renders charts in `layout.order` keyed by id, passes `layout`; focus restore effect after a move; `perVillager` state and series stay in `Results`.
- `line-chart.tsx`: `ChartControls` prop type, `ChartHeader` (module-CSS header row, three buttons), always-rendered `chart-body` (id, `hidden`, empty when collapsed), `data-collapsed`; measuring svg stays outside the body.
- `results.module.css`: `.chartHeader`, `.chartButtons`.
- `/pages/apps/aoe4-build-order.tsx`: local `browserStorage` deleted, imported from the new module.
- `/acceptance/helpers.ts`: `CHART_IDS = RESULT_CHART_IDS` (imported); `RESOURCE_CHARTS` untouched.
- `/acceptance/aoe4-chart-layout.spec.ts` (new): 10 cases.
- `/docs/aoe4-build-order.md`: "Chart controls" paragraph after the messages paragraph of the charts section.
- `chart-layout.test.ts` (new), `line-chart.test.ts` (new `describe('chart controls')` block appended).

## Tests

- Vitest full suite: 64 files, 2004 passed, 13 skipped, 0 failed. New: `chart-layout.test.ts` 27 tests, `line-chart.test.ts` +5 tests.
- Invariants encoded: normalize drops unknown and duplicate ids and appends missing in default order; invalid value or version gives default (and fresh arrays); moveChart swaps and is a no-op at the ends; toggle never duplicates; no input mutation; read/write never throw (null, throwing, non-JSON); stored keys are exactly version/order/collapsed; collapsed chart renders no legend or header controls, keeps hidden empty body with id equal to `aria-controls`; no `d-flex`/`flex-wrap`; up/down disabled at ends; no buttons without `layout`.
- Acceptance (ticket adds the spec, so run once): `aoe4-chart-layout.spec.ts` 10 passed. Existing specs unedited and passing: pin-compare, chart-readability, gather-rates-per-villager, gathered-resources, split-layout, results-split, step-band, narrow-layout: 81 passed.

## Pre-existing tests edited

None. `line-chart.test.ts` had a new describe appended; no existing assertion changed.

## Doc claims

- docs: "Collapsing a chart hides everything under the title row (the series legend, the plot, the marker legend and, on Gather rates, the Per villager checkbox); the title and the three buttons stay." True per `line-chart.tsx` SeriesChart body (headerControls rendered inside the body, empty when collapsed).
- docs: "The hidden series, the Per villager choice and the pinned run survive a collapse and a move" - `hidden` state in SeriesChart, `perVillager` and pin in Results/page; spec checks hide set and Per villager.
- docs: "a collapsed chart draws no step band, markers or pinned lines" - plot is not rendered when collapsed; spec asserts zero `chart-step-band`.
- docs: "applied after the page loads, so the first paint is the default layout" - `use-chart-layout.ts` useState default plus useEffect.
- docs: normalisation and unavailable-store sentences - `chart-layout.ts` `normalizeChartLayout`, `readChartLayout`/`writeChartLayout` try/catch; spec blocked-storage case.
- Code comments: none added.

## Pinned outputs

None.

## Mutation checks (each undone; confirmed by file restore, final `git status` clean)

- `chart-layout.ts` drop `new Set` dedupe: failed "drops unknown and duplicate ids..." and "keeps each valid collapsed id once".
- Remove `to >= layout.order.length` guard: failed "returns an equal layout for down at the end".
- Toggle `includes(id)` forced false: failed "adds an absent id and removes a present one" and "never holds an id twice".
- `missing` forced empty: failed "drops unknown and duplicate ids..." and "normalises a stored layout that misses an id".
- `readChartLayout` skips normalize: failed "normalises a stored layout that misses an id".
- `line-chart.tsx` `collapsed ? null` forced false: failed "keeps an empty hidden body...".
- `disabled={layout.first}` forced false: failed "disables up on the first chart and down on the last only".
- `aria-controls={testId}`: failed 4 chart-controls tests.
- `hidden={false}`: failed "keeps an empty hidden body...".
- header class swapped to `d-flex flex-wrap`: failed "not.toMatch(/d-flex|flex-wrap/)".

## Codegen, build, lint

- codegen: not set. `next build`: pass. `tsc --noEmit` and `npm run lint:dup`: pass (an initial jscpd clone between my test's fake storage and `pin-storage.test.ts` was removed by restyling mine, no edit to the pin test).
- `git grep "function browserStorage"` over pages and components: only `browser-storage.ts`.
- `git diff --name-only origin/main...HEAD -- acceptance`: `acceptance/helpers.ts` and `acceptance/aoe4-chart-layout.spec.ts` only.

## Invariant check

No engine or data change; A1 to A3 untouched.

## Notes and out-of-scope findings

- The branch `sgs-114-chart-layout` already existed at origin/main (left by a failed first worktree add); reused it.
- Next's route announcer is an empty `role="alert"`; the spec's no-alert check filters on non-empty text.
- `ChartControls` and `ChartHeader` live in `line-chart.tsx`; the sibling legend ticket editing the same file may conflict in the header hunk.
- Fake-storage helper is duplicated between `pin-storage.test.ts` and `chart-layout.test.ts` in shape (not flagged by jscpd now); a shared test helper could go to BACKLOG.

Status: needs_review
