# SGS-184 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-184-one-desktop-layout-width-floor`, tip `09023924d1a47342f6771eb96010581e8474661f`, diffed against `origin/main` (one commit). Full review (not delta mode).

The production code matches the contract (C1, C4, C6, the "CSS after M10" table, B1-B14) and I found no correctness defect. Two of the new acceptance cases cannot reliably fail on the part of the rule they claim to check.

## Blocking findings

1. `acceptance/aoe4-min-width.spec.ts:81-100` - test / convention - The resize case builds its own no-run check: a `request` listener, then `page.waitForTimeout(500)` after the last poll, then `expect(posts).toEqual([])`. 500 ms equals `AUTO_RUN_DEBOUNCE_MS` (`components/apps/aoe4-build-order/auto-run.ts:7`). A debounced run that the resize back to 1280 schedules posts about 500 ms after that resize. The poll plus the 500 ms wait ends at about the same moment, so the "runs nothing" claim in the title may not fail. The repo already has `expectNoRun` (`acceptance/helpers.ts:227`), which waits `AUTO_RUN_DEBOUNCE_MS + 500` and is what the sibling specs use (`acceptance/aoe4-auto-run.spec.ts:123`, `acceptance/aoe4-auto-run-contract.spec.ts:76`).
   - Direction: delete the `posts` array, its `page.on('request')` listener, the `waitForTimeout(500)` and the `expect(posts)` line. Wrap the resize loop in `await expectNoRun(page, async () => { for (...) { await page.setViewportSize(viewport); await expect.poll(state).toEqual({...}) } })`. Replace the two `{ width: 1280, height: 800 }` literals (lines 76 and 94) with `SPLIT_VIEWPORT`, which has the same value.
   - Production change it must fail on: a resize handler in `pages/apps/aoe4-build-order.tsx` that reschedules the debounced run (the `setTimeout(..., AUTO_RUN_DEBOUNCE_MS)` path at `auto-run.ts:211`).
   - Precondition: the run is `current` after the `waitForRun` fill (already asserted).
   - Values: posts `[]` before the fix; with the mutation, one `/api/aoe4-build-order/simulate` URL about 500 ms after the resize back to 1280. That falls inside `expectNoRun`'s 1000 ms window and at the edge of the current 500 ms one.

2. `acceptance/aoe4-split-layout.spec.ts:75-82` - test - "the columns are the same before and after the first run": nothing makes `before` a pre-run reading. `before` is read once `goto` resolves and `workbench-split` is visible. On a warm dev server the first simulate (released as soon as the router is ready) can already have answered by then. The comparison is then post-run against post-run and cannot fail. At `SPLIT_VIEWPORT` a width-based switch cannot show either, so a result-dependent layout change is the only thing this half of the case can catch, and only if `before` really precedes the run.
   - Direction: before `page.goto`, `const release = await holdNextSimulate(page)`. After `goto`, assert the precondition `await expect(page.getByTestId('auto-run-status')).not.toHaveAttribute('data-status', 'current')`. Read `before` with null-safe lookups (`document.querySelector(...)?.getBoundingClientRect().left ?? null`, rounded), so a missing column reads as a value instead of throwing. Then `await waitForRun(page, async () => release())`, read the columns again and compare. Keep the hydration listeners and the `expect(hydration).toEqual([])` line as they are.
   - Production change it must fail on: in `components/apps/aoe4-build-order/workbench-columns.tsx`, render the `results-column` div only once a result exists (the page passes `results` as `null` while `result === null && pin === null`). That is a B7 regression.
   - Values: before `[97, null]`, after `[97, 649]` at 1280x800. These positions come from this review's inspection: `build-column` left 97, `results-column` left 649.

## Spec gaps

None.

## Acceptance criteria

