# SGS-133: Stop scroll anchoring in the split layout and cap the run bar height

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.12
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: Chromium's scroll anchoring is disabled for the window by `overflow-anchor: none` on the element that holds the anchor candidates, and a `max-height: 40dvh` box with `overflow-y: auto` scrolls a focused control into view (the Playwright spec checks both in a real browser, not a fake); the `ResizeObserver` in `useRunBarHeight` fires when the cap starts or stops applying (checked by the spec reading `--aoe4-run-bar-height` against the rendered bar)
- **LOC estimate**: ~15 (CSS rules in `workbench.module.css`; the spec extension and docs are excluded)
- **Depends on**: SGS-132
- **On merge**: none
- **Source**: `design/M9.md` "Run bar and scroll (M9.12)" rules and the M9.12 test row, criterion M9.12; `plans/M9-20261111.md` outline F; design question 10

## Context

At 1280x800, scrolled to the end with `duration-error` shown, clearing the error drops `scrollY` (244 to 151 in the design's measurement) because Chrome's scroll anchoring moves the page when the sticky run bar shrinks; no `overflow-anchor` is set anywhere. Separately, the run bar grows without limit as the save controls, copy form, link and storage warning open (about half of a 720px-high viewport in the design's measurement). This ticket stops the anchoring and caps the bar at 40% of the viewport from 768px up, scrolling inside it.

## Scope

- `components/apps/aoe4-build-order/workbench.module.css`:
  - `.runBar`: from 768px up it gets `max-height: 40dvh` and `overflow-y: auto`. Below 768px it stays static with no cap (the existing `max-width: 767.98px` block already holds the static rule; keep the cap out of that range). `useRunBarHeight` (`use-run-bar-height.ts`) is unchanged: `getBoundingClientRect().height` of a capped box is the capped height, so `--aoe4-run-bar-height` (read by `.workbenchSplit`'s `height: calc(100dvh - ...)`) follows the cap.
  - `overflow-anchor: none` on a rule that meets the scroll rule below. Placement (the page section, `.workbenchSplit`, or `.column`) is the implementer's call, as the design leaves it; the placement is chosen by what makes the spec's case (a) pass, and the columns' own scroll positions must not change.
- Interaction with SGS-132's layout: the run bar's children at the base of this ticket are the select, duration, Text/Table toggle, `save-panel` (its own row) and `auto-run-status`, which SGS-132 leaves after the save panel. When the bar is capped, anything below the cap, `auto-run-status` included, is reached by scrolling the bar and keeps its test id and visibility rules. Do not reorder run-bar children to avoid the cap; that is not part of this ticket.
- `acceptance/aoe4-split-scroll.spec.ts` (extend; it already has `SPLIT_VIEWPORT`, `scrollInstantly` and `expectNoRun` helpers available from `acceptance/helpers.ts`, and a test "the run bar height property follows the bar when it grows" to keep passing): add the design's cases (a), (b) and (c), each reading all rects in one `page.evaluate` (house lesson). A case needing the copy form, a link and the storage warning opens them through the real save flow with storage throwing via an init script; reuse the helpers SGS-132 left in `acceptance/helpers.ts` (or `aoe4-my-builds.spec.ts`) rather than copying them, since the acceptance jscpd gate fails on a clone.
- Docs: `docs/aoe4-build-order.md`: the "Page" paragraph's statement that a run bar "stays at the top of the viewport" from 768px up (it needs the cap and the scrolling inside the bar), and the narrow-layout sentence that under 768px the run bar scrolls with the page. Scope names the statements; the implementer writes the replacement against the code. No measured values in the doc.

**Out of scope:** the save panel layout and status (SGS-132); reordering or restructuring run-bar children; changing `useRunBarHeight`; any change to the columns' own scrolling or to the tabs layout below 1200px beyond the 768px cap; the Tab-order spec.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 1280x800 with `duration-error` shown and the page scrolled to the end with `mouse.wheel`, clearing the error and waiting 2 animation frames leaves `scrollY` unchanged within 1px and the `run-bar` top at 0; the test fails with the anchoring rule removed (confirmed by a mutation run noted in the report)
- [ ] The columns' scroll positions do not change when the error is cleared in that case
- [ ] At 1280x720 with the copy form, the link and the storage warning open, the spec first asserts the bar's content exceeds its box (`scrollHeight > clientHeight`), then that the `run-bar` height is at most 0.4 x 720; the test fails with the cap removed
- [ ] In that state `--aoe4-run-bar-height` on the section equals the bar's rendered height plus its bottom margin, within 1px, and `workbench-split` still ends at the viewport bottom
- [ ] With the bar scrolled to its top in that state, `save-copy-cancel` (the bar's last focusable control) has its bottom below the bar's bottom; after `locator.focus()` its rect lies inside the `run-bar` rect, so a control below the cap is reachable. `auto-run-status` is likewise reachable by scrolling the bar and keeps its test id
- [ ] Below 768px the run bar is static and uncapped: a test at a viewport narrower than 768px asserts a computed `position` of `static` and no `max-height` limit
- [ ] The existing tests in `aoe4-split-scroll.spec.ts`, and every acceptance spec that uses `run-bar`, `auto-run-status` or the `save-*` ids, pass unchanged; a test of the changed behavior gets the new expectation, any other test keeps its expectation (the implementer lists every test edited)
- [ ] `docs/aoe4-build-order.md` describes the cap and the internal scroll, and none of the statements Scope lists is left untrue
- [ ] `npm run lint:dup` (both configs), `npx tsc --noEmit` and `npm test` pass, and `aoe4-split-scroll.spec.ts` passes under `npm run acceptance`
- [ ] No INVARIANTS.md regressions

## Open questions

none
