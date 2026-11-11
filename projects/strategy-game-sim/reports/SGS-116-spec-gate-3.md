# SGS-116 spec gate, round 3 (re-spec 2)

Verdict: READY

(`SGS-116-spec-gate-2.md` already existed from the earlier round, so this is the next free n.)

Read at origin/main after `git fetch origin`; the branch `sgs-116-step-table-readability` (22ba507) was read for the one remaining change. No Depends-on.

## Re-spec 2 changes checked

- Grounded: on the branch, `step-table.module.css` already has no `max-width: 7.5rem` rule and `.scroll { overflow-x: auto }` exists. `step-table.tsx` has `step-table-scroll` (line 314) and `step-delete` (line 385). The layout case at `acceptance/aoe4-step-annotations.spec.ts` line 291 still holds the old check (`deletesInside` against `panel-build` right edge plus `panelFits`); that is the only work left, and the ticket says so.
- Testable: the new `deletesInside` is concrete and can fail. The scroll box is scrolled fully right, then every `step-delete` rect must lie within the `step-table-scroll` rect, with `overflow-x: auto` asserted. `panelFits` fails if `.scroll` loses `overflow-x: auto`, because `panel-build` is `overflow-x: visible` (asserted by the existing case). No stale numbers are pinned.
- The typing case (caret placed in the visible part, type `y`, `scrollLeft` unchanged) has preconditions asserted first and can fail for a reason: it fails if the reset runs on every text change. The reasoning for dropping the `End` variant is sound.
- Docs: the retained doc sentence (a table that cannot fit scrolls inside `step-table-scroll`, the panel never scrolls sideways) stays true under the no-cap design.
- Remaining checks (open questions none, invariants none, contracts `waitedText` and `labelled`, size about 90 LOC, risk low, On merge `none`, input validation not applicable) are unchanged from round 2 and still hold.

## Gaps

None.

## Notes (non-blocking)

- When the table fits without sideways scroll, "scrolled fully right" is `scrollLeft = 0`, so the delete check still holds; no special case is needed.
- The implementer should confirm the `deletesInside` check fails with `overflow-x: auto` removed from `.scroll`, as the criterion states.
