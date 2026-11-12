# SGS-133: Stop scroll anchoring in the split layout and cap the run bar height

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.12
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: Chromium's scroll anchoring is what moves `scrollY` when the run bar shrinks (not scroll clamping), and `overflow-anchor: none` on the page section removes every anchor candidate whose position changes (the spec's case (a) and its mutation run check this in a real browser); a `max-height: 40dvh` box with `overflow-y: auto` scrolls a focused control into view (checked by case (c)); the `ResizeObserver` in `useRunBarHeight` fires when the cap starts or stops applying (checked by the spec reading `--aoe4-run-bar-height` against the rendered bar); `overflow-y: auto` makes `overflow-x` compute to `auto` and clips a focused control's box-shadow focus ring at the bar's padding box (checked by the overflow and focus-ring criteria)
- **LOC estimate**: ~20 (CSS rules in `workbench.module.css`, a class on the page section in `pages/apps/aoe4-build-order.tsx`; the spec extension, helper moves and docs are excluded)
- **Depends on**: SGS-132
- **On merge**: none
- **Source**: `design/M9.md` "Run bar and scroll (M9.12)" rules and the M9.12 test row, criterion M9.12; `plans/M9-20261111.md` outline F; design question 10

## Context

At 1280x800, scrolled to the end with `duration-error` shown, clearing the error drops `scrollY` (244 to 151 in the design's measurement) because Chrome's scroll anchoring moves the page when the sticky run bar shrinks; no `overflow-anchor` is set anywhere. Separately, the run bar grows without limit as the save controls, copy form, link and storage warning open (about half of a 720px-high viewport in the design's measurement, taken before SGS-132's save row). This ticket stops the anchoring and caps the bar at 40% of the viewport from 768px up, scrolling inside it.

## Scope

- `components/apps/aoe4-build-order/workbench.module.css`:
  - `.runBar`: from 768px up it gets `max-height: 40dvh` and `overflow-y: auto`. Below 768px it stays static with no cap (the existing `max-width: 767.98px` block already holds the static rule; keep the cap out of that range). `useRunBarHeight` (`use-run-bar-height.ts`) is unchanged: its `ResizeObserver` callback writes `getBoundingClientRect().height` plus the bottom margin synchronously, and the height of a capped box is the capped height, so `--aoe4-run-bar-height` (read by `.workbenchSplit`'s `height: calc(100dvh - ...)`) follows the cap.
  - The bar must not show a horizontal scrollbar (`overflow-x` computes to `auto` once `overflow-y` is set), and a focused control at the bar's left or right edge (the build select is first on its row) must keep its whole focus ring: Bootstrap draws it as a `box-shadow` outside the control, which the bar's padding box now clips. Inline padding on the bar, or an equivalent, is the implementer's choice.
  - `overflow-anchor: none` goes on the page section, the nearest ancestor of both the run bar and `workbench-split` (the `<section>` in `pages/apps/aoe4-build-order.tsx`, today `utilStyles.headingMd` plus `container`, which `useRunBarHeight` finds with `closest('section')`). It gets a new class from `workbench.module.css`. If case (a) still fails with the rule there, the rule moves to the document's scroll root (`html`) for this page only, through a selector in the module that stays pure for CSS Modules (for example `:global(html):has(.runBar)`); no site-wide global rule. If neither placement makes case (a) pass, the drop is not anchoring: stop and report it rather than tuning other rules. The columns' own scroll positions must not change.
- Interaction with SGS-132's layout: the run bar's children at the base of this ticket are the select, duration, Text/Table toggle, `save-panel` (its own row) and `auto-run-status`, which SGS-132 leaves after the save panel. Inside `save-panel`, `save-row` holds the buttons, `save-status`, `saved-build-link` and `copy-saved-link`; below it come `save-copy-form`, `copy-saved-link-hint`, `my-builds-unavailable` and `save-build-error`. When the bar is capped, anything below the cap is reached by scrolling the bar, and every child keeps its test id and visibility rules. Do not reorder run-bar children to avoid the cap; that is not part of this ticket.
- The capped test state (design cases (b) and (c)) at 1280x720, built through the real UI in this order: storage writes throw (init script), clipboard `writeText` rejects (init script), Save as copy (the link and `my-builds-unavailable` show, the copy form closes), click `copy-saved-link` (`copy-saved-link-hint` shows), reopen the copy form with `save-build-copy`. Clearing the copy name to show `save-copy-name-error` is optional. The viewport stays 1280x720 (the design fixes it); no viewport tuning and no test-only content. In this state `my-builds-unavailable` is the bar's last child. The test does not require `save-copy-cancel` to be below the cap (after SGS-132's compact save row it is not) and does not check `auto-run-status` (it is empty at status `current`, and the run that would fill it clears the link and storage warning); drop any position-only test of it.
- Case (c) has two checks, read in one `page.evaluate` each (house lesson). Content: with the bar's `scrollTop` 0, `my-builds-unavailable` has its bottom below the bar's bottom; at max `scrollTop` (`scrollHeight - clientHeight`) its rect lies inside the `run-bar` rect within 1px. Focus: with the bar at max `scrollTop`, `build-order-select` (the bar's first focusable control) has its top above the bar's top; after `locator.focus()` its rect lies inside the `run-bar` rect within 1px.
- `acceptance/aoe4-split-scroll.spec.ts` (extend; it already has a test "the run bar height property follows the bar when it grows" to keep passing, and imports `SPLIT_VIEWPORT`, `expectNoRun` and other helpers from `acceptance/helpers.ts`, which also exports `scrollInstantly`): add the design's cases (a), (b) and (c), each reading all rects in one `page.evaluate` (house lesson).
- Test helpers: the save flow above lives as local helpers in `acceptance/aoe4-my-builds.spec.ts` at the base: `saveCopy` (with `submitCopy` and the locators and request matchers it uses), `blockStorageWrites` (the storage-throwing init script) and the `refused` clipboard scripts are examples. Use them from `acceptance/helpers.ts` where SGS-132 already moved them; for any still local, move it to `acceptance/helpers.ts` and import it in both specs. Do not copy one: the acceptance jscpd gate fails on a clone.
- Docs: `docs/aoe4-build-order.md`: the "Page" paragraph's statement that a run bar "stays at the top of the viewport" from 768px up (it needs the cap and the scrolling inside the bar), and the narrow-layout sentence that under 768px the run bar scrolls with the page. Scope names the statements; the implementer writes the replacement against the code. No measured values in the doc.
- Existing tests: a test of the changed behavior (the bar's height or overflow from 768px up) gets the new expectation; any other test keeps its expectation. The implementer lists every test it edits.

**Out of scope:** the save panel layout and status (SGS-132); reordering or restructuring run-bar children; changing `useRunBarHeight`; any change to the columns' own scrolling or to the tabs layout below 1200px beyond the 768px cap; the Tab-order spec.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 1280x800 with `duration-error` shown and the page scrolled to the end with `mouse.wheel`, clearing the error and waiting 2 animation frames leaves `scrollY` unchanged within 1px and the `run-bar` top at 0 within 1px (`useRunBarHeight` ceils the property, so the stuck bar can read under 1px from the top at the page end) The test first asserts the page is scrolled (`scrollY > 0`) and the bar got shorter, so it cannot pass on an unscrolled page. A mutation run that removes the `overflow-anchor` rule from wherever it was placed makes the test fail; the report notes the run and the placement (respec 1, respec 3)
- [ ] The columns' scroll positions do not change when the error is cleared in that case
- [ ] In the capped test state Scope describes at 1280x720, one `page.evaluate` first asserts the precondition: `saved-build-link`, `save-copy-form`, `copy-saved-link-hint` and `my-builds-unavailable` are all shown and the bar's content exceeds its box (`scrollHeight > clientHeight`); then that the `run-bar` height is at most 0.4 x 720. A mutation run that changes `max-height: 40dvh` to `none` makes the test fail, including the case (c) content check (`my-builds-unavailable` is not below the bar's bottom once the bar is uncapped); the report notes the run (respec 1, respec 2, respec 3)
- [ ] In that state `--aoe4-run-bar-height` on the section equals the bar's rendered height plus its bottom margin, within 1px, and `workbench-split` still ends at the viewport bottom (respec 1)
- [ ] In that state, with the bar scrolled to its top (`scrollTop = 0`), `my-builds-unavailable` has its bottom below the bar's bottom; after setting `scrollTop` to its maximum its rect lies inside the `run-bar` rect within 1px, so content below the cap is reachable by scrolling the bar (respec 1, respec 2, respec 3)
- [ ] In that state, with the bar at its maximum `scrollTop`, `build-order-select` has its top above the `run-bar` top; after `locator.focus()` its rect lies inside the `run-bar` rect within 1px, so a control scrolled out of the capped bar is reachable by focus (respec 3)
- [ ] At 768x1024 and at 1280x720 in the capped state, the bar shows no horizontal overflow (`scrollWidth <= clientWidth`), and with `build-order-select` focused its rect grown by the focus ring's spread (read from its computed `box-shadow`) lies inside the bar's padding box. A test fails if the bar keeps `overflow-y: auto` with no room for the ring (respec 1)
- [ ] Below 768px the run bar is static and uncapped: a test at a viewport narrower than 768px asserts a computed `position` of `static` and a computed `max-height` of `none` (respec 1)
- [ ] The existing tests in `aoe4-split-scroll.spec.ts`, and every acceptance spec that uses `run-bar`, `auto-run-status` or the `save-*` ids, pass; a test of the changed behavior gets the new expectation, any other test keeps its expectation (the implementer lists every test edited) (respec 1)
- [ ] Each save-flow helper the new cases use is defined once in `acceptance/helpers.ts` and imported by every spec that uses it; `npm run lint:dup` finds no clone between `aoe4-split-scroll.spec.ts` and `aoe4-my-builds.spec.ts` (respec 1)
- [ ] `docs/aoe4-build-order.md` describes the cap and the internal scroll, and none of the statements Scope lists is left untrue
- [ ] `npm run lint:dup` (both configs), `npx tsc --noEmit` and `npm test` pass, and `aoe4-split-scroll.spec.ts` passes under `npm run acceptance`
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the capped state (cases (b) and (c)) assumed the design's pre-SGS-132 measurement still exceeds the cap; the `overflow-anchor` placement had no order or fallback; the shared test helpers were unnamed; side effects of `overflow-y: auto` (horizontal overflow, clipped focus rings) and the `auto-run-status` check were missing.
- Changed: Scope now builds the capped state step by step with a rule for adding real content until it exceeds the cap (precondition asserted first, viewport fixed, `designer` stop if it cannot), places the rule on the page section with a scoped `html` fallback and a stop if neither works, names the helpers to reuse or move, and adds the overflow, focus-ring and `auto-run-status` criteria.
- No branch work exists yet.

## Re-spec 2 - 2026-11-11

- Underspecified: the capped-state stopping rule only required overflow, which content below `save-copy-cancel` can satisfy; the `auto-run-status` check could pass vacuously when the element was hidden.
- Changed: Scope's rule now requires the overflow and `save-copy-cancel` below the bar's bottom at `scrollTop` 0, plus `auto-run-status` shown via a completed run (`waitForRun`), all asserted in the precondition; criteria 3, 5 and 6 follow (respec 2).
- No branch work exists yet.

## Re-spec 3 - 2026-11-12

- Underspecified: cases (b) and (c) were written against the pre-SGS-132 layout; after the compact save row `save-copy-cancel` cannot sit below the cap, `auto-run-status` is empty at status `current`, and the stuck bar reads under 1px from the top at the page end.
- Changed: Scope's capped state is the design's (b) list (clipboard refused, hint shown, form reopened) with no cancel-below-bar rule or add-content ladder; reachability is checked on `my-builds-unavailable` by scroll and on `build-order-select` by focus; the `auto-run-status` criterion is removed; case (a) allows the bar top within 1px; the cap mutation must also fail the content check.
- Branch work on `sgs-133-split-scroll-anchoring-run-bar-cap` (cap, anchoring fix, docs, helper moves, tests for cases (a), overflow and static) stands; only the capped-state tests change.
