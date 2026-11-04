# SGS-086: Fit the AoE4 workbench to phone screens and make its tabs keyboard-navigable

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: post-M4 UX fixes)
- **Priority**: medium
- **Risk**: low
  <!-- One component, no API/schema/config change, no adjacent invariant, well under 100 lines of business logic. -->
- **Invariants**: none
- **LOC estimate**: 45 (workbench-tabs.tsx key handling ~30, three CSS rules ~10, scroll-margin guard in pages/apps/aoe4-build-order.tsx ~5; tests and docs excluded)
- **Depends on**: none (branch from main; `sgs-086-aoe4-small-screen-tabs-keyboard`)
- **On merge**: none
- **Source**: BACKLOG.md bullets "Step-table cards (SGS-068)", "Sticky run bar on phones" and "Workbench tabs (`workbench-tabs.tsx`)", all re-checked against main at `ee7ecb9` (below)

## Context

Three small-screen and keyboard defects on `/apps/aoe4-build-order`, all UI-only. Re-check against main
(by reading the code; the implementer reproduces each before fixing):

- **Card selects overflow (holds).** `step-table.module.css` turns each table row into a block card below
  768 px, but the selects in `step-table.tsx` (`SelectControl`, and the trigger and action selects in the row)
  carry `form-select form-select-sm w-auto` with no `max-width`, so a long option label sets the select's
  intrinsic width past a 320 or 360 px card. `acceptance/aoe4-narrow-layout.spec.ts` only covers 390 px.
- **Sticky run bar too tall (holds).** `build-input.tsx` renders the run bar with `styles.runBar`
  (`position: sticky; top: 0`), and `workbench.module.css` makes each `.runField` full width below 768 px, so
  the select, duration, Run and the Text/Table toggle stack into roughly a third of a 360x760 screen that
  follows the user and covers chart titles on the Results tab.
- **Tabs have no arrow-key navigation (holds).** `workbench-tabs.tsx` renders two `role="tab"` buttons that are
  both in the tab order and ignore Left/Right/Home/End.

None of the three bullets is dropped.

## Scope

1. **Card selects.** In `components/apps/aoe4-build-order/step-table.module.css`, inside the existing
   `max-width: 767.98px` block, add a rule so every `select` (and text `input`) under `.table` has
   `max-width: 100%` and `min-width: 0`, and so the `Labeled` label wrapper in `step-table.tsx` (a `d-flex`
   label below md) lets its control shrink. Use the module CSS rule only; do not add Bootstrap `mw-100`
   utilities on elements that module CSS also styles. Rows above 768 px are unchanged. The start row
   (`step-start-row`) selects are covered by the same end state (see criteria).
2. **Run bar.** In `components/apps/aoe4-build-order/workbench.module.css`, make `.runBar` `position: static`
   below 768 px (`max-width: 767.98px`, the breakpoint `.runField` already uses) and keep it sticky at 768 px
   and wider. In `pages/apps/aoe4-build-order.tsx`, the two effects that set `scrollMarginTop` from
   `runBar.current.getBoundingClientRect().height` (the results scroll-into-view and the rejection scroll)
   use a margin of `0px` when `getComputedStyle(bar).position` is not `sticky`, so a scrolled-to target is not
   pushed down by a bar that no longer overlaps it. The `--run-bar-height` variable and the 1200 px timeline
   column are unchanged (they apply only at 1200 px and wider).
3. **Tabs.** In `components/apps/aoe4-build-order/workbench-tabs.tsx` implement the WAI-ARIA tabs keyboard
   model with selection following focus:
   - Roving tabindex: the tab matching `active` has `tabIndex={0}`, the other `-1`.
   - On a tab, `ArrowRight` and `ArrowLeft` move to the next and previous enabled tab, wrapping; `Home`
     and `End` move to the first and last enabled tab. The target tab is selected through `onSelect` and
     receives focus. A disabled tab (Results while `resultsEnabled` is false) is skipped, so with only Build
     enabled every arrow key leaves Build selected and focused. Call `preventDefault` for handled keys only.
   - Put the "next enabled tab for a key" decision in a small pure function exported from `workbench-tabs.tsx`
     (inputs: the key, the active tab, `resultsEnabled`; output: the tab to select or `null`) so a unit test can
     pin it.
