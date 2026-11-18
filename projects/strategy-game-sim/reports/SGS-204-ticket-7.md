# SGS-204 ticket 7 (re-spec 2)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-204-upgrade-dot-tier-indicator.md

## Summary

SGS-204 "Show which tier upgrade each Units chart upgrade dot is" was re-specced in place to fold in review 6 (NEEDS_SPEC). Component: aoe4-build-order. Type: Chore (unchanged), Milestone none, Risk standard. LOC estimate: raised from 70 to 90. Depends on: none. Ten criteria; criteria 2, 4, 5 and 9 are tagged `(respec 2)`.

### Changes

1. **Placement in pixel space.** Placement is now decided from the dots' pixel positions and the text box sizes, not by matching time and value. Any two tier texts whose boxes would intersect must be moved apart; dots at one point are one case of this.
   - Scope names the defect: the branch's `tierTextSlots` groups dots by `at:value`.
   - Scope leaves the pixel source to the implementer: the plot box and domains, recharts hooks, or rendered boxes.
   - Criterion 2 adds a unit case for two dots a few pixels apart. That test fails on exact-point grouping.
   - The docs criterion replaces the "at one point stack" sentence with the overlap rule.
2. **Criterion 4.** It now names the men-at-arms line (`early-men-at-arms` then `men-at-arms`). It asserts that the spec's `overlap(...)` on the two text rects is false, read in one `evaluate`, and not a not-identical-box check.
3. **One `evaluate` per comparison.** A new Scope Tests rule, and criterion 5, require every acceptance layout comparison to read all its values in one `evaluate` inside `expect.poll` or `toPass` (LESSONS.md; `readLayout` in `acceptance/helpers.ts`). Scope names the branch's two-call `readTiers` read in the pin test as forbidden.
4. **Context, age 4.** Context no longer says a run reaches age 4. The elite upgrades need age 4, which no run reaches, so two tiers show through the men-at-arms line. An exact-instant collision needs a start age set in data, or a pin.
5. **Type note.** Context says the type stays Chore because the owner tagged it a standalone chore, even though it adds visible text. It also says the acceptance gate runs because the diff adds acceptance specs.
6. **On merge.** It lists `upgradeTierName`, `tierTextSlots` and `placeTierText` for CONTEXT.md Key surfaces.

I verified each change against the branch at tip 1f5ebe0:
- `tierTextSlots` keys its groups by `${p.at}:${p.value}`.
- The pin test calls `readTiers` twice.
- The two-tier test uses `sameBox`.
- The doc sentence is present.
- The implementer report records that elite needs age 4, which no run reaches.

Lint: `ticket-lint.py` exited 0 with no errors.

## Diagrams

None. The change is in one component, outside the core control loop.

## Open questions

none

## Overlap with other tickets

None found.

## Branch work that stands

Branch `sgs-204-upgrade-dot-tier-indicator` (tip 1f5ebe0) is kept for the rework.

Stands as is:
- `upgradeTierName` and its tests;
- the `UpgradeTierText` render, with its testids and opacity;
- the `line-chart.tsx` wiring;
- `page-help.tsx`;
- the doc paragraph, apart from the stacking sentence;
- most acceptance cases.

Needs rework:
- `tierTextSlots` / `placeTierText` and their unit tests;
- the two-tier non-overlap assertion;
- the pin test's two-call read;
- the doc stacking sentence.
