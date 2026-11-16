# SGS-182: Move the save, load and auto-run specs to desktop viewports

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (acceptance specs only; the AoE4 invariants match by path and no `lib/aoe4-build-order/**` or component file changes)
- **Unverified assumptions**: none (the specs run against the real page in Chromium; nothing is faked beyond what the files already route-stub)
- **LOC estimate**: 0 (test-only: about 120 spec lines deleted and about 80 changed in four `acceptance/` files; no business logic)
- **Depends on**: SGS-179
- **On merge**: none
- **Source**: design/M10.md "Acceptance spec inventory (M10.3)" rows for `aoe4-save-open`, `aoe4-save-status`, `aoe4-my-builds`, `aoe4-auto-run`; contract C5; plans/M10-20261116.md outline D; criterion M10.3

## Context

M10 makes the AoE4 build-order page desktop-only (supported from 1200 px). Step 1 moves every spec off the tabs layout and narrow widths while today's code still passes, so each PR is green. This ticket covers the save, load, status, My builds and auto-run specs. It uses `MIN_SUPPORTED_VIEWPORT` (`{ width: 1200, height: 800 }`, C5), which SGS-179 adds to `acceptance/helpers.ts`; until SGS-179 is integrated, read it from that ticket's end state. Everything here passes on today's page code. The default Playwright viewport is the Desktop Chrome device (two columns, both panels always visible).

## Scope

Every change is in `acceptance/`. Each of the four files ends with no `showTab` call or import, no `TABS_VIEWPORT` import, no `PHONE` or `NARROW` constant, and no `tab-build` / `tab-results` test id. Where a `showTab` call was the only wait before reading a panel, the next assertion on that panel's own content still waits for it. Names below are pointers to where to look.

- `aoe4-save-open.spec.ts`
  - The case "a saved build whose text no longer converts opens as text with the issues and no run" drops its `page.setViewportSize(PHONE)` (runs at the default viewport) and its `tab-build` `aria-selected` assert. Its other assertions stay.
  - Delete the describe "the tab after a load at 390 px" (four cases: successful load selects Results, no-b stays on Build, fallback b stays on Build, later run does not switch the tab). Nothing is selected after a load once tabs go. Delete helpers, constants and imports the deletion leaves unused (examples: `ABSENT_ID`, `apiSave`, `afterFrames`, `VALID_A`, `openSavedBuild`, `client`; keep each one a remaining case still uses).
  - Drop `showTab` calls (examples: "a first b wins over a later one", "the load holds the first run ...") and the `PHONE` constant.
- `aoe4-save-status.spec.ts`
  - The `VIEWPORTS` loop over `[1280x800, 390x844]` becomes one describe at 1280x800 (`WIDE` stays); drop the 390 row and the `VIEWPORTS` array. Its two cases are unchanged apart from no longer being generated per viewport.
  - In `layout`: keep "the empty status adds no height", "share one line" at 1280x800 and "at 1200 px the row shares one line and does not overflow" (this one may use `MIN_SUPPORTED_VIEWPORT` in place of the literal `1200x800`). Delete "at 1199 px the row keeps DOM order" and the "at 390x844" describe; remove `NARROW`. Rename the "at the one-line threshold" describe if it no longer describes one case.
- `aoe4-my-builds.spec.ts`
  - "layout of the save panel": rewrite the case so that at `MIN_SUPPORTED_VIEWPORT`, with the copy form open and again with the saved-link panel shown, (1) the document does not scroll sideways (`scrollWidth` at most the viewport width) and (2) the editor does not sit under the run bar (editor top at or below the run bar bottom). The run bar must also be at most 40% of the viewport height at `MIN_SUPPORTED_VIEWPORT` and at 1280x720. Drop the 768x1024 row and every `PHONE` use. The form and link must stay visible after the checks, as the current case asserts.
  - Drop `showTab` (the pinned-label case under "the pinned label for an opened link"), its import, and the now-unused `PHONE` constant.
