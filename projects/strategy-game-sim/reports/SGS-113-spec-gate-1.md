# SGS-113 spec gate 1

**Verdict: READY**

Read at origin/main after `git fetch origin`. Depends-on is none.

## Checks

1. Grounded scope: PASS. `legendItems`, `LegendItem`, `pinnedKey`, `pinnedColor`, `seriesColor` and `toggleHidden` exist in `chart-rows.ts`. `SeriesLegend` and `MarkerLegend` exist in `chart-legend.tsx`. `line-chart.tsx` has the two `hide` props at lines 130 and 144. The `legendItems` describe block in `chart-rows.test.ts` has exactly the three old-shape tests the ticket replaces. The two named legend tests exist in `pin-compare.spec.ts` (lines 96 and 127). The doc sentences at docs lines 940-941 and 971-973 exist. A grep for `legendItems`, `LegendItem` and `SeriesLegend` finds no other consumers of the changed shape.
2. Testable criteria: PASS. The criteria state properties (no `pinned:` key, no `(pinned)` name, order, `lines`, colours, computed CSS), not stale counts. No existing tests assert the absence of the new behaviour. The `line-chart.test.ts` regex at line 73 (`...</button></div></div><div ... chart-marker-legend`) is rendered without a pinned run, so the new key does not break it. This matches criterion 51.
3. Open questions: none.
4. Invariants: `none` is fine. No game number or timing is touched.
5. Contracts: matches design M8.md C10 on `LegendItem`, `PinnedLineKey`, the `chart-pinned-key` test id and the hidden-set rule.
6. Size: about 80 LOC.
7. Diagrams: none needed.
8. Lessons: the project LESSONS.md has no entries.
9. Decisions: no conflict found.
10. On merge: `none` is valid.
11. Risk: `low` is right. No criticalPaths or strongModelTriggers are hit.
12. Docs: in Scope, with the grep instruction for `pinned:` and `(pinned)` and the marker legend item kept.
13. Input validation: not applicable.

## Notes (non-blocking)

- Acceptance coverage for the `chart-pinned-key` criteria (the four charts, gone after unpin) and for the swatch `border-top-style` and colour check (criterion 48) is not named in Scope's Tests list. Only `line-chart.test.ts` SSR is named for the key. The pin-compare spec's replacement tests are the natural home. A line in Scope would stop the implementer guessing where these go.
- Design M8.4 also lists a `line-chart.test.ts` render showing both lines hidden. The ticket covers this with the hidden-line helper unit test instead, which is reasonable because the hidden state is `useState`, so an SSR render cannot show it.
- The hidden-line helper takes "a given line key". Scope does not say whether it receives `pinnedKey(key)` and strips the prefix, or takes the series key and a pinned flag. Criterion 50 works with either, and the name and shape are left to the implementer.
- "After the items" for `PinnedLineKey` does not say whether it sits inside the flex wrapper div or after it. Either satisfies the existing order test, because that test has no pinned run.
