# M11 plan approval: drafted board item (frame depth; not filed)

Source: plans/M11-20261116.md. Fields below are the exact `board.py add` values.

question: Approve the 12-ticket plan for the AoE4 build-order page overhaul? Yes: ticket writing starts
kind: confirmation
blocks: M11
options: A) Approve: ticket writing starts for all 12 | B) Change something: ticket writing waits; reply with what to change
recommendation: A: the plan follows the approved design, covers every exit criterion, and has no open owner questions
research: reports/M11-plan-approval-research-1.md

body lines (first line is the why-you line):

You decide whether this split of the work is right before tickets are written; nothing is built until you say yes. Each ticket is one PR that auto-merges to production once its checks pass. Recommended: approve all.
- Reorder two prebuilt builds (Knight/Longbow, Council Hall): small, no logic change. Recommend yes.
- Steps wait for a free building, for both units and research: the biggest rule change; shifts timings of existing builds, and drops four Castle blacksmith researches from Spear/Longbow. Recommend yes.
- Add unit-line names and upgrade-marker units to the simulation result: small, new fields only. Recommend yes.
- Record what a waiting step is waiting for in the result: large engine change, no timing change. Recommend yes.
- Step annotations name the wait (for example "a free Archery Range 0:23"): small. Recommend yes.
- Results charts render as one table so rows align when some are collapsed: medium. Recommend yes.
- One shared marker control that hides and labels marker kinds on every chart: medium. Recommend yes.
- Zoom math and zoom bar (pan buttons, reset): small, nothing visible until the next ticket. Recommend yes.
- Drag-select zoom, Shift+drag pan and reset on every chart: large, UI only. Recommend yes.
- Units chart shows one line per unit line, with upgrade dots (current run filled, pinned run dashed rings): medium. Recommend yes.
- "How this page works" help modal: medium. Recommend yes.
- Final docs ticket (UI doc, format doc check, architecture notes): small, last. Recommend yes.

Unless you reply otherwise: the help modal describes only what has shipped when it is written, and the docs ticket brings it up to date; the zoomed chart's vertical range counts the one data point just outside each edge of the window. The older backlog item about research occupying its building stays open until you say it can close.

### Answer
