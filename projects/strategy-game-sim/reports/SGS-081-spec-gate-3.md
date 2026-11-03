# SGS-081 spec gate 3 (re-spec after Q9 option A)

Verdict: READY

Checked: Scope 1b against the spear/longbow JSON on branch sgs-081-aoe4-retune-prebuilt-farms (rallies at 200, 380, 760 s, King's Palace rally, gold#3 reaction all exist as named); farm-idle exists on the 080 branch; docs bar paragraph exists at the quoted place; branch state matches implementer report 1; risk, invariants (A2, A3), diagrams, depends-on, docs and README scope all hold. Open questions: none. Q9 is folded in and no longer appears as undecided.

Notes (non-blocking):
1. Criterion 3 says "far fewer than 90" and "well under 110" steps. Nothing pins it. Propose a hard number the owner/ticket agent picks (for example, spear build step count at most 60). Not blocking because the real bars (farm-idle, all-started, Castle) are tests.
2. Scope 1b lists rally "counts" as changeable. Rally steps have no count field (only producer and to); the gold#3 reaction is a move with count "all". Read it as actions and targets.
3. 1b says "no unit count changes" while surplus villagers are redirected; fine, but the implementer should state in the README which resource each redirected rally now feeds (already required).
4. After redirecting rallies, re-check the 681 s man-at-arms trigger (already in Scope) and that the new target resource has gatherer room (a finite node could deplete and add an unreacted run-out warning); worth a line in the README reason.
