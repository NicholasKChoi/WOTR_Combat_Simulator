# SGS-204 spec gate 4

Verdict: READY

Read at origin/main (fetched). No Depends-on. recharts 3.10.1 source read from an existing task checkout's node_modules. No scratch checkout made.

## Checks

- Grounded scope: `unitUpgradeDots`, `visibleUpgradeDots`, `UpgradeDot` in `result-series.ts`; both `ReferenceDot` blocks, `LABEL_FONT_SIZE`, `placeMarkers` and `chart-markers.ts` exist; `docs/aoe4-build-order-ui.md` line 129 and the `page-help.tsx` Units paragraph exist; CONTEXT.md line 28 holds the upgrade-dot Key surfaces line the On merge item extends.
- Gate 2 gaps are closed: the tier rule is exact (segment count against the dot's key, fallback `Upgrade`). I checked it against all 11 `upgradeTargets` entries: `veteran-*` and `elite-*` give `Veteran`/`Elite`, `early-men-at-arms` gives `Early`, `men-at-arms` (3 vs 3 segments) gives `Upgrade`, `elite-knights-or-lancers` gives `Elite`. Invariants names A1.
- Unverified assumption holds in the source. `ReferenceDotImpl` renders `CartesianLabelFromLabelProp` inside the `recharts-reference-dot` Layer, with a viewBox of `x = cx - r`, `y = cy - r`, `2r` by `2r`. A function or element `label` goes through `parseLabel` to `Label` with `content`; `Label` returns the content element as is, so no `recharts-label` class and no portal is added.
- Existing tests: every `text.recharts-label` selector (readability, marker-labels, zoom, layout, chart-views, gathered-resources) will not see the new text. The `parentElement.querySelectorAll('text')` reads are on marker-line layers, not dot layers. The upgrade-dots spec reads the dot's parent only for `:scope > title`, which an added `<text>` sibling does not change. `line-chart.test.ts` only checks server-render wrapper and title. The help modal spec checks the phrases `upgrade dot` and `unit line`, which the ticket keeps. No other open ticket (203, 205, 206) touches the dots.
- Risk `standard`, about 70 LOC, no critical path or strong-model trigger, so the hotspot check does not apply. On merge is a single item. Docs: both made-untrue docs are in Scope with matching criteria.

## Notes (non-blocking)

- Placement inputs: SeriesChart does not know dot pixel positions (recharts computes them), and the y domain is set elsewhere (`yAxis?.domain`). The ticket leaves the placement function's input shape to the implementer. A workable shape is to group shared points in data space (same `at` and `value`, current and pinned together) and get pixel edges from the `viewBox` the `label` content receives plus the plot bounds. The acceptance criterion on the dot's own bounding box inside the plot is what holds the result in place.
- Right-edge flip by estimated text width (as `placeMarkers` does with `estimateLabelWidth`) may disagree with the real Chromium width; the acceptance criterion catches that, and the implementer can measure the text instead.
- The last criterion (no tier word or unit name hard-coded) is met by reading only; the data loop would pass a hard-coded list of the 11 current ids. Cheap strengthening: one unit case with an invented id and key (for example `mighty-widgets` with `widget` gives `Mighty`).
- Criterion 4 needs a build that researches a second tier on a line. The Knight/Longbow template researches only one longbowman upgrade, so the spec edits the build text; the ticket notes how two tiers can land together at age 4.
