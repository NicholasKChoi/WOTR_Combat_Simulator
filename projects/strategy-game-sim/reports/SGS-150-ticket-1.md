# SGS-150 ticket report

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-150-deflake-small-screen-and-step-band-specs.md
- Title: SGS-150: Deflake the run-bar small-screen and step-band acceptance specs
- Type Chore, Priority low, Risk low, Component aoe4-build-order, Milestone none, Depends on none, On merge none. Lint passed.
- Size: about 40 lines of test and helper edits, no business logic.

## Findings at origin/main
- aoe4-small-screen.spec.ts: the test titled "scrolls the results heading into view" is gone. Its successor in `describe('run bar at 360x760')` is "scrolls away with the page, and a run does not scroll the page by itself". The ticket targets that one.
- aoe4-build-order-step-band.spec.ts: the reported line now holds "the start row clears a band set by the other input, hovering over a focused row and focusing under a hovered row".

## Likely causes (read only; not reproduced)
- Small-screen: `scrollInstantly(400)` right after `openPage` can clamp short while the page is still laying out; `before` and `settledScrollY` are one-shot reads. The final bar and title overlap measurement is a separate evaluate from the scroll poll.
- Step-band: alternating hover and focus, each of which can scroll, leaves hover state landing a frame late after an assertion already passed on its first sample.
- The ticket makes the implementer reproduce under parallel load first, and fix the reproduced cause if it differs.

## Overlap
None found with other open tickets. No open questions.
