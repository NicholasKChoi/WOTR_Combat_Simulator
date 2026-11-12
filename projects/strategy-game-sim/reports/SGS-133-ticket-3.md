# SGS-133 ticket author, re-spec 2

File: projects/strategy-game-sim/tickets/SGS-133-split-scroll-anchoring-and-run-bar-cap.md (lint clean).

Applied the two spec-gate-2 fixes and nothing else:
1. Scope's capped-state rule now stops only when the bar's content exceeds its box AND `save-copy-cancel`'s bottom is below the bar's bottom at scrollTop 0, both asserted in the precondition evaluate. The `designer` stop is kept (now for "does not meet both conditions"). Criterion 3 (precondition) and criterion 5 (cancel is the last focusable control; added hint and error hold no controls) match.
2. Scope states that the capped state has `auto-run-status` shown via a completed run awaited with `waitForRun` (exists in acceptance/helpers.ts). The precondition asserts it is shown, so criterion 6 cannot pass vacuously.

Criteria 3, 5, 6 tagged (respec 2). Appended `## Re-spec 2 - 2026-11-11`. No open questions, no diagrams, no overlap.
