# SGS-104 spec gate, round 1

Verdict: NEEDS_SPEC

Checked against `origin/main` (the checkout at `/home/choin/git/WOTR_Combat_Simulator` is on another branch, so I read main with `git show` and `git grep`), the M6 design, and SGS-102.

Grounded and fine: `workbench-tabs.tsx`, `workbench.module.css` (one `@media (min-width: 1200px)` block holding `.resultsSplit`, `.timelineColumn`, `.chartsColumn`), `acceptance/helpers.ts` (`showTab`, `openPage`), the docs sentences ("At 1200 px and wider the step timeline sits in a column...", "beside them at 1200 px and wider"). `useSplitLayout` and `matchMedia` do not exist on main, as the ticket says. Names match design C6 and Layout. Open questions are None, and the design's OD list is settled. Risk `standard` is right: no critical path or strong-model trigger. Invariants S1 and A3 are named and not contradicted. No LESSONS entry is violated (the layout-read rule is already in Scope). `ARCHITECTURE.md` and openapi are correctly left alone. Size is under 400 lines.

## Gaps

1. **Scope, WorkbenchTabs structure vs. criterion "resize keeps focus and text" - contradiction, an implementer must guess.**
   Scope says the switch "must not unmount the editor ... beyond what remounting under a changed parent costs". That concedes a remount. The criterion then requires `document.activeElement` to be unchanged after TABS to SPLIT to TABS, with "the editor" as an allowed target and "Break caught: remounting the build panel's inputs".
   The natural implementation (split returns `<div class=workbenchSplit>` holding the panels, tabs returns a fragment of tablist plus panels) changes the parent element type, so React unmounts and remounts both panels. The editor loses focus, the step table loses its `draft` cell state (`step-table.tsx` `useState`), and the chart internals reset. The duration field is not in the panel: it is in the run bar, outside `WorkbenchTabs`. So the "duration field" alternative in the criterion proves nothing about the panels, and the editor alternative fails under the natural implementation.
   Fix: Scope states the tree rule. Render one stable wrapper: `<div className={split ? styles.workbenchSplit : undefined}>`, with the tablist rendered conditionally as the first child, and the two panels at fixed positions and keys whose element type and position do not change with `split`. Drop the "beyond what remounting costs" hedge. The criterion then says the editor textarea (not the duration field) keeps focus and its caret/value across the round trip. Also assert that an open step-table row and a draft survive.
   Note that the wrapper must not break the tabs-mode layout: it needs no grid class there.

2. **Criterion "split at 1280" - vague observable.**
   "the editor textarea and the `results-last-good` heading area are inside the viewport together" has no defined element. "Heading area" is not a test id, so an implementer would guess.
   Fix: assert that the `getBoundingClientRect()` of the editor textarea and of `results-last-good` (or `panel-results`) each have `top >= 0` and `bottom <= innerHeight` at 1280x800 right after the run, with no scroll. The `results-last-good` id is delivered by SGS-102. If that rect is too tall to fit, use its top edge only, and say so.

3. **Criterion "resize while hidden" - `CHART_IDS` is not available to the new spec.**
   `CHART_IDS` is a file-local constant in `aoe4-build-order-pin-compare.spec.ts`. The ticket does not say where the new spec gets it.
   Fix: Scope adds an exported `CHART_IDS` to `acceptance/helpers.ts` (the three ids `chart-units-produced`, `chart-gather-rates`, `chart-floating-resources`). It also moves pin-compare to the import, or states that the new spec declares its own copy.

4. **Existing specs, rule 4 - undefined end state.**
   "if it fails because the column is now half the page, the implementer reports it as a finding and does not loosen it." The acceptance criteria also require `npm run acceptance` to pass, so a spec left red contradicts the gate. The implementer would have to guess between leaving it failing, deleting it, or moving its viewport.
   Fix: state that the spec is moved to the `WIDE` (1800 px) viewport, keeping its expected value, and that the move is listed as a finding. Or, if the owner would rather the page change instead (for example a different column rule), say so. This one is a design call but probably not owner-only.

## Notes (non-blocking)

- Add a unit-level check where possible. Vitest has no DOM, so `useSplitLayout` is covered only by acceptance. That is acceptable. A tiny pure test is not needed.
- "split at 1280" and "first paint" both load at 1280: the boundary criterion at 1199/1200 depends on `matchMedia` counting the viewport width exactly. This holds in headless Chromium, but if the scrollbar ever takes width, the failure would be a 1200-wide window reading as 1185. Say "viewport width as set by `setViewportSize`" or poll, to avoid a rework.
- Criterion "tabs at 390" depends on `tab-results` being enabled after the first run (SGS-102 keeps `resultsEnabled`); fine, just keep the run before the click.
- At 1800 px, Results is a half-width column (about 900 px), so the timeline-beside-charts split still lives in a narrow column. This is the owner's accepted outcome (Q13 A), so it is only noted here.
- Docs list is by phrase, with no line numbers, which is the right shape. `results.module.css` has a `min-width: 30rem` (line 6); the implementer should confirm it does not widen the half-width column at 1200 px (the "wide child never widens its column" rule). The `minmax(0, 1fr)` rule covers it, but a test at 1200 width for `scrollWidth <= 1200` is only in the 1280 criterion. Add a check at exactly 1200 to the boundary case.
