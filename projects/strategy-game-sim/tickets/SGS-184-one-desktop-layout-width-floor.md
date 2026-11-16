# SGS-184: One desktop layout: remove tabs and breakpoints, add the width floor

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: Next.js (pages router, `getStaticProps`) puts the whole page markup, both columns included, in the server HTML that a `javaScriptEnabled: false` Playwright context loads, so the "server render is two columns" case sees real server output; in a Chromium viewport narrower than the section's minimum width, `documentElement.scrollWidth` exceeds `window.innerWidth` instead of the browser shrinking the layout (a real phone browser's initial zoom for wider-than-viewport content is not exercised: the owner check M10.5 covers it)
- **LOC estimate**: 150 (page and `WorkbenchColumns` markup removed or reduced, CSS rules folded or deleted; about 110 more lines of new spec; about 200 lines deleted, mostly the tab component, the layout hook and its test)
- **Depends on**: SGS-179, SGS-180, SGS-181, SGS-182, SGS-183
- **On merge**: none
- **Source**: design/M10.md (Summary, Contracts C1 C2 C4 C6 C7, Behavior rules B1-B14, "CSS after M10", Delivery order step 2); M10.1, M10.2 and the helper and unit-test part of M10.3 in MILESTONES.md; plans/M10-20261116.md outline F and Spec gap 1

## Context

M10 makes the AoE4 build-order page desktop-only with a minimum supported width of 1200 px (OD1 = 1200, OD2 = A: below it the page keeps its 1200 px layout and the document scrolls sideways, no notice). Today the page picks between two layouts: `useSplitLayout` (`matchMedia`, server snapshot `false`) chooses two columns from 1200 px up and a Build/Results tab pair below, and narrow-only CSS (media queries at 768 px, `build-editor` container queries, a step-row card layout) serves the narrow case. This ticket is delivery step 2: it removes all of that and adds the width floor, after SGS-179 to SGS-183 have moved or deleted every spec that needs the tabs, narrow or breakpoint behavior. Because the tab layout was the server render, today's server HTML has no `workbench-split`; this ticket makes the two-column markup the server render and adds that case here (plan Spec gap 1).

## Scope

State at the base: as the design's "Starting state" table. Read those files at `origin/main`; SGS-179 to SGS-183 change only `acceptance/` files, so every file below is unchanged by them except where noted.

Code:

