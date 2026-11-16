# SGS-167: Move lineEndYs into acceptance/helpers.ts as a general one-evaluate layout reader

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 60 (test code only: one helper moved and generalized in `acceptance/helpers.ts`, about five call sites rewritten; no business logic)
- **Depends on**: none
- **On merge**: REPO.md exemplars: the `acceptance/aoe4-chart-views.spec.ts` entry's `shows` text cites `lineEndYs` as defined in that spec; point it at the reader now in `acceptance/helpers.ts`
- **Source**: retro 2026-11-15 (SGS-157 Rework 3: three copies of the end-y parse, separate reads); pairs with the LESSONS.md Playwright layout-values entry

## Context

The LESSONS.md rule says layout values that are compared are read in one `evaluate`, never in separate calls, because smooth scrolling and chart redraws move elements between reads. `lineEndYs` in `acceptance/aoe4-chart-views.spec.ts` already does this for path end-y values but lives in one spec, so other specs (and SGS-157's reworks) re-wrote the parse or read values one call at a time.

## Scope

Chore: no behavior the owner sees changes, and no assertion changes meaning.

- Move `lineEndYs` from `acceptance/aoe4-chart-views.spec.ts` into `acceptance/helpers.ts` and export it. The spec imports it and drops its local definition. It keeps taking a chart id and a list of series keys and returning the end y of each path, in order, from one `evaluate`.
- Add one general reader to `acceptance/helpers.ts` that reads several layout values (rects, a path's `d`, widths) of several targets inside one chart or root in a single `evaluate`, so a comparison never spans calls. `lineEndYs` may be built on it. Its shape (arguments, return type) is the implementer's choice, following the style of the nearest helpers (`plotPoint`, `settledScrollY`).
- Use the helpers where a spec reads layout values that are then compared, one call at a time. Examples the search found (not a closed list; apply the rule to any other match): `acceptance/aoe4-build-order-pin-compare.spec.ts` (the pinned versus current `food` path widths read through two `boundingBox` calls, both in the 1200 s versus 300 s test and inside the `expect.poll` after it); `acceptance/aoe4-chart-views.spec.ts` (`drawn` called separately for the current and pinned `food` paths, and for the rate paths before and after the view switch); `acceptance/aoe4-gathered-resources.spec.ts` (`getAttribute('d')` of the pinned and current `food` paths compared across two calls); `acceptance/aoe4-compact-view.spec.ts` (legend bottom versus textarea top in two evaluates). A comparison that stays a comparison between a value read before an action and one read after it (the view switch case) keeps two reads, each of them one evaluate; do not merge reads across an action.
- Single-value reads that are not compared with another read (for example `boundingBox` of one drag handle in `acceptance/aoe4-chart-layout.spec.ts`) stay as they are.
- A local `path`/`line` locator helper in a spec stays where it is unless the new reader makes it unused.

**Out of scope:** any change to `lib/`, `components/`, or `pages/`; changing what any test asserts or its tolerances; LESSONS.md (already reworded); other flaky-test fixes; spec files with no multi-read layout comparison.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The end-y reader is exported from `acceptance/helpers.ts` and `acceptance/aoe4-chart-views.spec.ts` imports it; the spec defines no copy of it (`npx tsc --noEmit` and `npm run lint:dup` pass).
- [ ] Every comparison of layout values that the Scope examples name, and any other the implementer finds by the same rule, reads all compared values in one `evaluate` (or the one reader), with no value from a separate call. The implementer lists each site changed.
- [ ] Pre-existing tests keep their assertions: each converted site asserts the same relation (greater, not equal, same height, at or above) on the same quantities as before, and the tests that were under `expect.poll` or `toPass` still are.
- [ ] The chart-views, pin-compare, gathered-resources, and compact-view specs, plus any other spec edited, pass under `npm run acceptance`; the implementer records the result in the report.
- [ ] The helper that moved reads the same value as before: the existing Buildings tests in the chart-views spec (separate lines for equal counts, hiding a legend line widens the gap, pinned line at the current line's height) still pass unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none
