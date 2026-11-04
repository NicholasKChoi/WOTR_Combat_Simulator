# SGS-087 spec gate 1

Verdict: NEEDS_SPEC. Risk tier low: confirmed (one component, no public surface, no adjacent invariant, no criticalPaths symbol, ~30 LOC).

Gaps
1. Open questions (owner): the marker-label fix (age-up only labelled vs collapse vs hover-only) decides main-path behavior and is unanswered in the ticket and in CONTEXT.md Decisions. A default exists, but the ticket calls it "pending the owner question", so the gate cannot pass. Fix: owner picks; record in CONTEXT.md Decisions and delete the question. The tooltip-precision question is also owner-only but the default is cheap to change; still resolve it with the first.
2. Scope 4 - style reference `acceptance/aoe4-gathered-resources.spec.ts` does not exist on main (ee7ecb9). Implementer would guess the style. Fix: name an existing spec (e.g. acceptance/aoe4-build-order-knight-longbow-page.spec.ts or aoe4-build-order-pin-compare.spec.ts) and the helpers to use (openPage, showTab, runSimulation).
3. Criteria 1 and 5 - "data-label-rows equals the number of rows placeMarkers assigns to those labels alone" cannot be computed from Playwright without re-implementing placeMarkers with measured widths, so it either duplicates production code or is vacuous. Fix: acceptance asserts rows <= age-up count and the text-label set equals the age-up label texts; put the "placeMarkers receives only age-up markers" check in a unit test (extract the labelled-marker filter, e.g. ageUpMarkers, already tested) rather than a separate criterion that restates criterion 1.
4. Criterion 3 - no named build/run guaranteeing fractional tooltip values, and no stated hover position. Fix: say the Knight/Longbow prebuilt, hover at the plot centre, and assert the tooltip text matches no `\d+\.\d{2,}`; also state the non-number pass-through rule for the formatter (undefined/null returned unchanged) as a unit row.
5. Depends-on - SGS-082 is not yet merged; ticket correctly says start after it. Not a gap, just ordering.

Notes
- BACKLOG line numbers (63, 73) in On merge/Source go stale; the bullet-prefix text is the real key.
- Hover `<title>` on a 1px line is a tiny hover target; the pinned lines already accept this. Consider noting it as known.
- Docs scope (docs/aoe4-build-order.md ~line 875) is correct and grounded; README has no marker-label statement.
- Grounded: line-chart.tsx, placeMarkers, pinnedAgeUpMarkers, chart-rows.ts markerLabel/MARKER_COLORS, line-chart.test.ts all exist; Tooltip has no formatter today.
