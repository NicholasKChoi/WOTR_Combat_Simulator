# SGS-086 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-086-aoe4-small-screen-tabs-keyboard.md
Risk low, Depends on none, branch sgs-086-aoe4-small-screen-tabs-keyboard, ~45 LOC, component aoe4-build-order.
Covers BACKLOG.md bullets at lines 56 (card selects), 59 (sticky run bar), 62 (tab arrow keys). All three verified
against origin/main (ee7ecb9) by reading code; none dropped. Not reproduced in a browser (the ticket makes the
implementer record a fail-on-main/pass-on-branch result for the select overflow).
Design choice: run bar made static below 768 px (backlog offered non-sticky or compact); scroll margins in the page
guard on computed position.
New tests go in new files (workbench-tabs.test.ts, acceptance/aoe4-small-screen.spec.ts); nothing added to the spec SGS-082 deletes.
No diagrams. No open questions. Overlap: none with open tickets (SGS-082 touches only the deleted spec; helpers it keeps are the ones used).
