# SGS-139 acceptance-test report 1

Verdict: PASS. Branch `sgs-139-marker-legend-hover-focus-labels`, new tip 68910f5 (was 5c9f115). Harness ran: Playwright/Chromium, `acceptance:setup` done, 9 tests in `acceptance/aoe4-marker-labels.spec.ts` pass, plus `aoe4-chart-readability.spec.ts` and `aoe4-narrow-layout.spec.ts` (16/16 together, before my edit).

## Tests (all in acceptance/aoe4-marker-labels.spec.ts)
Existing from the branch (reviewed, kept, one assertion added):
1. hover labels that kind, no age-up label, no label overlap, leave restores age-up labels (criteria: hover/labels/no-overlap, restore)
2. every marker keeps exactly one `chart-marker` line while another kind is active; unlabelled age-ups have a title (drawing rule)
3. keyboard focus labels like hover, Escape/Enter change nothing, blur restores, hover wins over focus, focus returns after hover ends (I added a label assertion after hover ends)
4. collapse via dispatchEvent while hovered, then expand: age-up labels, no `data-active` (collapse reset)
5. active item and keyboard-focused item differ in computed style (background/border, outline)
6. pinned age-ups dashed and unlabelled, count equals age-up count, whatever kind is active
7. 390px: page and marker legend do not scroll sideways
8. aria-label names each kind
Added by me:
9. clicking an item only focuses it: labels stay with the focus after the pointer leaves, a second click changes nothing, blur restores age-up labels (no sticky selection)

Last run: 9 passed. Lint (`npx tsc --noEmit && npm run lint:dup`): clean, 0 clones.

## Mutation checks (each undone with `git checkout -- <file>`; `git diff --exit-code` on components/docs clean)
- line-chart.tsx liveMarkerKind drops `!collapsed`: test 4 fails at expectLabels (spec :148), hovered kind's labels return on expand.
- line-chart.tsx drawing re-adds age-up filter: test 2 `toHaveCount` expected 12, received 10 (:90).
- line-chart.tsx activeMarkerKind order swapped (focus before hover): test 3 fails at :115 (hovered kind not active).
- line-chart.tsx labelledMarkers(null) returns all markers: test 1 fails at expectLabels (:62).
- line-chart.tsx placeMarkers always row 0: test 1 overlap check fails (:77, expected false, got true).
- line-chart.tsx pinned drawing uses all pinned markers: test 6 count expected 2, received 12 (:175).
- chart-legend.tsx onBlur no-op: test 3 fails at :110 (still active after blur).
- chart-legend.tsx onFocus no-op: test 9 fails at :129 (not active after click, pointer away).
- chart-legend.tsx data-active never set: test 1 fails at :65.
- chart-legend.tsx aria-label without kind: test 8 fails (expected /Age-up/).
- results.module.css hover/active rule removed: test 5 fails at :163 (style equals inactive).
- results.module.css focus outline disabled: test 5 fails at :166/:167 (outline "none 3px").
- results.module.css min-width 700px on button: test 7 fails at :199 (page width 736 > 390).

## Failures
None.

## Not expressed in this harness
- Vitest table criteria (`labelledMarkers`, `activeMarkerKind`, `liveMarkerKind`, static `MarkerLegend` markup, `data-active` markup): owned by `line-chart.test.ts`, not run by me (not acceptance harness).
- Docs, `next build`, `npm test` criteria: not in scope of this gate.
- "No other pinned kind is drawn" is asserted only through the pinned-marker count equalling the age-up count (non-age-up pinned markers use no distinct testid).

Nothing started by me still runs.
