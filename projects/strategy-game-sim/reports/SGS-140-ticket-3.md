# SGS-140 ticket report 3 (Re-spec 2)

File: projects/strategy-game-sim/tickets/SGS-140-editor-compact-mode.md. ticket-lint passes.

- Cause: the ticket and design C14 assumed 1rem = 16px; the root is 18px (styles/global.css:8), so 48rem = 864px and the C14 values alone failed criterion 2.
- Context now states the 18px basis. Scope ratifies the levers used inside the compact container query only: annotation width 4.7ch and padding-right 0, gutter min-width 0 and padding-right 0.125rem, textarea horizontal padding 0.25rem. Scope also notes the margin is about 1.3 px at 1280 px, and that a 3-digit gutter or `100:00` time is out of scope today.
- Criteria are unchanged, so criterion 2's pass condition is kept and no `(respec 2)` tags were added. A `## Re-spec 2` section is appended.
- Branch sgs-140-editor-compact-mode (tip 2f18733) satisfies the corrected spec with no code change.
- Design doc not edited. C14 still carries the 16px assumption, and other M9 rem bounds may too; the owner or designer should check them.
- Open questions: none.