- `aoe4-auto-run.spec.ts`
  - "first load runs once in the tabs layout" and "an invalid text edit dims the charts in the tabs layout": remove the `TABS_VIEWPORT` `test.use` so they run at the default viewport, and rename the describes (or flatten to plain cases) so no title names tabs. Remove the `tab-build` / `tab-results` asserts; the request-count, request-body, status, hydration-warning, issues, last-good and dimming asserts stay. Where the dimmed-chart case waited via `showTab(..., 'results')`, it keeps waiting for the `results-last-good` element before reading opacity.
  - "the page never scrolls by itself" (describe "at 390 px wide"): move to the default viewport and drop the describe's `test.use`. It first asserts the window can scroll (the instant scroll to a requested y lands at a y greater than 0) and that the Build column can scroll (its `scrollTop` after scrolling by 400 px is greater than 0), then runs a valid duration edit and then an invalid one; the window `scrollY` and the Build column's `scrollTop` are unchanged after each, as today's case asserts for the window. Drop its `tab-build` asserts. If the page at the default viewport cannot scroll the window or the column, the implementer records the measured scroll range in the report and stops for a re-spec; it must not shrink the viewport below `MIN_SUPPORTED_VIEWPORT` or relax the `> 0` precondition.
  - Drop every other `showTab` call (examples: "Enter and build select skip the pause", "an invalid duration", "a superseded request ...") and the `showTab` and `TABS_VIEWPORT` imports.
- Rule for other tests: a test of removed behavior is deleted (above); every other case in these four files keeps its assertions and expected values.
- `npm run lint:dup` (config `.jscpd.tests.json`) must report no clone introduced by these edits.

**Out of scope:** every other spec file; `acceptance/helpers.ts` (SGS-179 adds `MIN_SUPPORTED_VIEWPORT`; a later ticket removes `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab`); any page, component, CSS or doc change; the `aoe4-min-width` spec.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] None of the four files (`aoe4-save-open`, `aoe4-save-status`, `aoe4-my-builds`, `aoe4-auto-run`) imports or calls `showTab`, imports `TABS_VIEWPORT`, declares `PHONE` or `NARROW`, or references a `tab-build` / `tab-results` test id; `npx tsc --noEmit` passes (no unused or missing import).
- [ ] The "opens as text" case in `aoe4-save-open.spec.ts` runs at the default viewport with no viewport override and still asserts the invalid status, the issues list, the text, no load error, the disabled copy button and no POST after the debounce.
- [ ] The "tab after a load" cases no longer exist; the remaining cases in `aoe4-save-open.spec.ts` are unchanged apart from tab steps.
- [ ] `aoe4-save-status.spec.ts` runs its status cases once, at 1280x800, with no 390 row; the one-line cases hold at 1280x800 and at 1200 wide; no case sets a viewport under 1200 wide.
- [ ] The save-panel layout case in `aoe4-my-builds.spec.ts` sets no viewport under 1200 wide, and at `MIN_SUPPORTED_VIEWPORT` it fails if the open copy form or the saved-link panel makes the document scroll sideways, or if the editor sits above the run bar's bottom edge. It also fails if the run bar exceeds 40% of the viewport height at `MIN_SUPPORTED_VIEWPORT` or at 1280x720.
- [ ] The scroll case in `aoe4-auto-run.spec.ts` runs at the default viewport, asserts the window scrolled to a y greater than 0 and the Build column's `scrollTop` is greater than 0 before it relies on either, and a test fails if a valid or an invalid edit changes the window `scrollY` or the column `scrollTop`.
- [ ] The first-load and invalid-edit cases in `aoe4-auto-run.spec.ts` run at the default viewport and keep their request-count, body, status, hydration, issues, last-good and dimming assertions.
- [ ] `npm run lint:dup` reports no clone involving the changed cases; `npm test` passes; the four edited specs pass under `npm run acceptance`, run per file, on the unchanged page code. The implementer's report lists every test it deleted or rewrote.
- [ ] No INVARIANTS.md regressions

## Open questions

none
