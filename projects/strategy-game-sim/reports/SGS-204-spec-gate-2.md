# SGS-204 spec gate 2

Verdict: NEEDS_SPEC

Read at origin/main (fetched). Files named in Scope exist: `components/apps/aoe4-build-order/result-series.ts` (`unitUpgradeDots`, `visibleUpgradeDots`), `line-chart.tsx` (`ReferenceDot` blocks for `pinnedDots` and `currentDots`, `LABEL_FONT_SIZE`), `docs/aoe4-build-order-ui.md` line 129 "Upgrade dots", `page-help.tsx` Units paragraph, the upgrade-dots acceptance spec, and the `upgradeTargets` map in `data/aoe4-build-order/rules/english.json`.

## Gaps

1. **Scope / criterion 3 - "recognisable leading tier word" is undefined, and the data has ids that test it - an implementer would guess.**
   `upgradeTargets` holds `early-men-at-arms`, `men-at-arms`, `elite-men-at-arms` beside `veteran-*` and `elite-*`. These ids get dots (`researchMarker` labels with the baseId, `unitUpgradeDots` keeps any marker with a `unit`).
   The rule is "derive from the id, no hard-coded list". Is `early` a tier word? Is `men` the leading word of `men-at-arms`?
   A rule with no list cannot tell `early-men-at-arms` (tier "Early") from `men-at-arms` (no tier word). `men-at-arms` would fall back to "Men at arms", which repeats the unit name the ticket says to avoid.
   Fix: state the rule in the ticket. For example, the tier is the id's leading segment when the rest of the id is the unit's own name. Take the unit name from the dot's `key`/target, and extend `unitUpgradeDots`/`UpgradeDot` or the function signature if needed. An id equal to the unit name has no tier word, and the dot shows the defined fallback. State the fallback text (for example "Upgrade", or a readable label that does not repeat the unit). Then criterion 3 loops over every `upgradeTargets` key and asserts the rule, not just `veteran-*` and `elite-*`.

2. **Criterion 3 - "does not contain the unit's name word" has no source - an implementer would guess.**
   Ids say `spearmen` or `longbowmen`, targets say `spearman` or `longbowman`, and `elite-knights-or-lancers` has several unit words. "The unit's name word" is not defined.
   Fix: replace it with a property the test can compute. The tier name is a single word with no hyphen, capitalised, equal to the id's first segment, and shorter than the whole id.

3. **Invariants field - `none` while the ticket edits `components/apps/aoe4-build-order/**`.**
   The `Paths:` of A1-A3 cover those paths, and a ticket whose scope touches those paths names them. The ticket may be adjacent to A1 (the tier text comes from the data id, not a hard-coded number).
   Fix: list A1, or A1-A3 as adjacent, with a one-line reason. Criterion "No INVARIANTS.md regressions" then has something to check.

## Notes (non-blocking)

- Unverified assumption: in recharts 3.10.1 a plain `<text>` child of `ReferenceDot` is not placed at the dot. Children render in the parent layer's SVG coordinates, as the existing `<title>` does. Placement at the point needs the `label` prop (or `<Label>`), as `ReferenceLine` markers use, or computed pixel coordinates. Reword the assumption to name the mechanism: "ReferenceDot `label` renders a `<text>` near the dot's point and respects the ticket's offset". The criteria stay checkable in real Chromium either way.
- Existing tests that count or read SVG `<text>`: `aoe4-chart-readability.spec.ts` (`svg text.recharts-label`, compared with the age-up labels, and `parentElement.querySelectorAll('text')` for markers) and `aoe4-marker-labels.spec.ts`, `aoe4-chart-zoom.spec.ts` (`svg text.recharts-label`). A `label` prop on `ReferenceDot` produces `recharts-label` text on the Units chart, so these specs may break. Scope's edit-and-list rule covers this; add that the new text gets a distinguishing `data-testid`, so no marker-label lookup picks it up.
- Criterion 4 leaves the pinned-versus-current distinguishing property to the implementer ("the criterion names the property"). Better to fix it in the ticket: for example the pinned text uses the ring's pinned-line colour and lower opacity, and a test reads the computed fill or opacity of both.
- Criterion 5 (two upgrades at one instant): confirm the Knight/Longbow data can produce two upgrades on one line at one time. If not, the test is a unit-level placement function test, and Scope should require that placement logic be a pure function.
- CONTEXT.md "Key surfaces" lists the Units chart upgrade-dot functions. The new tier-name function is a surface in the same place; add it under `On merge` or in Scope.
- Risk `standard` and LOC 50 are consistent with the template. No critical path or strong-model trigger applies. Diagram and `On merge: none` are fine. No Depends-on. No open questions. No overlapping open ticket was checked beyond the ticket's own scope.