- `components/apps/aoe4-build-order/workbench-tabs.tsx`: `git mv` to `workbench-columns.tsx` and reduce to C1: `export function WorkbenchColumns({ build, results })` rendering `workbench-split` > two columns (`build-column`, `results-column`) > `panel-build`, `panel-results`, with no `role`, `aria-labelledby`, `hidden`, tablist, tab buttons, key handling or `active`/`onSelect`/`resultsEnabled`/`split` props. The panel `id` attributes go too: nothing references them once `aria-controls` is gone (`data-testid`s are what specs use). Remove `WorkbenchTab` and `nextTab`.
- Delete `components/apps/aoe4-build-order/use-split-layout.ts` and `components/apps/aoe4-build-order/workbench-tabs.test.ts` (it tests only `nextTab`).
- `pages/apps/aoe4-build-order.tsx`: remove the `tab` state, `awaitingLoadTab` with its effect and its set in the saved-build load path, `resultsEnabled`, `shownTab`, `split`, and the `viewDisabled` prop passed to `BuildInput`; render `WorkbenchColumns`. Check each removed name has no other consumer in the file before deleting (plan checked `resultsEnabled`, `shownTab`, `split`).
- `components/apps/aoe4-build-order/build-input.tsx`: remove the optional `viewDisabled` prop and the `disabled` it sets on the Text and Table buttons (C6). `button.activeView:disabled` in `workbench.module.css` then has no way to match; delete it.
- `components/apps/aoe4-build-order/workbench.module.css`, per the design's "CSS after M10" table: fold the `min-width: 768px` `.runBar` declarations (cap, inner scroll, padding) into `.runBar`; delete the `max-width: 767.98px` blocks for `.runBar` and `.runField`; fold the `@container build-editor` values into the base `.gutter`, `.annotations` and `.textarea` rules and delete the query and the base values it overrode, and delete `container: build-editor / inline-size` on `.editor` (nothing else uses that container); fold the `min-width: 1200px` block into `.saveRow`, `.saveRow > button` and `.linkInput`; add C4 to `.pageSection`: `min-width: calc(1140px - var(--bs-gutter-x, 1.5rem))`.
- `components/apps/aoe4-build-order/step-table.module.css`: delete the `max-width: 767.98px` card block. `step-table.tsx`: drop `styles.startSpacer` from the Start row's `<td>` (the cell stays) and make `Labeled`'s `d-flex d-md-inline-flex` plain `d-inline-flex`.
- `components/apps/aoe4-build-order/step-annotation.module.css`: the `@container build-editor (width < 768px)` rule becomes an unconditional `.gutterEndTime { display: none; }` (the span stays in the DOM, per the design's Defaults).
- Comments at these seams that describe the tabs, the split switch or the narrow layout are removed or restated (the files listed above are where to look).

Specs and helpers (`acceptance/`):

- `acceptance/helpers.ts`: delete `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab` (SGS-179 to SGS-183 stop using them). Keep `MIN_SUPPORTED_VIEWPORT`, `SPLIT_VIEWPORT`, `WIDE_VIEWPORT`.
- New `acceptance/aoe4-min-width.spec.ts` (imports `openPage`, `waitForRun`, `MIN_SUPPORTED_VIEWPORT` from `./helpers`, declares `PHONE = { width: 390, height: 844 }` locally; C7 allows no other spec under 1200 px). Cases B2 (at 1199 and at `PHONE`), B3 (at `PHONE`) and B4 below. Read every layout value in one `evaluate` under `expect.poll` (LESSONS.md); follow the exemplar `acceptance/aoe4-chart-views.spec.ts`.
- `acceptance/aoe4-split-layout.spec.ts` (SGS-180 leaves it with the "split at 1280" case): add the B5 case (below). Add to the "split at 1280" case, or a sibling case, the check that no `tablist` role element exists in the page.
- Searched `acceptance/` and `components/` for what the change alters (tab test ids, `workbench-tabs`, `aria-selected`, `showTab`, `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH`, `useSplitLayout`, `viewDisabled`, `startSpacer`): after SGS-179 to SGS-183 every remaining use is in a file this ticket deletes or edits. If one remains at the base this ticket is built on, it is a sibling's miss: report it, do not patch the sibling's spec silently. Existing tests of other behavior keep their expectations.
- Docs: the untrue statements (tabs, the narrow layout, the 768 px and 1200 px breakpoints, first paint, the `?b=` tab selection, the save-row wrap) live in `docs/aoe4-build-order-ui.md` and `ARCHITECTURE.md` and are fixed by the docs ticket (SGS-185), not here, per the design's delivery order. No comment, test title or message string in code may keep describing the removed behavior.

Behavior this ticket must produce (design rule ids in parentheses):

- Two columns at every width, Build left and Results right, always both shown, no tab strip (B1). The server HTML is that layout and the client renders the same with no hydration warning and no switch after load (B5).
- Below 1200 px the section is as wide as at 1200 px (C4), holds the same two columns, and the document scrolls sideways; vertical behavior is unchanged: run bar sticky with its cap, columns fill the viewport below it and scroll on their own; the `Layout` header stays viewport-wide (B2, B14).
- At 390x844 nothing overlaps (B3). Resizing across 1200 changes nothing but the sideways scroll (B4).
- A successful `?n=` or `?b=` load builds and runs as today and selects nothing and scrolls nothing (B6). Results with no result and no pin shows what the two-column layout shows today in that state (B7). Text and Table are never disabled by the Results column (B9). Tab order follows DOM order, no positive `tabindex`, no arrow-key handling in the workbench (B10).
- One editor style, the compact one; finish time hidden in the gutter and still shown in the table view (B11). Step-table rows are always table rows, labels inline (B12). The save row never wraps, the link field shrinks (B13).

**Out of scope:** docs (SGS-185); the REPO.md review checklist; `pages/_app.js` viewport meta (other apps keep phone support); the notice (OD2 = B, dropped); any spec move or deletion SGS-179 to SGS-183 own; renaming test ids or `SPLIT_VIEWPORT`/`WIDE_VIEWPORT`; the engine, API and data.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At `MIN_SUPPORTED_VIEWPORT` and at `WIDE_VIEWPORT`, both panels are visible side by side (Build's right edge at or before Results' left edge), the document does not scroll sideways, and no element with the `tablist` role exists in the page. A test fails if the tab strip or a hidden panel returns.
- [ ] With JavaScript disabled (`javaScriptEnabled: false`), the server HTML renders `workbench-split`, `panel-build` and `panel-results`, all visible, with the build-order editor present. A test fails if the server render goes back to a one-panel or tab layout. With JavaScript enabled, no console message matching `/hydrat/i` is raised on first load and the layout is the same two columns before and after the first run.
- [ ] For each viewport width in {1199, 390x844}, the page section's border-box width is within 1 px of its width at `MIN_SUPPORTED_VIEWPORT`, `documentElement.scrollWidth` exceeds `window.innerWidth`, and `workbench-split`, `panel-build` and `panel-results` are visible. The 1200 reference is read in the same spec, not hard-coded. A test fails if the width floor is removed or applied only above a breakpoint.
- [ ] At 390x844, in one `evaluate` under `expect.poll`: the run bar's bottom is at or above `workbench-split`'s top; `build-column`'s right edge is at or before `results-column`'s left; the text editor's textarea client width is at least 50% of the `build-order-editor` client width; every chart in `CHART_IDS` has a non-zero width. The run bar still has position `sticky` (computed style) at 390.
- [ ] Resizing the viewport 1280x800 to 390x844 and back with the textarea focused keeps focus and its value, sends no simulate request, and leaves the two-column layout in place (only the sideways scroll appears and goes). A test fails if resizing across 1200 remounts the editor or re-runs.
- [ ] Text and Table are never disabled by the Results column: with a run shown and with a pin, both toggle buttons are enabled (`BuildInput` has no `viewDisabled` prop; deleting it makes a leftover caller a type error). A successful `?b=` load leaves both panels visible and scrolls neither the window nor the Build column; the existing load and run specs keep passing.
- [ ] Step-table rows in the table view are table rows at the narrow viewport too (a row's computed `display` is `table-row`), and the narrow-only CSS is gone: no AoE4 stylesheet declares a viewport media query or a container query, `.editor` is not a size container, and the compact editor values apply in the base rules. The spec rows at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT` that SGS-181 moves (compact editor, finish time hidden in the gutter and shown in the table view) keep passing unchanged. A reviewer reads the CSS files named in Scope; no search is the proof.
- [ ] Every symbol the change removes (`useSplitLayout`, `WORKBENCH_SPLIT_QUERY`, `WorkbenchTabs`, `WorkbenchTab`, `nextTab`, `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT`, `showTab`) leaves no importer: `npx tsc --noEmit` passes with them deleted. `workbench-tabs.test.ts` is deleted and `npm test` passes without it.
- [ ] `aoe4-min-width.spec.ts` is the only spec that sets a viewport under 1200 px wide; its layout reads each use one `evaluate` under `expect.poll` or `toPass`.
- [ ] `npm run lint:dup` is clean (the new spec's cases do not clone a kept case), `npm test` and `npm run acceptance` pass.
- [ ] Review (screenshots, per the design): the page at 1200, 1280 and 1800 wide shows the two columns with no tab strip, and at 390 shows the same layout scrolled sideways with nothing overlapping.
- [ ] No INVARIANTS.md regressions

## Open questions

none
