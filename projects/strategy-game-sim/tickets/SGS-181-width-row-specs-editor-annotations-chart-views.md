# SGS-181: Move the editor-width, step-annotation and chart-view specs to supported viewports

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (acceptance specs only; the AoE4 invariants match by path and no `lib/aoe4-build-order/**` or `components/apps/aoe4-build-order/**` file changes)
- **Unverified assumptions**: none (the specs run against the real page in Chromium; nothing is faked)
- **LOC estimate**: 0 (test-only: about 250 spec lines changed in three `acceptance/` files; no business logic)
- **Depends on**: SGS-179
- **On merge**: none
- **Source**: design/M10.md "Acceptance spec inventory (M10.3)" rows for `aoe4-editor-width`, `aoe4-step-annotations`, `aoe4-chart-views`, contract C5; plans/M10-20261116.md outline C; criterion M10.3

## Context

Step 1 of M10 moves every acceptance case off narrow widths and the tabs layout while today's code still passes them, so the later code ticket can delete the breakpoints without breaking specs. This ticket owns three spec files whose width cases sample phone and tablet widths (360, 390, 768, 1024) or exercise the editor's 768 px compact boundary. Their rules still hold at supported widths, so each is rewritten as rows over the first and last supported sample, `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, or moved to the default viewport; the cases that exist only for the removed boundary are deleted. `MIN_SUPPORTED_VIEWPORT` (1200x800, the spec-side form of the minimum supported width) is added to `acceptance/helpers.ts` by SGS-179. The page code does not change, and everything here passes on `origin/main` once that constant exists.

## Scope

Every change is in `acceptance/`. Names below are pointers to where to look. Unused imports, constants and types left by the deletions are removed.

- `acceptance/aoe4-editor-width.spec.ts`
  - "at 390 px the textarea keeps half of the editor" runs at `MIN_SUPPORTED_VIEWPORT` (the narrowest editor column the page now supports); rename it so it no longer names 390 px. The 50% rule is unchanged.
  - "at 1280x800 the textarea content fits a typical build line" and "at ${width} px the gutter drops the finish time and scales its text" (today's `[PHONE, SPLIT_VIEWPORT]` loop) become rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, with the gutter case's expectations unchanged. The `editorWidth < COMPACT_BELOW_PX` precondition asserts a compact boundary that goes away, so it is dropped from these cases (the font and finish-time assertions are what prove the compact editor).
  - "the step table and the table view keep the finish time in compact mode" and "hovering an annotation still marks the active step in compact mode" run at the default viewport (no `setViewportSize`, no viewport `test.use`); rename them so "compact mode" does not imply a narrow viewport.
  - Delete the describe "AoE4 text editor at 768 px and wider" (the M8 layout case) and the describe "AoE4 text editor compact boundary" (767, 768, 850 rows): the editor has one style and no boundary after M10.
  - "AoE4 Build panel has no horizontal overflow" becomes rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, replacing the 360, 768 and 1280 rows; the text and table view loop and its one-`evaluate` poll are unchanged.
  - Delete the local `PHONE` and `COMPACT_BELOW_PX` constants and the `TABS_VIEWPORT` and `SPLIT_VIEWPORT` imports where nothing is left using them; `readEditor` and `expectFonts` stay as far as a kept case uses them (the non-compact `expectFonts(m, 1)` call goes with the deleted describes; `expectFonts` keeps its parameter only if a kept call still needs it).
- `acceptance/aoe4-step-annotations.spec.ts`
  - The loop "the popover lies inside the ${width}px viewport and is not clipped, for the first and the last line" (`[360, 768, 1280]`, height 760) becomes rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, with the viewport set from the row and the in-viewport and not-clipped assertions unchanged.
  - The describe "AoE4 step run cells in the narrow card layout" (viewport 390x760) runs at the default viewport and is renamed so it no longer says "narrow" or "card layout". The 4px kind border in the legend colour is a base rule in `components/apps/aoe4-build-order/step-annotation.module.css`, so the assertion holds at the default viewport unchanged. Drop its `test.use` viewport.
  - Drop every `showTab` call and the `showTab` import (examples: `openText`, the gutter and aria-hidden cases, the popover describe's open helper, the "an invalid edit dims the cells" case). Where a `showTab` call was the only wait before reading Build content, the next read of that content waits for it itself.
- `acceptance/aoe4-chart-views.spec.ts`
  - The tick-overlap loop (`[360, 768, 1280]`, height 900) becomes rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, with the no-overlap, not-clipped and no-sideways-scroll assertions unchanged. Rename the case so the row's viewport width still appears in its title and no title names a width that is no longer sampled.
  - Drop every `showTab` call (there are about 17, in every chart-view case) and the `showTab` import. A case that read Results content right after `showTab('results')` keeps a wait on that content (the next assertion's own `toBeVisible`, `toHaveCount`, `expect.poll` or `toPass`).
- Follow the exemplar `acceptance/aoe4-chart-views.spec.ts` and the repo lesson: any new or changed check that compares layout values reads them in one `evaluate` under `expect.poll` or `toPass`; the existing ones keep that shape.
- Check before editing: re-grep these three files at the base for `showTab`, `TABS_VIEWPORT`, `PHONE`, `setViewportSize`, `viewport:` and any width under 1200 (the three files hold the only narrow-width cases the design inventory assigns here; a hit not listed above is handled the same way and listed in the report).
- Docs: no doc describes these spec cases (searched outside `acceptance/`); no doc changes. Not touching `acceptance/helpers.ts` (`SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab` stay until the code ticket removes them, and other step-1 tickets still import them).
- Existing tests: every case not named above keeps its assertions and expected values. The implementer lists every case edited, renamed, moved or deleted in the report.
- The rewritten rows and moved cases must not leave a block that `npm run lint:dup` flags as a clone (the test config applies); rows in one loop, not copied blocks.

**Out of scope:** `acceptance/helpers.ts`; adding `MIN_SUPPORTED_VIEWPORT` (SGS-179); every other spec file, including the split, save, auto-run, step-table and marker-label specs owned by sibling tickets; any file under `components/`, `pages/`, `lib/`, `docs/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] No case in the three listed files sets a viewport under 1200 px wide: each viewport comes from `MIN_SUPPORTED_VIEWPORT`, `WIDE_VIEWPORT` or the default project viewport (a typecheck passes with the unused imports removed; the implementer also greps these files for `PHONE`, `TABS_VIEWPORT` and `showTab`, as a wording check, not a count).
- [ ] The half-editor case runs at `MIN_SUPPORTED_VIEWPORT` and fails if the textarea's client width falls below half of `build-order-editor`'s width there; the typical-line, gutter-drops-finish-time and Build-panel-no-overflow cases each run for both `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT` and keep their assertions (a test fails if the gutter shows a finish time, the textarea content is narrower than a 48-character line, or the page or `panel-build` scrolls sideways at either viewport).
- [ ] "Table keeps the finish time" and "hover marks the active step" run at the default viewport; the first fails if the table view's finish times differ from the gutter's or are not visible, and the second fails if hovering an annotation row does not set its active mark and a visible box shadow.
- [ ] The cases for the removed boundary (the editor at 768 px and wider keeping the M8 layout, and the 767, 768, 850 compact-boundary rows) no longer exist in `aoe4-editor-width.spec.ts`, proven by the spec's case list and a clean typecheck, not a search.
- [ ] The popover-inside-viewport case runs for both supported viewport rows and fails if the popover for the first or last run line leaves the viewport or sits inside the clipped annotation gutter; the run-cell border case runs at the default viewport and fails if a coloured run cell's left border is not 4px or not its kind's legend colour.
- [ ] The chart tick-overlap case runs for both supported viewport rows and fails if two axis tick labels of any chart in `CHART_IDS` overlap, a tick leaves its chart's SVG bounds, or the document scrolls sideways.
- [ ] No case reads Results or Build content before it is rendered now that the `showTab` waits are gone: each such read is behind a `toBeVisible`, `toHaveCount`, `expect.poll` or `toPass` on that content.
- [ ] `npm run lint:dup` reports no clone involving the rewritten or renamed cases, and `npx tsc --noEmit` passes.
- [ ] `npm test` passes, and the three edited specs pass under `npm run acceptance` (run per file, not the whole suite) on the unchanged page code. Every other spec's assertions are unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none
