# SGS-135 implementer report 1

- Ticket: SGS-135. Branch `sgs-135-chart-header-drag-handle-and-caret`, tip `d906392e2f28dfce4c990cf60b0f20fb6f32ffc3` (one commit on origin/main 5e5bd8e). Worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-135-chart-header-drag-handle-and-caret`.
- Status: needs_review

## Files touched (components/apps/aoe4-build-order/ unless noted)
- `chart-drag.ts` (new): `dropIndexAt`, counts midpoints strictly above the pointer.
- `use-chart-drag.ts` (new): `useChartDrag`; native listeners on the handle (pointermove, pointerup, pointercancel, lostpointercapture) plus a capture-phase document keydown for Escape, all removed when the drag ends or the hook unmounts; primary button only, 4px threshold, drop at the start index calls nothing.
- `chart-header.tsx` (new): `ChartHeader`, `ChartControls`, `chartHandleKey`.
- `chart-header.module.css` (new): `.chartHeader`, `.dragHandle` (`touch-action: none`).
- `line-chart.tsx`: header and controls removed; `SeriesChart` passes `headerControls` as `controls`, adds `sectionRef` prop, `data-dragging`.
- `results.tsx`: drag wiring, `focusAfterMove` ref and `[layout.order]` effect, help and status paragraphs, no `pendingFocus`.
- `results.module.css`: removed `.chartHeader` and `.chartButtons` (moved or unused), added `.chart[data-dragging='true']` opacity.
- `chart-drag.test.ts`, `chart-header.test.ts` (new); `line-chart.test.ts` edited.
- `acceptance/aoe4-chart-layout.spec.ts`: rewritten for the new controls.
- `docs/aoe4-build-order.md`: "Chart controls" paragraph rewritten.

## Tests
- `npm test`: 78 files passed, 1 skipped; 2459 passed, 15 skipped. New: `chart-drag.test.ts` (6 rows), `chart-header.test.ts` (chartHandleKey table, markup order, attributes, caret states, slot when collapsed, no-layout).
- Acceptance run once (spec changed): `aoe4-chart-layout.spec.ts`, `aoe4-gather-rates-per-villager.spec.ts`, `aoe4-key-results-collapse.spec.ts`: all pass (the layout spec failed once on my own caret test asserting focus before any action; fixed, rerun passes). The per-villager spec needed no edit.
- `git grep -n "chart-move-"`: no match. `tsc --noEmit`, `lint:dup` (0 clones), `next build`: pass. No codegen.

## Pre-existing tests edited
- `line-chart.test.ts` `chart controls` describe: the cases pinning the three buttons, disabled first/last, and the slot hidden when collapsed were replaced by: no handle and no caret without layout; collapsed has the empty hidden body, no legend, header controls still present; expanded has the legend; `data-dragging` only while dragged. Allowed by the ticket's Tests rule for `line-chart.test.ts`.
- `acceptance/aoe4-chart-layout.spec.ts`: Up/Down cases became handle cases; kept default order, persistence, normalization, blocked storage, split-view cases.

## Doc claims (all in docs/aoe4-build-order.md, "Chart controls")
- Header order handle, title, caret, Per villager: `chart-header.tsx:ChartHeader`.
- Collapse hides legend, plot, marker legend; handle, title, caret and Per villager stay: `line-chart.tsx:SeriesChart` (controls passed to header, body empty when collapsed); acceptance cases pass.
- Caret label flip, click/Enter/Space, keeps focus: `collapse-caret.tsx`; acceptance caret case.
- Handle drag with primary button, ArrowUp/ArrowDown, other keys do nothing: `use-chart-drag.ts:start`, `chart-header.tsx` onKeyDown.
- 4px start, order unchanged until drop, drop by pointer height: `use-chart-drag.ts`, `chart-drag.ts`.
- Escape or cancelled pointer ends the drag with no change; a touch drag starting on the handle does not scroll the page: Escape/pointercancel handlers; `.dragHandle { touch-action: none }` (touch itself is not tested).
- Focus to moved handle, status names chart and position of four, first-up/last-down no-op: `results.tsx` (`placeChart`, `moveByKey`, effect).
- Help text: `results.tsx` `chart-reorder-help`.

## Mutation checks (each undone; tree clean after, script restores the original text)
- `chart-drag.ts` `<` to `<=`: "exactly on a midpoint" and "exactly on a later midpoint" fail. `<` to `>`: above/below/between fail.
- `chart-header.tsx` map Enter to 'down': "Enter gives null" fails.
- `chart-header.tsx` controls only when expanded: "keeps the controls slot when collapsed" fails.
- `line-chart.tsx` drop `data-dragging`: "marks the section dragging only while dragged" fails.
- `results.tsx` drop the upper bound check in `moveByKey`: acceptance "ArrowUp ... ArrowDown on the last change nothing" fails on the status text assertion.
- `use-chart-drag.ts` Escape key mismatch: "Escape during a drag" fails on `data-dragging` still set. Threshold `>= 0`: "under 4px" fails.
- `results.tsx` focus effect disabled: no test fails (see below).

## Findings and assumptions
- The Unverified assumption about focus is not borne out here: with the focus-restoring effect disabled, ArrowDown on the first chart's handle (a move that makes React relocate the focused node) still leaves focus on the handle in Chromium, and the focus tests pass. The effect is kept per the design (it is harmless and covers a browser that blurs), but no test in this environment proves it is needed. Consider rewording that assumption.
- Not exercised by any test: touch input, `touch-action`, the `pointercancel` and `lostpointercapture` paths (only Escape and sub-threshold paths are tested).
- Several ArrowDowns delivered before a re-render would compute the announced position from the pre-commit order; the order itself uses functional setState and stays correct.
- Added no Unverified assumptions beyond those listed in the ticket.

## Invariants
No engine, data or simulation paths touched; INVARIANTS apply only to unrelated paths. `chart-layout.ts`, `use-chart-layout.ts`, `collapse-caret.tsx` unchanged.

## Out-of-scope findings
None.
