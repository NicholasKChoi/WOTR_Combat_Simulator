# SGS-139 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (SGS-135 and SGS-138 are not integrated; ticket's stated end states taken as given). Spot-checked: `ageUpMarkers`, `placeMarkers`, `labelled`/`labelKey`/`measureRef`, the `kind !== 'age-up'` filter, `MarkerLegend` (`pinnedAgeUps` prop, `li` items), `line-chart.test.ts` legend cases (lines 26-36, 115), `aoe4-chart-readability.spec.ts`, `aoe4-narrow-layout.spec.ts`, docs lines 981-996. All names and quotes match the base. Design C8 and the Marker labels rules agree with the body; no open questions; Risk standard is right (no critical path); Invariants none is right; On merge none is right; docs are in Scope; Depends-on SGS-138 covers SGS-135 transitively.

## Gaps

1. Criteria (collapse reset, "Playwright: collapsing a chart while an item is hovered or focused ...") - the test cannot fail as written. The only way to collapse a chart is the header button (layout.collapsed comes from the persisted layout; the button is the sole control). A real mouse click on it moves the pointer off the legend item (`mouseleave`) and moves focus off it (`blur`), so `hoverKind` and `focusKind` return to null through the normal events. The case then passes even with no reset code. An implementer would write the natural click and get a vacuous test. Fix: require the spec to collapse without ending the hover or focus (for example `dispatchEvent('click')` on the collapse button while the pointer rests on the item, or a keyboard-free programmatic click for the focus case), and to first assert that the item is `data-active="true"` before collapsing and that the legend is gone after. Alternatively extract the reset as a pure function and cover it in Vitest.

2. Criteria (stale-state reset, "Covered by ... Playwright (or an extracted pure reset function under Vitest)") - the either-or leaves the verification path to a guess, and the Playwright route is hard: it needs a run whose markers change while the pointer stays on an item (typing in the editor does not move the pointer, but a focused item blurs). Fix: pick one. Preferred: Scope names an extracted pure function (for example `pruneMarkerKind(markers, kind)` returning `kind` or null; name is the implementer's, behavior is fixed) used by both state slots, with a Vitest table: kind with markers is kept, kind without markers becomes null, null stays null. Keep the render fallback covered by the `activeMarkerKind` rows.

## Notes (non-blocking)

- The collapse reset and the stale reset can share the one pure function from gap 2 (kind with no markers or collapsed gives null).
- Criterion "Every current-run marker is drawn exactly once" is hedged between Vitest and Playwright; the Playwright case does cover it (the readability spec already asserts count and one line per marker), so it is acceptable, but stating "Playwright" as the owner of it would remove the guess.
- The new `<title>` on an unlabelled age-up in `aoe4-chart-readability.spec.ts`: that spec's `texts`/`title` checks currently skip age-ups (`if (m.kind !== 'age-up')`); under the default state age-ups are labelled, so no edit is needed there. The Scope sentence "update only what the new drawing rule changes" is accurate; the implementer may find nothing to change.
- Unverified assumptions field is present and covers the recharts re-render and `getComputedTextLength` points; adequate.
- SGS-137 (M9.6) also edits `line-chart.tsx`; the design's serial note covers M9.4/M9.5/M9.7 only, so check merge order in the graph (no dependency stated, only a likely rebase).
