# SGS-170 ticket re-spec 1

File: projects/strategy-game-sim/tickets/SGS-170-step-annotation-hover-popover.md (lint clean).

Folded in owner answer Q106 (A): the popover also shows for the textarea caret's step line, driven by the existing onCaret / active step; no new focus targets, gutter stays aria-hidden and unfocusable. Scope keyboard line rewritten; two criteria added (respec 1): caret-driven show/move/hide (blur or non-run line hides), and no tab stops / gutter keeps aria-hidden. Open question deleted (now "none"); Re-spec 1 section appended. Size, risk, deps unchanged. No diagrams. Note: step-table also drives activeStep, but the step table is a separate view from the text editor.
