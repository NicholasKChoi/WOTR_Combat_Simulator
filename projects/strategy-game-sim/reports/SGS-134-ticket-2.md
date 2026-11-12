# SGS-134 ticket 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-134-chart-layout-model-key-results-collapse.md

## Summary

SGS-134, "Widen the chart layout model, make the key-results panel collapsible, and give the page the one layout owner", component aoe4-build-order, M9 / M9.4, about 180 business-logic lines. Depends on SGS-128. Risk stays standard.

The blocking gap came from the `useChartLayout` write rule. As specced, the effect wrote whenever `loaded` was true, so with empty storage it would write the default layout on load. That breaks the "loading writes nothing" case in `acceptance/aoe4-chart-layout.spec.ts`, which the ticket says must pass unchanged. I read the hook and that spec at origin/main to confirm it.

I applied option A:
- The mount effect keeps the layout object it read.
- The write effect skips until `loaded` is true, and also skips while the layout is still that same object.
- So loading never writes. Storage stays empty until the user moves or collapses something, and a stored value is never echoed back or overwritten.

The Scope states that this narrows design C2's line "the first write echoes the stored value" to "no write on load". C2's "a write never happens before the read" rule still holds, so no owner call is needed.

The non-blocking notes are folded in:
- `compare-body` `data-collapsed` is the string `"true"` or `"false"`, as in `line-chart.tsx`.
- The `compare-panel` section keeps the `mb-3` class from the old root div.
- The new Playwright spec names its viewport helpers: `TABS_VIEWPORT` with `showTab(page, 'results')`, or `SPLIT_VIEWPORT`.
- The shared `fakeStorage` takes entries keyed by storage key, so stored values go under `CHART_LAYOUT_STORAGE_KEY`.
- Scope says `aoe4-chart-layout.spec.ts` is not edited.

Criteria tagged `(respec 1)`:
- the hook write-guard review check, which now also points to the Playwright empty-storage case;
- the `ComparePanel` static markup, which now checks the `data-collapsed` values;
- the Playwright key-results spec, for its viewport helpers;
- the existing chart-layout spec passing with no edits, including the case where nothing is stored.

## Checks

- The search criterion was checked against origin/main. Today `useChartLayout(` appears in two places: the definition in `use-chart-layout.ts` and the call in `results.tsx`. Scope moves the call to the page, so the criterion holds in the end state.
- The ticket lint passes with no errors.
- No SGS-134 branch exists, so no branch work is affected.

## Diagrams

None. This is a single-component change outside the core control loop.

## Open questions

None.

## Overlap

Same as before. SGS-135 removes the Up and Down buttons and the `pendingFocus` effect. This ticket keeps them, and says so in Scope.
