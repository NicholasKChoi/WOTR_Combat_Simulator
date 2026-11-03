# SGS-081 ticket report

Ticket: tickets/SGS-081-aoe4-retune-prebuilt-farms.md. Component aoe4-build-order, Risk standard (data, README and test pins only; no engine change; 0 business-logic lines), Depends on SGS-080 (lands stacked).

Covers: re-time farm steps in the three builds (per-build step lists named) so every villager sent to farm finds a built farm; no constants fixed by the ticket (implementer finds them against the 080 engine); new per-build `farm-idle` bar in builds.test.ts at 1200/1800/3600 s; docs bar paragraph update; re-pin digests (simulate-house-warnings, house-lead-time spec incl. its index-based withoutPalaceHouses filter) and other shipped-build pins that may move; fold in 080's failing shipped-build assertions; README Prebuilt-builds rewrite (choices/rules only, consistent with the SGS-079 branch text).

Checked: README Prebuilt section `[0-9]+\.[0-9]+ s` count is 6 on main, 0 on the 079 branch. Not run: the `farm-idle` criteria and the mutation check (re-time first farm 60 s later) need the SGS-080 engine, which is not implemented.
Diagrams: none required.
Open questions (owner): whether an unused built farm is also a bar; assumption that excess farmers wait (080's default).
Overlap: SGS-079 edits the same README section (ticket says to produce the same result either way); SGS-080 pins the same digests (081 re-pins after).
