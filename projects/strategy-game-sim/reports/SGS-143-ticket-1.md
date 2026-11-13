# SGS-143 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-143-run-bar-focus-ring-and-height-rounding.md

Title: SGS-143: Fix run bar focus ring clipping and height rounding
Type Bug, priority medium, Risk low, component aoe4-build-order, Milestone none, Depends on none, ~15 LOC.

Summary: Two small run bar fixes. (1) Add `scroll-padding-block` (~0.25rem) to the capped `.runBar` rule (768 px and wider) in workbench.module.css so focus rings are not clipped. (2) `useRunBarHeight` rounds with `Math.ceil`, making `--aoe4-run-bar-height` larger than the real height, so the document can be under 1px short and the sticky bar cannot reach the viewport top; stop rounding up. Criteria cover the full focus ring being visible, exact scroll-end alignment with a fractional bar height (test fails at base), and the 40% cap and static narrow bar unchanged.

Diagrams: none required.
Open question: designer: keep scroll anchoring (`overflow-anchor: none` on `.pageSection`) at narrow/tabs widths? Left unchanged and out of scope.
Overlap: none found with open tickets. Lint passed. No commands run beyond lint; no code was changed.
