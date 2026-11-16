# SGS-184 acceptance-test 1

Verdict: PASS. Branch sgs-184-one-desktop-layout-width-floor, tested tip 9b06cb95, new commit 517ede8773e87f5e96ac3825d558cf1071669543 (test files only).

## Tests written (2 new, in the existing specs)

- `acceptance/aoe4-split-layout.spec.ts` "a saved-build load shows both panels and scrolls neither the window nor the columns" (criterion 6): saves a build through the API, opens `?b=<id>` at 1280x800, asserts in one evaluate under expect.poll, after two frames, that the build column can scroll (precondition), both panels are shown, and window, build-column and results-column scroll are all 0. The file's `test` is now `gatedTest('aoe4-split-layout')` for the per-client rate-limit header; existing cases unchanged.
- `acceptance/aoe4-min-width.spec.ts` "at 390x844 step-table rows are table rows" (criterion 7): switches to the table view at 390 wide, asserts more than one `step-row` and that the set of computed `display` values is exactly `['table-row']`.

## Run

Harness ran (Playwright, Chromium, own next dev). min-width plus split-layout: 11 passed. Plus split-scroll, split-tab-order, editor-width: 37 passed. `npx tsc --noEmit` clean, jscpd 0 clones. Nothing left running.

The implementer's existing cases (aoe4-min-width: 1199, 390, overlap, resize; aoe4-split-layout: 1280, 1200, 1800, no-JS server render, hydration/before-after) all pass at 9b06cb95.

## Mutation checks (new tests)

- Table rows: added `@media (max-width: 767.98px) { .table > tbody > tr { display: block; } }` to `components/apps/aoe4-build-order/step-table.module.css`. Test failed on the `displays` assertion (`toEqual({ many: true, displays: ['table-row'] })`, line 105). Undone with `git checkout -- components`.
- Load scroll: added a ref callback on the `build-column` div in `components/apps/aoe4-build-order/workbench-columns.tsx` that sets `scrollTop = 40` after 100 ms. Test failed on `scrolled` (expected 0, received 40, line 136). Undone with `git checkout -- components`; status shows only the acceptance files.

## Coverage of criteria not covered before

- Criterion 6 (`?b=` load scrolls nothing, both panels visible): now pinned. "Enabled Text/Table with run and pin" was not added; it was outside what the review flagged and existing pin-compare specs exercise those buttons.
- Criterion 7 (rows are table rows at narrow): now pinned. The "no media or container query in CSS" part is a reviewer read per the ticket, not expressible as a spec.

## Not expressible in this harness

- CSS-has-no-viewport-queries and `.editor` not a size container (ticket says reviewer reads the CSS).
- Screenshot review at 1200/1280/1800/390 (review's job).
- `tsc` proof that removed symbols have no importers and `npm test`/full `npm run acceptance` (not run here by instruction scope).

## Failures

None.
