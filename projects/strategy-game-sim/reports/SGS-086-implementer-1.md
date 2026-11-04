# SGS-086 implementer report 1
Branch sgs-086-aoe4-small-screen-tabs-keyboard, worktree .claude/code-factory/worktrees/sgs-086-aoe4-small-screen-tabs-keyboard, base origin/main b9481e3. Status: needs_review.

## Files
- components/apps/aoe4-build-order/step-table.module.css: in the <768px block, `.table label/select/input` get max-width 100%, min-width 0.
- components/apps/aoe4-build-order/workbench.module.css: `.runBar` static below 768px.
- pages/apps/aoe4-build-order.tsx: `stickyBarHeight` returns 0px unless the bar's computed position is sticky; used by both scrollMarginTop effects.
- components/apps/aoe4-build-order/workbench-tabs.tsx: exported pure `nextTab(key, active, resultsEnabled)`, roving tabindex, onKeyDown with preventDefault for handled keys, focus on target.
- docs/aoe4-build-order.md: Page section (sticky at 768+ only, tab keyboard model) and Narrow layout paragraph.
- components/apps/aoe4-build-order/workbench-tabs.test.ts: 10-row it.each table.
- acceptance/aoe4-small-screen.spec.ts: 8 Playwright tests (320/360 card overflow, 360 static bar + results scroll + no covered headings, 768/1280 sticky + scrollMarginTop equals bar height, tab keys, one tab stop, disabled Results).

## Tests
- npx tsc --noEmit clean; lint:dup 0 clones; npm test 1360 passed / 10 skipped (46 files); npx next build ok; npm run acceptance 747 passed (includes new spec; aoe4-narrow-layout, results-split, inline-issues unchanged and passing).
- No pre-existing test edited.
- nextTab returns null when fewer than two tabs are enabled (so Build-only gives null for every key), as the ticket's table requires.

## Doc claims
- "At 768 px and wider a run bar stays at the top of the viewport while the page scrolls; below that it scrolls with the page." - workbench.module.css `.runBar` sticky, static under 767.98px.
- "The tabs follow the WAI-ARIA tabs keyboard model: the arrow keys, Home and End move between the enabled tabs and select the one they reach, and the tab list is one tab stop." - workbench-tabs.tsx nextTab/onKeyDown/tabIndex.
- "(their selects and inputs shrink to the card), the run bar scrolls with the page and wraps" - step-table.module.css, workbench.module.css.
- Doc grep: no other sentence says the bar is sticky at every width (the 1200px timeline sentence is already scoped to 1200+).

## Mutation checks
- Card fix: reverted step-table.module.css; the 320 and 360 step-table tests failed (2 failed); restored. Not separately measured on main: scrollWidth value (the 371 from the backlog was not re-recorded; the test fails without the rule).
- Replaced the disabled-skip filter with `true`: workbench-tabs.test.ts 3 failed; undone. The disabled-tab acceptance test still PASSED. Reason: the page derives the shown tab from resultsEnabled, and focusing a disabled button is a no-op, so the stray selection is invisible in the DOM. The ticket's claim that the acceptance test fails under this mutation does not hold; unit test covers it.
- Removed wrapping (Math.min): 1 unit test failed; undone.
- Set `.runBar` back to sticky below 768: the 360 run bar test failed; undone.

## Notes
- Computed scroll-margin-top is rounded to 3 decimals, so the 768/1280 test compares within 0.5px.
- Invariants: none apply. Nothing running left behind.

## Out-of-scope findings
None.
