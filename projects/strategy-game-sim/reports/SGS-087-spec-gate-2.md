# SGS-087 spec gate 2

Verdict: READY. Risk tier low: confirmed (one component, no public surface, no adjacent invariant, no criticalPaths symbol, ~30 LOC). Checked against origin/main b9481e3.

## Gate-1 gaps, all closed
1. Owner questions: answered and folded into Scope 1 and 2; Open questions says None. (CONTEXT.md Decisions still says "None"; the answers live only in the ticket. Not blocking since the ticket is the sole consumer and nothing is written to a repo doc as a rule beyond Scope 3.)
2. Style reference: `acceptance/aoe4-build-order-knight-longbow-page.spec.ts` and `aoe4-build-order-pin-compare.spec.ts` exist; helpers `openPage`, `showTab`, `runSimulation` exist in `acceptance/helpers.ts`; `runSimulation` returns the response, so `markers` are readable. `BUILD_LABEL` for the Knight/Longbow prebuilt is in the page spec.
3. Rows criterion: now asserts label set equals the age-up texts and 1 <= data-label-rows <= age-up count; the filter is pinned by the `ageUpMarkers` unit test. No Playwright re-implementation of `placeMarkers`.
4. Tooltip criterion: named build, hover point, regex, mutation run, and fallback fraction. `formatChartValue` table has `null`/`undefined` rows.

## Checks
- Grounded scope: `line-chart.tsx` (`pinnedAgeUpMarkers` L59, used L79, `labelKey` L80, `placeMarkers` call L93, `<Tooltip labelFormatter>` L107 with no formatter), `chart-rows.ts` (`MARKER_COLORS` L89, `markerLabel` L105), `line-chart.test.ts` (imports and uses `pinnedAgeUpMarkers` L5, L51) all exist. `pinnedAgeUpMarkers` has no other caller. `formatChartValue` is new and the ticket says so.
- Testable criteria: observable outcomes; no stale-prone pins (the `formatChartValue` rows are inputs). No default-flip on existing tests: other specs that touch charts (`aoe4-build-order-pin-compare.spec.ts` L277 reads the single Y-axis `.recharts-label`, `aoe4-narrow-layout.spec.ts` L51 reads only the legend) only lose labels, so they keep passing; the ticket's "implementer lists every test it edits" plus the "no other acceptance file edited" criterion is consistent because only the deleted spec asserted text labels on research markers.
- Docs: `docs/aoe4-build-order.md` L875-876 is the one stale statement; it is in Scope 3. No tooltip or label statement in `data/aoe4-build-order/README.md`.
- Contracts, invariants, lessons (one-evaluate rule is cited), size, diagrams, On merge (none needed), input validation (none): no issues.

## Judgment: re-add pinned-line hover-title coverage? No.
The deleted spec's only title check is at `acceptance/aoe4-build-order.spec.ts` L519-529 (pinned `<title>` = `<label> (pinned) <m:ss>`). Reasons not to add it back:
- The owner explicitly accepted the coverage loss for SGS-082 ("let humans judge them"), and SGS-082 Scope 1 says not to recreate any of its tests in another file. Re-adding it here would reverse a stated owner decision from a different ticket.
- SGS-087 does not change the pinned lines' behavior, only renames the filter feeding them (`pinnedAgeUpMarkers` -> `ageUpMarkers`, same body). Risk of regressing the title through this ticket is nil to very low.
- The new spec already exercises the same `<title>`-child-on-ReferenceLine mechanism for non-age-up markers, so a break in titles on ReferenceLine would be caught there anyway.
If the owner later wants pinned titles guarded, the cheap route is a unit render assertion in `line-chart.test.ts` (SeriesChart with `pinnedMarkers`, check the `<title>` text), not a restored acceptance test; that is a separate ticket.

## Notes (non-blocking)
- Criterion 6 says pinned lines "and their hover titles" are unchanged but no remaining test pins the title text. Consider rewording to "the pinned-line code is unchanged apart from the rename", or leave it as a reviewer check.
- Criterion 1 needs the Y-axis label text per chart to exclude it; the implementer can take the four strings from the deleted spec's `yLabels` (still in git history) or from the component props. Optional to state.
- CONTEXT.md Decisions could record the two owner answers (age-up only labelled; 1-decimal tooltips on all charts); the manager may add them.
- Pre-existing: a 1 px marker line is a tiny hover target; already accepted for pinned lines and listed out of scope.
