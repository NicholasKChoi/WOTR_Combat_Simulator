# SGS-050 spec gate 1

Verdict: READY

Checked: scope files (english.json ids council-hall, kings-palace, barracks, archery-range, spearman, longbowman, man-at-arms, crossbowman exist; builds.ts has the single english1tc entry; README.md:42 and docs paragraph exist), design/M3.md (M3.7 table, gold reaction rule, bar parts 1-5, MAX_DEPOSITS), SGS-039/040/051 dependency text, CONTEXT.md, INVARIANTS A1-A3, LESSONS (empty), Risk (lib/** critical path, high is right).

Gaps: none blocking.

Notes (non-blocking)
- Open question 1 (rename of english-1tc) is not main path; the ticket follows the final design (no rename) and says so. Can be closed since design/M3.md line 71 already answers it.
- test-helpers.ts does not exist on main; it is introduced by the M3 cleanup ticket. The ticket names it correctly as a dependency-provided file, but the Depends-on line does not list the cleanup ticket explicitly (only via SGS-039/040 transitively). Consider naming it.
- The man-at-arms `time` trigger is a hard-coded second equal to the landmark completion; it will drift if any tuning of earlier steps changes. The implementer should set it last, after tuning. README entry already requires explaining it.
- Castle by 1200 s is asserted by the shape test but not guaranteed by design (the owner's scratch run for the second build is Castle ~13:24); tuning must meet it. If tuning cannot, the ticket would need an owner call, but the draft figures make this unlikely.
