# SGS-204 ticket report (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-204-upgrade-dot-tier-indicator.md. ticket-lint passes (exit 0).

## Summary

"Show which tier upgrade each Units chart upgrade dot is". Chore, component aoe4-build-order, Milestone none, Risk standard, about 70 business-logic lines, Depends on none. I rewrote it against origin/main to fold in the spec-gate-2 gaps and notes.

- **Scope.** Two pure functions in `result-series.ts`:
  - a tier name taken from the dot's `label` (upgrade id) and `key` (unit id);
  - a text-placement function: beside the dot, separate positions at a shared point, flipped at the right or top edge.
- **Rendering.** The text is drawn through `ReferenceDot`'s `label` prop with a content element or function in `line-chart.tsx`.
- **Docs.** The doc and help text are fixed.

Criteria cover:
- the tier-name loop over all `upgradeTargets`, plus the three men-at-arms cases;
- placement unit tests;
- visible text on each dot that equals the function's output;
- different tiers showing different text;
- pinned text at lower opacity, and a ring and a dot at one point not coinciding;
- the text following hide, zoom and view changes;
- the right edge;
- existing dot assertions unchanged, with no `recharts-label` class on the new text;
- docs;
- A1.

## Gate claims checked, and how each was folded in

1. **Tier rule (gap 1).** Confirmed that `upgradeTargets` holds `early-men-at-arms`, `men-at-arms` and `elite-men-at-arms`, all mapped to `man-at-arms`. I did not write the manager's suggested rule ("the rest equals the unit's own name") as given. It holds for none of the 11 ids, because ids are plural and keys singular (`longbowmen` vs `longbowman`, `men-at-arms` vs `man-at-arms`, `knights-or-lancers` vs `knight`). The rule in the ticket is the computable form:
   - When the id has more `-` segments than the dot's key, the tier is the id's first segment with its first letter capitalised.
   - Otherwise the text is the fixed fallback `Upgrade`.
   - This gives Early, Upgrade and Elite for the three men-at-arms ids, and Veteran or Elite for the rest.
   - The dot's key equals the `upgradeTargets` value. Checked in `research.ts` `researchItem` → `researchMarker(entry, time, upgradeTargets.get(baseId)?.value)` → `unitUpgradeDots`.
   - Limitation: a future id with no tier word but more segments than its unit, such as a hypothetical bare `knights-or-lancers`, would be misread. The looped test cannot catch that; only the named cases would.
2. **"Unit's name word" (gap 2).** Replaced with the gate's computable property (one word, no hyphen, capitalised, equal to the first segment, shorter than the id), applied on the tier branch of the loop.
3. **Invariants (gap 3).** Set to A1 as adjacent, with the reason. A2 and A3 are noted as untouched.
4. **Recharts mechanism.** Confirmed in the cached recharts 3.10.1 source:
   - `ReferenceDotImpl` wraps `label` and children in a `CartesianLabelContextProvider` whose viewBox is the dot's bounding box.
   - A plain string or object label renders a `Label`, which adds the `recharts-label` class inside a `ZIndexLayer`.
   - A content element or function is returned as is.
   - Scope therefore requires a content render, which keeps the new text out of every existing `text.recharts-label` selector. A testid alone would not, since those specs select by class.
   - The unverified assumption names this mechanism.
5. **Testids.** The new text has its own testids, `chart-upgrade-tier` and `chart-pinned-upgrade-tier`, and carries the dot's `data-series`, `data-label` and `data-at`.
6. **Pinned vs current text.** `pinnedColor` returns the current line's colour whenever the line exists, so colour cannot tell them apart. The ticket instead fixes opacity: current text fully opaque, pinned text lower, and the test reads the computed opacity of both.
7. **Two upgrades at one instant.** Confirmed with a throwaway vitest probe in scratch checkout `ticket-SGS-204` at origin/main (removed afterwards):
   - Setup: `startingWith(4, [3 archery ranges, houses], plenty)`, produce longbowmen, then research `veteran-longbowmen` and `elite-longbowmen`.
   - Result: two dots on `longbowman` at the same `at`.
   - No shipped build does this; every shipped build researches only `veteran-*`. So the shared-point and edge cases sit on a pure placement function with unit tests. Acceptance covers the shared point with a ring and a dot, which the existing spec already sets up.
8. **CONTEXT.md.** On merge adds both new functions to the Key surfaces "AoE4 Units chart upgrade dots" line.

## Decisions I fixed that the owner may want to see

- The fallback text is `Upgrade`. The gate suggested it, and it avoids repeating the unit name.
- The pinned tier text is drawn at lower opacity than the current text.

Neither comes from the design or the owner. Both were requested by the gate or the manager.

## Diagrams

None (single component, outside the core control loop).

## Open questions

None.

## Overlap

None found. SGS-203 touches `results.module.css` and the Marker control paragraph of the UI doc, not `line-chart.tsx` or the Upgrade dots paragraph. I checked no other open tickets beyond that.
