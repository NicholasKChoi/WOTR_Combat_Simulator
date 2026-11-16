# SGS-183: Move the tabs-layout acceptance cases to the default viewport and drop the remaining tab steps

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (acceptance specs only; the AoE4 invariants match by path and no `lib/aoe4-build-order/**` file changes)
- **Unverified assumptions**: none (the specs run against the real page in Chromium; nothing is faked)
- **LOC estimate**: 0 (test-only: about 150 spec lines deleted and about 100 changed in eleven `acceptance/` files; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M10.md "Acceptance spec inventory (M10.3)", plans/M10-20261116.md outline E; criterion M10.3

## Context

Step 1 of M10 moves every acceptance case off the tabs layout (viewports under 1200 px) and off narrow widths while today's code still passes them, so the later code ticket can delete the tabs without breaking specs. The default Playwright viewport (`devices['Desktop Chrome']`, 1280x720) shows the two-column layout, where both panels are always visible and `showTab` only asserts a panel visible. This ticket covers the spec files that are not in another step-1 ticket's set (those own the narrow, small-screen, split, editor-width, save and auto-run specs, plus inline-issues and pin-compare). It runs on today's main unchanged and depends on no other ticket; it must not use `MIN_SUPPORTED_VIEWPORT`, which another ticket adds.

## Scope

Every change is in `acceptance/`. Each file below ends with no reference to `showTab`, `TABS_VIEWPORT`, `workbench-tabs`, `tab-build` or `tab-results`. Where a `showTab` call was the only wait before reading a panel, the next assertion on that panel's own content still waits for it (a case must not start reading unsettled DOM). Names below are pointers to where to look.

- `aoe4-step-table.spec.ts`
  - "the start row sits above the step rows at both widths and stacks under 768 px": keep the `WIDE_VIEWPORT` half; delete the 390 half (the card/stacked layout is going away). Rename the case so it no longer names two widths or 768 px. The rows-order check and the later `selectOption("barracks")` text check stay.
  - Delete "labelled fields share a line from 768 px and stack one per line below it" (viewports 700 and `TABS_VIEWPORT`).
  - Delete the describe "the view toggle in the tabs layout" (its case asserts the Text and Table buttons are disabled while Results is shown; that rule is removed).
  - Drop every `showTab` call (about 7) and the `showTab` and `TABS_VIEWPORT` imports; keep `WIDE_VIEWPORT`.
- `aoe4-build-order-m4-flow.spec.ts`: remove the `TABS_VIEWPORT` `test.use` so the describe runs at the default viewport. The opening asserts about the tablist, `aria-selected`, the hidden Results panel and the enabled results tab become `panel-build` and `panel-results` both visible. Remove the `aria-selected` and `tab-results` enabled asserts elsewhere in the case (the "pin survives a reload" check keeps asserting the pin through `unpin-run` enabled and `pinned-label`). Rename the case title so it no longer says "tabs".
- `aoe4-build-order-run-errors.spec.ts`: the describe "on the tabs layout" (6 cases) runs at the default viewport (remove its `test.use`) and is renamed to something that does not name tabs. Titles and assertions that name the "build tab" or "results tab" (for example "enables the results tab", "on the build tab") are reworded to state what is checked; the `aria-selected` asserts go. Every behavior assertion (request body, status message, error box, later good run clears the error, chart visible) stays.
- `aoe4-chart-layout.spec.ts`
  - The "AoE4 chart collapse and reorder" describe runs at the default viewport (remove its `TABS_VIEWPORT` `test.use`).
  - The "AoE4 chart drag reorder" describe's viewport changes from 1024x2800 to 1280x2800 (same height; the tall page keeps every chart on screen).
  - Drop `showTab` (in `openResults` and elsewhere) and the `TABS_VIEWPORT` import.
  - (respec 2) The two cases from the `for` loop "ArrowUp on the first chart ... / ArrowDown on the last chart changes nothing, keeps focus and does not scroll the page" measure the scroller the charts live in. In the two-column layout the charts scroll inside the Results column (test id `results-column`, the `div.column` that `WorkbenchTabs` in `components/apps/aoe4-build-order/workbench-tabs.tsx` renders with `overflow-y: auto` when `split`; the design keeps this id in M10.4), not the window: at 1280x720 the window's scroll range is small and `scrollIntoView` leaves `window.scrollY` at its maximum, so today's window precondition (`before.y < before.max`) cannot hold. Each case instead: positions the column so the handle is on screen and the column has room to scroll both ways (its `scrollTop` is greater than 0 and less than `scrollHeight - clientHeight`), asserts that precondition, presses the key, and asserts the column's `scrollTop` and `window.scrollY` are both unchanged. The rest of the case (default order, empty status, focus on the handle, nothing stored) stays. Measured on the branch at 1280x720: centring the first chart's handle (`block: 'center'`) leaves the column at `scrollTop` 0, so the precondition fails for ArrowUp; aligning the handle to the column top (`block: 'start'`) satisfies it for both charts. The title may keep "does not scroll the page" or name the column; either is fine.
  - (respec 2) Checked for the same window-scroll assumption in the eleven files: the only other scroll reads are the drag reorder cases' `boundingBox` reads (1280x2800, every chart on screen) and `aoe4-build-order-step-band.spec.ts`'s `scrollIntoView` plus `window.innerHeight` visibility check; both pass at their viewports on the branch and stay unchanged.
- `aoe4-marker-labels.spec.ts`: delete the describe "at a 390 px screen" and the `PHONE` constant. Drop `showTab` from `setup`.
- Drop `showTab` calls and its import only, changing nothing else, in `aoe4-auto-run-contract.spec.ts`, `aoe4-build-order-knight-longbow-page.spec.ts`, `aoe4-build-order-m3-flow.spec.ts`, `aoe4-build-order-step-band.spec.ts` (inside its shared open helper), `aoe4-chart-readability.spec.ts` and `aoe4-gathered-resources.spec.ts`.
- Check before editing: re-grep `acceptance/` at the base for `showTab`, `TABS_VIEWPORT`, `tab-build`, `tab-results`, `workbench-tabs` and `PHONE`. Any hit in a file this ticket lists is handled as above. A hit in a file another step-1 ticket owns (inline-issues, pin-compare, split-layout, split-scroll, results-split, editor-width, step-annotations, chart-views, my-builds, save-open, save-status, auto-run, narrow-layout, small-screen) is left alone and listed in the report.
- Docs: grep found no doc that describes these spec cases; no doc changes. Not touching `acceptance/helpers.ts` (`SPLIT_MIN_WIDTH`, `TABS_VIEWPORT`, `showTab` stay until the code ticket removes them).
- Existing tests: every case not named above keeps its assertions and its expected values. (respec 2) The two first/last-chart arrow-key cases are named above: their scroll precondition and "no scroll" check move from the window to `results-column`, and the window check stays as an extra assertion.
- The deleted and rewritten cases must not leave a block that `npm run lint:dup` flags as a clone.

**Out of scope:** `acceptance/helpers.ts`; any file under `components/`, `pages/`, `lib/`, `docs/`; adding `MIN_SUPPORTED_VIEWPORT` or any narrow-viewport case; the spec files owned by the other step-1 tickets.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) Every case in the eleven listed files passes at its stated viewport with no tab step, and `acceptance/helpers.ts` is unchanged (empty diff).
- [ ] The cases deleted per Scope (the 390 half of the start-row case, "labelled fields share a line", the tabs-layout view-toggle describe, the 390 marker-legend describe) are absent, and the kept WIDE half of the start-row case still fails if the trigger kind and action no longer share a row, or if the start row's rally and count fields no longer sit side by side at `WIDE_VIEWPORT`.
- [ ] The m4-flow case opens with `panel-build` and `panel-results` both visible at the default viewport and no tab element; its Results-side assertions (notes list, chart visible, dimmed results while the text is invalid, pinned label after reload, unpinned state after unpin) run against the always-visible Results column with no tab step between.
- [ ] The six run-errors cases and the chart collapse and reorder cases run at the default viewport, and the chart drag reorder cases at 1280x2800; the viewports are set by `test.use` and no case in a listed file sets a viewport under 1200 px wide.
- [ ] (respec 2) The ArrowUp-on-first-chart and ArrowDown-on-last-chart cases in `aoe4-chart-layout.spec.ts` run at the default viewport, assert before the key press that `results-column` has a `scrollTop` greater than 0 and less than its scroll extent (no pinned value), and assert after it that the column's `scrollTop` and `window.scrollY` are unchanged. Removing the `preventDefault` call from the chart handle's key handler (`ChartHeader` in `components/apps/aoe4-build-order/chart-header.tsx`) makes both cases fail; the implementer runs that mutation and records the result.
- [ ] A case that previously relied on `showTab` to wait for Results content does not read that content before it is rendered (each such read is behind a `toBeVisible`, `toHaveCount`, `expect.poll` or `toPass` on that content).
- [ ] Every case in the listed files that is not deleted by Scope keeps its behavior assertions; the implementer lists every case edited, renamed or deleted in the report.
- [ ] `npm run acceptance` passes for the eleven listed files, `npx tsc --noEmit` and `npm run lint:dup` are clean, and `npm test` is unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-16

- Underspecified: the first criterion was a code search whose typecheck half proves nothing (no `noUnusedLocals`).
- Changed: replaced it with the observable outcome (cases pass at stated viewports with no tab step; `acceptance/helpers.ts` diff empty). The removal of imports and calls stays a Scope instruction.
- Stands: all Scope items and the other criteria are unchanged.

## Re-spec 2 - 2026-11-16

- Underspecified: moving the chart collapse and reorder describe to 1280x720 assumed the charts scroll with the window; in the two-column layout they scroll inside `results-column`, so the two first/last-chart arrow-key cases' window precondition cannot hold, and the ticket forbade changing them.
- Changed: those two cases measure `results-column` (`scrollTop` strictly inside its range before, unchanged after) and keep the window check; a new criterion pins this and the `preventDefault` mutation. No other case in the eleven files has the window-scroll assumption.
- Stands: all of commit bfe505d; only those two cases in `aoe4-chart-layout.spec.ts` need editing.