| # | criterion | verdict | evidence |
|---|-----------|---------|----------|
| 1 | Side by side at MIN/WIDE, no sideways scroll, no tablist | pass | `aoe4-split-layout.spec.ts:37-55` rows at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, plus `toHaveCount(0)` on `tablist` at 1280 (line 34). Inspection at 1200 and 1800: `tablists: 0`, columns apart, `scrollWidth == innerWidth`. |
| 2 | JS-disabled server render is two columns; no hydration message; same columns before and after the first run | **fail** (test) | The JS-disabled case (lines 57-65) fails at the base, where the server HTML has no `workbench-split`. The hydration listener covers both `console` and `pageerror` (the implementer mutation-checked it). The "before and after the first run" half cannot reliably fail: blocking finding 2. |
| 3 | At 1199 and 390 the section width matches the 1200 reference; `scrollWidth > innerWidth`; split and panels visible | pass | `aoe4-min-width.spec.ts:22-48`. The reference is read in the same test at `MIN_SUPPORTED_VIEWPORT`. Inspection: section 1113 px at 390, 1199, 1200 and 1280; scrollWidth 1127 at 390 and 1246 at 1199. |
| 4 | B3 at 390x844 in one evaluate under `expect.poll`; run bar sticky | pass | `aoe4-min-width.spec.ts:50-68`. At the base, 390 renders tabs with no `workbench-split` and a static run bar, so the case fails there. Inspection at 390: `runBarPos: sticky`, build column [27, 561], results column [579, 1113]. |
| 5 | Resize 1280 -> 390 -> 1280 keeps focus and value, no simulate request, layout in place | **fail** (test) | Focus, value, columns and sideways scroll are polled correctly. The no-request check has no margin over the debounce: blocking finding 1. By code reading the production side holds: no resize or `matchMedia` consumer is left in `components/apps/aoe4-build-order` or `pages/apps`. |
| 6 | Text and Table never disabled; `?b=` load selects and scrolls nothing | pass (code) | `viewDisabled` is removed from `BuildInputProps` (`build-input.tsx:31-35`), and `tsc --noEmit` is clean. The `awaitingLoadTab` effect, the only post-load selection, is deleted, and the load path (`pages/apps/aoe4-build-order.tsx:227-243`) has no scroll or selection call. No spec asserts the `?b=` no-scroll part (note below). |
| 7 | Rows are `table-row` at narrow; no media or container query; `.editor` not a container; compact values in base rules | pass | I read `workbench.module.css`, `step-table.module.css` and `step-annotation.module.css` at the tip: no `@media` or `@container`, `container:` removed from `.editor`, and the folded values match the design table exactly (font 0.875rem, gutter `min-width: 0; padding-right: 0.125rem`, annotations `4.7ch; padding-right: 0`, textarea `0.375rem 0.25rem`). Inspection at 390 in the table view: `step-row` computed `display: table-row`. |
| 8 | Removed symbols have no importer; `workbench-tabs.test.ts` gone; `npm test` passes | pass | `npx tsc --noEmit` is clean. `git grep` finds no `useSplitLayout`, `WORKBENCH_SPLIT_QUERY`, `WorkbenchTab(s)`, `nextTab`, `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` or `showTab`. `npm test`: 83 files passed, 1 skipped; 2613 tests passed, 15 skipped. |
| 9 | Only `aoe4-min-width.spec.ts` sets a viewport under 1200 px; its layout reads are single evaluates under poll | pass | I checked every `setViewportSize`, `viewport:` and `width:` literal in `acceptance/`; the only widths under 1200 are `PHONE` and 1199 in the new spec. Each of its layout reads is one `evaluate` under `expect.poll`. |
| 10 | `lint:dup` clean; `npm test` and `npm run acceptance` pass | pass / unverified | `lint:dup`: 0 clones. `npm test` passes. I did not run `npm run acceptance` (review runs no acceptance tests); the implementer reports 1124 passed. |
| 11 | Screenshots at 1200, 1280, 1800 and 390 | pass | See UI inspection. Two columns, no tab strip; at 390 the same layout scrolled sideways with no overlap. |
| 12 | No INVARIANTS.md regressions | pass | See Invariants. |

Pre-existing test edited: in `step-annotation.test.ts:178` the regex `<td class="[^"]*"></td>` became `<td></td>`. Scope requires dropping `styles.startSpacer` from that cell, which removes its only class. The test still fails if the cell is not empty, so the edit is allowed.

