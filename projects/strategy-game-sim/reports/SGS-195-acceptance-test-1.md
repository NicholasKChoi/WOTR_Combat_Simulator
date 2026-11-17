# SGS-195 acceptance-test 1

Verdict: FAIL (2 pre-existing specs fail on branch tip d570df7; the new marker-control spec passes).

Branch sgs-195-marker-control, tip d570df7. Harness ran: Playwright, Chromium, `acceptanceSetup` run, task checkout. I wrote no new tests and made no commit (the implementer's rewritten `acceptance/aoe4-marker-labels.spec.ts` already covers the criteria; I ran it and mutation-checked it). Tree clean after all mutations; no process left running.

## Tests run

- `aoe4-marker-labels.spec.ts` (9 tests): all pass. Each pins:
  1. one control between order status and chart table, kinds in order, no chart holds one (B-M1)
  2. hover labels the kind on every chart without overlap; leaving restores age-up labels (B-M4)
  3. every marker keeps one line while a kind is labelled; unlabelled markers keep their hover title
  4. Tab from info toggle reaches first item; focus labels; hover wins over focus (B-M4, B-M10)
  5. click/Enter/Space toggle on every chart, focus kept, aria-pressed and computed opacity (B-M2, B-M3)
  6. hiding labelled kind removes its labels; hovering hidden kind falls back to age-up; age-up hidden leaves none (B-M5, B-M6)
  7. pinned age-ups follow the age-up toggle; other kinds do not touch them (B-M7)
  8. hidden kinds survive collapse, pin and a real new run (duration 1500, rework fix confirmed), series lines unchanged (B-M8, B-M9)
  9. active and keyboard-focused item look different from the rest
- Also run and passing: `aoe4-chart-readability`, `aoe4-build-order-step-band`, `aoe4-build-order-pin-compare`, `aoe4-chart-views`, and `aoe4-chart-layout` except the failure below (109 of 110 in that batch); `aoe4-auto-run`, `min-width`, `m3-flow`, `m4-flow`, `compact-view`, `results-split`, `step-table`, `gathered-resources`, `step-annotations`, `key-results-collapse`, `split-tab-order`, `run-errors`, `inline-issues`, `knight-longbow-page`, `split-scroll` except the failure below (139 of 140).

## Failures

1. `acceptance/aoe4-chart-layout.spec.ts:175`, "ArrowDown on the last chart changes nothing, keeps focus and does not scroll the page". Expected `before.top < before.max`; observed 1710 vs 1710 (deterministic, 2 of 2 runs). The same test passes at base 3bc29b2 (verified in a scratch checkout, since removed). The spec's only diff is the import line. Likely cause (not separately verified): the per-chart marker legends are gone, so less content sits below the last chart's handle and the page cannot scroll past it, which breaks the test's precondition. Classification: **spec-gap**. The ticket requires `aoe4-chart-layout` to pass with no changed assertion, yet the precondition depends on page height, which the ticket changes by design. The manager or owner needs to decide whether the precondition may be changed (for example, scrolling to put the handle mid-viewport, or asserting only when scrollable room exists).
2. `acceptance/aoe4-split-scroll.spec.ts:176`, "the headings share a size and lead their panels". `sizes.charts` expected length 1, received `["22.5px","18px"]`. The test collects every `h3` on the page as a chart heading. The new `Markers` heading (`h3` styled `h6`, 18px, mandated by the ticket) is a second size. Classification: **impl-defect**: a pre-existing test the change breaks, and the ticket's rule on updating tests it breaks (search for others) covers it. The implementer should scope the query to chart headings (inside the chart table) or exclude the control.

## Mutation checks (all on marker-labels spec; each undone with `git checkout -- components`, `git diff --exit-code` clean)

- `line-chart.tsx` `visible.map` to `markers.map`: tests 5, 6, 8 fail on `chart-marker` toHaveCount (expected 4, got 12).
- `line-chart.tsx` `pinnedAgeUps` ignores `ageUpHidden`: test 7 fails on `chart-pinned-marker` count (expected 0, got 2).
- `results.tsx` added `useEffect(() => setHiddenKinds(new Set()), [result])`: test 8 fails at spec line 238, `aria-pressed` expected "false", got "true" (the new-run step).
- `chart-markers.ts` `labelKindOf` uses `markers` not `visibleMarkers`: test 6 fails at line 175 (`data-active` still "true" on hidden kind).
- `chart-markers.ts` swap to `[focusKind, hoverKind]`: test 4 fails at line 135 (`data-active` empty).
- `chart-markers.ts` `placeMarkers` forces row 0: test 2 fails at line 96 (overlap, expected false, got true).
- `chart-legend.tsx` `aria-pressed` inverted: tests 5 and 8 fail on `aria-pressed`.
- `chart-legend.tsx` kinds order reversed: tests 1, 4, 9 fail (order toEqual, first-item focus).
- `line-chart.tsx:187` unlabelled marker `<title>` removed: test 3 fails at line 115 (titles toEqual).

## Not expressed

- B-M5 hovering a hidden kind: test 6 covers it via keyboard/hover on a hidden item; no separate gap found.
- Unit-level criteria (`MarkerControl` markup, `labelKindOf`, `liveMarkerKind`, `toggleHidden`, `chart-markers.test.ts`) are vitest, not run here (out of scope for this gate).
- `commands.lint` not run: I changed no files.
