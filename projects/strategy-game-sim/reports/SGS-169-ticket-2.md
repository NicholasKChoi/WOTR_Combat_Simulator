# SGS-169 ticket report 2 (re-spec)

File: tickets/SGS-169-effect-not-simulated-debug-severity.md

Owner answer Q105 (debug messages hidden entirely, no toggle or control) is folded in:
- Scope's UI line says the page offers no toggle or other control to show debug messages.
- The out-of-scope note is rewritten to say the API response is the only place they appear.
- A new criterion, tagged (respec 1), requires that no control revealing debug messages renders. The existing "only debug notes" criterion is also tagged (respec 1).
- The Open question is deleted (Open questions now reads `none`) and a `## Re-spec 1 - 2026-11-15` section is appended.

Size, dependencies, risk and diagrams are unchanged: Chore, about 40 LOC, no dependencies, standard risk, no diagram required. There are no open questions and no overlap with other tickets. Lint passes (rc=0). I did not re-explore code, since the answer only affects spec wording.
