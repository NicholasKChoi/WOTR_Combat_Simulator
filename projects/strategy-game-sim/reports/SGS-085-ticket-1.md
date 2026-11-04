# SGS-085 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-085-aoe4-text-editor-issue-ux.md
Branch to use: sgs-085-aoe4-text-editor-issue-ux. Risk standard. Depends on: none. ~75 business-logic lines, no split needed.

Backlog bullets (BACKLOG.md lines): 57 gutter, 58 wording, 60 all lines at once, 61 Run feedback covered; 54 (keystroke cost) dropped.

Verified on main ee7ecb9:
- 54 does not hold as a problem: 200 steps / 11,199 chars took ~3 ms per textToBuildOrder call (parse ~0.6 ms), input capped at 20,000 chars. No debounce. Measured in a throwaway worktree (removed).
- 57 holds: build-text-editor.tsx sets data-error, workbench.module.css has no rule.
- 58 holds: `line 2: unknown unit "knigt" in unit` (schema.ts knownId/nodeAt); issue-list.tsx joins suggestion with ms-2 only.
- 60 holds: reproduced; `start -> sheep / produce knigt from stable / build hous` returns only the line 3 syntax issue.
- 61 partly: Run already clears the result, selects Build and scrolls to the first bad line (since #79), but gives no message, so with the issue already in view nothing visibly changes. Ticket adds a summary line `Fix 1 issue to run the simulation.` / `Fix N issues to run the simulation.`.

Decisions made without the owner (reversible, in ticket Open questions as non-blocking): summary line instead of disabling Run (check issues only show after the first Run, so a disabled Run would hide its reason); suggestion sentence form `line 2: unknown unit "knigt". Did you mean knight?`; before any Run, a text with a syntax error shows all its issues live, a text without one still hides check issues until the first Run.

Overlap: SGS-082 deletes acceptance/aoe4-build-order.spec.ts; ticket touches inline-issues, m4-flow, client-check and from specs only. SGS-080/081 do not touch these files. Tests to edit are given as a rule (examples marked).
No diagrams (single component, no control loop). No owner/designer questions.
