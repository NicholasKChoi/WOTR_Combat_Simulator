# SGS-179: Add the minimum supported viewport; delete the narrow and small-screen specs

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 business logic (test-only: about 215 lines of spec deleted, about 80 changed, 1 helper constant added)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M10.md (Acceptance spec inventory rows for `aoe4-narrow-layout`, `aoe4-small-screen`, `aoe4-build-order-inline-issues`, `aoe4-build-order-pin-compare`; contract C5; delivery step 1); M10.3 in MILESTONES.md

## Context

M10 makes the AoE4 build-order page desktop-only (supported from 1200 px). Delivery step 1 moves specs to desktop viewports while today's code still passes them, so each PR stays green. This ticket is the root of that step: it adds the shared `MIN_SUPPORTED_VIEWPORT` constant (C5, the spec-side form of C3) that sibling step-1 tickets import, deletes the two specs that exist only for narrow and phone widths, and relocates the two cases from them that still hold at desktop widths. The page code does not change; everything here passes on `origin/main`.

## Scope

- `acceptance/helpers.ts`: add `export const MIN_SUPPORTED_VIEWPORT = { width: 1200, height: 800 }` next to the other viewport constants (C5). Add only this. `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab` stay (other specs still use them; a later ticket removes them).
- Delete `acceptance/aoe4-narrow-layout.spec.ts` (390x844 cases plus the 1800 compare-table case) and `acceptance/aoe4-small-screen.spec.ts` (320/360 step-table cards, run bar static at 360, run bar sticky at 768 and 1280, tabs keyboard model at 1024). Both files' coverage that survives is named below; the rest is intentionally gone with the narrow layout. Sticky at 1280 stays held by the existing "fills the viewport below the stuck run bar" case in `acceptance/aoe4-split-scroll.spec.ts`. A search found no other file that references either spec by name.
- `acceptance/aoe4-build-order-inline-issues.spec.ts`: add the "3000-character unknown unit id in an issue" case from the narrow spec at the default viewport (no `test.use`). It asserts the one `unknown-id` issue with the truncated message, that the document does not scroll sideways, and that `panel-build` does not scroll sideways. Drop every `showTab` call and its import (examples: the "a live issue never clears the shown result" case and the gold run-out info-list case).
- `acceptance/aoe4-build-order-pin-compare.spec.ts`:
  - Add the "compare table fits its box" case (WIDE_VIEWPORT, 1800) from the narrow spec with its assertion unchanged (`compare-scroll` `scrollWidth <= clientWidth`). The narrow spec's local `pinnedResults` and `box` helpers have counterparts or near-counterparts in this file (its own pin setup and the "compare table sits in a scroll wrapper" case); reuse them rather than copying.
  - Drop every `showTab` call and its import.
  - The "a reload keeps the pin in the tabs layout" describe (`TABS_VIEWPORT`) becomes a describe or plain case at the default viewport with a name that no longer says "tabs". Drop its `tab-results` enabled assert and its `tab-build` `aria-selected` assert (nothing is selected after a load once tabs go); keep the pin, label, text, auto-run status, two-POST and hydration-warning assertions. Remove the `TABS_VIEWPORT` import if nothing else here uses it.
- The moved cases must not be flagged as clones of kept cases by `npm run lint:dup` (the test config `.jscpd.tests.json` applies).

**Out of scope:** removing `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` or `showTab` from `acceptance/helpers.ts`; every other spec (split-layout, split-scroll, results-split, editor-width, step-annotations, chart-views, save-*, my-builds, auto-run, step-table and the rest); any page, component or CSS change; docs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `acceptance/helpers.ts` exports `MIN_SUPPORTED_VIEWPORT` equal to `{ width: 1200, height: 800 }`, and `SPLIT_VIEWPORT`, `WIDE_VIEWPORT`, `TABS_VIEWPORT`, `SPLIT_MIN_WIDTH` and `showTab` still exist with unchanged values and behavior.
- [ ] `acceptance/aoe4-narrow-layout.spec.ts` and `acceptance/aoe4-small-screen.spec.ts` do not exist, and `npx tsc --noEmit` passes (no importer of either, no import of a helper that no longer exists).
- [ ] A test in `acceptance/aoe4-build-order-inline-issues.spec.ts`, run at the default viewport, enters a build with a 3000-character unknown unit id and asserts exactly one `unknown-id` issue, that the document does not scroll sideways, and that `panel-build` does not scroll sideways; it fails if the long id makes either scroll sideways.
- [ ] A test in `acceptance/aoe4-build-order-pin-compare.spec.ts` at `WIDE_VIEWPORT` asserts the compare table fits its `compare-scroll` box (scroll width at most client width) with a pin present and a result that differs from it.
- [ ] The "reload keeps the pin" test in `acceptance/aoe4-build-order-pin-compare.spec.ts` runs at the default viewport, with no viewport override, and still asserts the pin survives the reload, re-runs on load (both POSTs, duration, no hydration warning) and shows the pinned label; it references no `tab-build` or `tab-results` test id.
- [ ] No `showTab` call or import remains in `acceptance/aoe4-build-order-inline-issues.spec.ts` or `acceptance/aoe4-build-order-pin-compare.spec.ts` (a search scoped to these two files finds none).
- [ ] `npm run lint:dup` reports no clone involving the moved or rewritten cases.
- [ ] `npm test` passes, and the two edited specs pass under `npm run acceptance` (run per file, not the whole suite) on the unchanged page code. Every other spec's assertions are unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none
