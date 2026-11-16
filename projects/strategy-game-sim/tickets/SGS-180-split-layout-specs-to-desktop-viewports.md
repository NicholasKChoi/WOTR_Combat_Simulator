# SGS-180: Move the split-layout acceptance specs to desktop viewports

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (acceptance specs only; the AoE4 invariants match by path and no `lib/aoe4-build-order/**` file changes)
- **Unverified assumptions**: none (the specs run against the real page in Chromium; nothing is faked)
- **LOC estimate**: 0 (test-only: about 160 spec lines deleted and about 40 changed in three `acceptance/` files; no business logic)
- **Depends on**: SGS-179
- **On merge**: none
- **Source**: design/M10.md "Acceptance spec inventory (M10.3)" rows for `aoe4-split-layout`, `aoe4-split-scroll`, `aoe4-results-split`; plans/M10-20261116.md outline B; criteria M10.3 and M10.1 (the kept split specs)

## Context

Step 1 of M10 moves every acceptance case off the tabs layout and off widths under 1200 px while today's code still passes them, so the later code ticket can delete the tabs and breakpoints without breaking specs. This ticket owns the three spec files that test the two-column split and its switch to tabs: `aoe4-split-layout`, `aoe4-split-scroll` and `aoe4-results-split`. The cases that exist only for the tabs layout, the 1200 px breakpoint or the sub-768 px run bar are deleted; the cases that hold the split at supported widths stay, with their tab steps dropped. It uses `MIN_SUPPORTED_VIEWPORT` (1200x800, the spec-side form of the minimum supported width), which SGS-179 adds to `acceptance/helpers.ts`; the page code does not change and everything here passes on today's main once that constant exists.

## Scope

Every change is in `acceptance/`. Each of the three files ends with no reference to `showTab`, `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH`, `workbench-tabs`, `tab-build`, `tab-results` or tab `aria-selected`, and sets no viewport under 1200 px wide. Names below are pointers to where to look. Unused imports left by the deletions are removed.

- `aoe4-split-layout.spec.ts`
  - Keep "split at 1280". Rename it so it no longer says "no tabs". Drop its `tablist` assertion and its `tab-build` and `tab-results` count assertions (no spec may reference those test ids after M10); keep the panels-visible, no `hidden` or `role` attribute, `results-last-good` visible, one-`evaluate` layout poll and the no-sideways-scroll assertions.
  - Delete: "tabs at 390"; "the breakpoint is 1200 px"; "the layout switches live, keeps the selected tab, and never re-runs"; both "a layout round trip" cases (text view, table view); "the view toggle is disabled by Results only in the tabs layout"; the describe "resize while the Results panel is hidden" with both rows; and "first paint matches the server render and the page ends split" (a later ticket re-adds the server-render case in its two-column form, together with the code that makes it pass).
  - Delete the local `tablist` helper and the helpers and imports only the deleted cases used (examples: `scrollWidth` if nothing kept uses it, `CHART_IDS`, `expectNoRun`, `showView`, `waitForRun`).
- `aoe4-split-scroll.spec.ts`
  - Delete "below 1200 px there are no columns and the page scrolls" and "below 768 px the bar is static and has no cap", plus the `NARROW_VIEWPORT` constant.
  - The describe "AoE4 workbench headings" loses its `tabs` row (the `TABS_VIEWPORT` row); the remaining split case keeps every assertion, with its tab steps dropped. Because one row is left, it may become a plain case; rename it so it no longer says "in the split layout" as one of two.
  - "the bar has no sideways scroll and keeps the focus ring of the build select at 768 px wide" moves to `MIN_SUPPORTED_VIEWPORT` (set through `setViewportSize` or `test.use`, matching the neighbours); rename it so it no longer names 768 px. Its `ringIsDrawn`, `noSidewaysScroll` and `ringInside` assertions are unchanged.
  - Drop every `showTab` call (examples: `openLongBuild` and the headings case) and the `showTab`, `TABS_VIEWPORT` and `SPLIT_MIN_WIDTH` imports.
  - Every other case keeps its assertions and viewport, including "the workbench fills the viewport below the stuck run bar" at `SPLIT_VIEWPORT` and `WIDE_VIEWPORT`, which is now the only spec that holds the sticky bar.
- `aoe4-results-split.spec.ts`: "the charts fill the Results width ..." loses its `tabs` row (`TABS_VIEWPORT`), keeping the `wide` and `split` rows; drop every `showTab` call (in `openResults` and the "no steps" case, where the next assertion on Results content already waits) and the `showTab` and `TABS_VIEWPORT` imports. Other cases keep their assertions.
- `aoe4-split-tab-order.spec.ts` needs no change (the search found no `showTab`, tab test id or sub-1200 viewport in it).
- Check before editing: re-grep these three files at the base for `showTab`, `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH`, `NARROW_VIEWPORT`, `tab-build`, `tab-results`, `workbench-tabs`, `aria-selected` and any viewport narrower than 1200. Any hit is handled as above; a hit not listed here is handled the same way and listed in the report.
- Docs: no doc names these spec files or cases (searched outside `acceptance/`); no doc changes. Not touching `acceptance/helpers.ts` (`SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab` stay until the code ticket removes them) or any other spec file.
- Existing tests: every case not named above keeps its assertions and expected values. The implementer lists every case edited, renamed or deleted in the report.

**Out of scope:** `acceptance/helpers.ts`; adding the JS-disabled server-render case or any new spec (a later ticket); any file under `components/`, `pages/`, `lib/`, `docs/`; every other spec file.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] After the change, none of `acceptance/aoe4-split-layout.spec.ts`, `acceptance/aoe4-split-scroll.spec.ts` and `acceptance/aoe4-results-split.spec.ts` imports or calls `showTab`, imports `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH`, or asserts `workbench-tabs`, `tab-build`, `tab-results` or tab `aria-selected`, and `npx tsc --noEmit` passes with the unused imports removed (the implementer also greps the three files for these names, as a wording check, not a count).
- [ ] The cases Scope deletes are absent from `aoe4-split-layout.spec.ts` and `aoe4-split-scroll.spec.ts`. Their removal is shown by the typecheck and the spec run (the listed files run green with the cases gone), not by a search over code.
- [ ] No case in the three files sets a viewport under 1200 px wide: each viewport is `MIN_SUPPORTED_VIEWPORT`, `SPLIT_VIEWPORT`, `WIDE_VIEWPORT`, the 1280x720 short viewport, or the Playwright default. The focus-ring case that ran at 768x1024 now runs at `MIN_SUPPORTED_VIEWPORT`.
- [ ] The kept "split at 1280" case still fails if the Build panel is not left of the Results panel, if the editor top or the `results-last-good` top is outside the viewport, or if the document scrolls sideways at `SPLIT_VIEWPORT`; and the headings case still fails if the Build or Results heading is not the first element of its panel or the heading and chart font sizes differ (the implementer states in the report which assertions carry these checks).
- [ ] The kept `aoe4-results-split.spec.ts` "charts fill the Results width" case runs at both `WIDE_VIEWPORT` and `SPLIT_VIEWPORT` and still fails if the units chart is narrower than 95% of the Results container or, at `WIDE_VIEWPORT`, the page scrolls sideways.
- [ ] A case that relied on `showTab` to wait for panel content does not read that content before it renders: each such read is behind a `toBeVisible`, `toHaveCount`, `expect.poll` or `toPass` on that content.
- [ ] `npm run acceptance` passes for the three listed files (run per file, not the whole suite) on the unchanged page code, `npm run lint:dup` reports no clone involving the changed cases, and `npm test` is unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none
