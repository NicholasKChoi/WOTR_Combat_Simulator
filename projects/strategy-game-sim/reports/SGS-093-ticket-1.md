# SGS-093 ticket author report

Ticket: tickets/SGS-093-aoe4-docs-prebuilt-cleanups.md (branch name sgs-093-aoe4-docs-prebuilt-cleanups). Risk standard. Depends on SGS-081.
Covered BACKLOG bullets: 36, 38, 40, 70, 77, 78. Bullet 49 left out as instructed.

Findings that differ from the backlog (checked at origin/sgs-081 tip 9fd49d6 and main):
- Bullet 36: the nodeAmounts input-merge sentence already lists nodeAmounts; the old walk/idle sentence is gone. Remaining: intro line "walk time, idle time, ..." names an input that does not exist. Ticket says verify, fix that, audit "idle".
- Bullet 38: "Ordering and triggers" already points at the wait reasons table. Ticket says verify only.
- Bullet 77: probed by simulation (vitest probe in a throwaway worktree, removed): removing the spear build's 260 s rally to wood (index 14) CHANGES the result at 1200 and 3600 s (it gates later steps), so it is not a no-op. The 380 s rally to wood (index 31) is a true no-op (identical result and step times). The ticket removes redundant rallies by an equivalence rule, not by the backlog's index. The backlog's 1322.95 gold pin is stale (first gold now runs out ~1200.6 s per the 3600 s run); ticket says pin the engine value at 1800 s, in the test only.
- Bullet 70: at the SGS-081 tip the knight build has explicit houses at 0-based steps 1, 7, 21, 22, 23; engine rule is auto-houses off until the LAST build house starts. Ticket rewords without step number or house count.
- Bullet 78: README line 102 is 170 chars at the SGS-081 tip; ticket uses a >110-char rule over the edited sections.
Hard-coded index to fix: MAN_AT_ARMS_STEP = 35 in acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts.
Overlap: files shared with SGS-081 (hence the dependency); no other ticket overlap seen. Open questions: none. Diagrams: none required. Criteria that name commands (awk/grep) were not run against an end state; the mutation checks are for the implementer since the checks do not yet exist.