## Invariants

These apply because the diff touches `components/apps/aoe4-build-order/**` and `pages/apps/aoe4-build-order.*`.

- A1, A2, A3: hold. No engine, data or simulation path is touched; the diff only removes layout state and CSS.
- S1-S3: hold. The site-wide paths are not touched and no cross-app import is added. The width floor sits on `.pageSection` only, and `pages/_app.js` is unchanged.

## spec-checklist

- Contracts: no Key-surfaces name changed.
- Scope: no `golang/` change, no docs change (that is SGS-185), and no viewport meta change.
- No invented constant: `1140px - var(--bs-gutter-x, 1.5rem)` is C4 verbatim.
- Naming: `WorkbenchColumns` follows C1, and no dead props are left.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no `rulesFile`.

## UI inspection

I served the task checkout with `npx next dev -p 3871` and ran `inspect.cjs` with the repo's Playwright. I loaded `/apps/aoe4-build-order` at 390x844, 1199x800, 1200x800, 1280x800 and 1800x900, in the Text view and then the Table view, and at 390 also scrolled fully sideways in the Table view. The server is stopped and the port is free.

- **Clipped overflow:** only `p[chart-reorder-help].visually-hidden`, which is hidden by design.
- **Sibling overlaps:** only stacked recharts SVG `g` layers, which is expected.
- **Words broken mid-word:** none at any width.
- **Tablists:** 0 at every width.
- **Run bar position:** `sticky` at every width.
- **Section and header widths:** the section is 1113 px at 390, 1199, 1200 and 1280, and 1293 px at 1800. The header stays viewport-wide: 363 px at 390 and 933 px at 1199.
- **Step rows:** `step-row` has `display: table-row` at every width.
- **Screenshots read:** 390 text, 390 table scrolled, 1199 text, 1200 text, 1280 table, 1800 text. Each shows the two columns with the compact editor and the save row on one line. At 390 and 1199 the same layout extends past the right edge and scrolls sideways, with nothing overlapping.

## Linter and build

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npx next build`: compiled; `/apps/aoe4-build-order` is SSG.

## Non-blocking notes

- `aoe4-min-width.spec.ts:24` title "the section keeps its 1200 px width" can read as 1200 px wide, but the section is 1113 px. Suggest "keeps the width it has at a 1200 px viewport".
- No spec asserts criterion 6's "`?b=` load scrolls neither the window nor the Build column", or criterion 7's computed `table-row` at the narrow viewport. Both hold by code reading and by the inspection; adding cases is acceptance-test's call.
- `aoe4-min-width.spec.ts:80` calls `textarea.focus()` without an instant `scrollIntoView` (ARCHITECTURE.md "Acceptance tests scroll hover and focus targets into view instantly"). At 1280 the textarea is already in view after `fill`, so this has no effect today.
- `workbench-tabs.tsx` -> `workbench-columns.tsx` shows in git as a delete plus an add: the contents shrank too much for rename detection. This is expected for the reduction.

## Out-of-scope findings

- `acceptance/aoe4-auto-run.spec.ts:65-77` ("first load runs once") collects hydration messages from `console` only. In this Next/React version a hydration failure is reported as a `pageerror`, so its `expect(hydration).toEqual([])` cannot fail. The implementer reported this too, and reading the file confirms it.

## Coverage

- **Reviewed:** every file in the diff (14), plus `acceptance/helpers.ts` in full, the page around the changed regions, `auto-run.ts` (debounce) and `use-auto-run.ts` (hold and release).
- **Profile files loaded:** REPO.md, LESSONS.md, CONTEXT.md, INVARIANTS.md, spec-checklist.md, PROJECT.md, design/M10.md and ARCHITECTURE.md Rules.
- **REPO.md review checklist:** I followed "Every diff" (next build, page loaded in dev) and "AoE4 build order". Its 360/700/768 screenshot widths are superseded by M10, so I used the design's widths.
- **Not run:** `npm run acceptance`, by role.
- **LSP:** not available; the removed-symbol search used `git grep` and `tsc`.