4. **Docs.** `docs/aoe4-build-order.md`, section "Page": change "A run bar stays at the top of the viewport
   while the page scrolls" to say it does so at 768 px and wider and scrolls with the page below that; add one
   sentence that the Build and Results tabs follow the WAI-ARIA tabs keyboard model (arrow keys, Home, End,
   one tab stop). Grep the doc for other sticky-bar statements and fix any it contradicts.
5. **Tests** (new files only; do not touch `acceptance/aoe4-build-order.spec.ts`, which is being deleted):
   - `components/apps/aoe4-build-order/workbench-tabs.test.ts` (Vitest, table style via `it.each`) for the pure
     function.
   - `acceptance/aoe4-small-screen.spec.ts` (Playwright, helpers from `acceptance/helpers.ts`). Read every rect
     in one `page.evaluate` or wrap the check in `expect.poll` (LESSONS.md).
   Any existing test the change breaks is edited to the new expected value and listed in the report.

**Out of scope:** making the run bar compact instead of static; changing the 768 px or 1200 px breakpoints;
the step-table open-row bug and the Text/Table remount bullets; any other BACKLOG.md item; Results-tab
chart layout; touching `acceptance/aoe4-build-order.spec.ts`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At viewports 320x700 and 360x760, with the ENG Knight/Longbow build (the longest prebuilt) in the Table
      view, `document.documentElement.scrollWidth` is at most the viewport width, and the right edge of every
      `select` and `input` inside `step-table` is at most the viewport width (one `page.evaluate`, polled).
      The same check at 390 px still passes (`aoe4-narrow-layout.spec.ts` unchanged).
- [ ] The card-select check fails if the new `max-width` rule is removed: before the fix, at 360 px the
      `step-field-tech` select pushes `scrollWidth` above 360 (the backlog measured 371); the implementer
      confirms the spec fails on main and passes on the branch and records both in the report.
- [ ] At 360x760 the `run-bar` computed `position` is `static`: after a run and scrolling the Results tab down,
      the bar's top is negative (it has scrolled away) and no chart title is covered by it.
- [ ] At 768x1024 and 1280x720 the `run-bar` computed `position` is `sticky` and its top stays at 0 after
      scrolling; `aoe4-results-split.spec.ts` and `aoe4-build-order-inline-issues.spec.ts` pass unchanged.
- [ ] At 360x760 a successful run scrolls the results heading into view with its top within the viewport
      (at least 0) and the results panel `scrollMarginTop` is `0px`; at 1280 px it equals the bar height.
- [ ] With a result shown, focusing `tab-build` and pressing ArrowRight selects `tab-results` (it has
      `aria-selected="true"`, is the `document.activeElement`, and `panel-results` is visible); ArrowLeft
      from Results selects Build; ArrowRight from Results wraps to Build; Home and End select the first and
      last tab.
- [ ] Roving tabindex: the selected tab has `tabindex="0"` and the other `-1`; Tab from the selected tab moves
      focus out of the tablist (not to the other tab).
- [ ] With no result and no pin (Results disabled), pressing ArrowRight, ArrowLeft, Home and End on Build
      leaves Build selected and focused.
- [ ] `workbench-tabs.test.ts` pins the pure function over a table: (ArrowRight, build, results enabled) gives
      results; (ArrowLeft, build, enabled) wraps to results; (ArrowRight, results, enabled) wraps to build;
      (Home, results, enabled) gives build; (End, build, enabled) gives results; (ArrowRight, build, disabled)
      gives null; (an unrelated key such as "a", build, enabled) gives null. The break it catches: wrapping
      or the disabled-skip removed.
- [ ] Mutation check: replacing the disabled-skip in the pure function so that it returns `results` while
      `resultsEnabled` is false makes `workbench-tabs.test.ts` and the disabled-tab acceptance test fail.
- [ ] `docs/aoe4-build-order.md` describes the run bar as sticky only at 768 px and wider and states the tab
      keyboard model; no sentence in the doc says the bar is sticky at every width.
- [ ] `npx tsc --noEmit`, `npm test`, `npx next build` and `npm run acceptance` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
