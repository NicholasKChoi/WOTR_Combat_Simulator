# Board item draft: close "research occupies its building" backlog item?

Not filed. Exact `board.py add` field values follow.

question: Close the backlog item "research occupies its building" once the busy-building change merges? Yes: it is removed from the backlog

kind: confirmation

blocks: M11

options: A) Close it when the change merges: the build order then already does what the item asks | B) Keep it open: for a remainder you name (reply with what)

recommendation: A: the change makes a research need its building to be free and pauses that building's units while it runs, which is the whole item

research: reports/M11-backlog-research-occupies-research-1.md

body lines:

You decide whether the backlog item is done, because the milestone text still lists it as "left for later" and only you know if you want more than the approved design builds. Nothing is blocked; the item just stays listed until you answer.
- The item asks that a research needs its building to exist and that units queued there pause while it runs. The approved busy-building change does both: a research waits until the building is fully idle, and the building makes no units until the research ends.
- Needing the building to exist was already true: a research with no matching building waits for one to be built (design/M11.md B-B7).
- What would remain if kept open: a research cannot queue behind another research or a unit; it waits instead, so two researches at one building run one after the other. The design names queueing researches, or a per-building queue cap, as a possible later change (design/M11.md, deferred options table). Only worth keeping if you want that.

## Research notes (frame depth, no new facts gathered)

- Backlog item: BACKLOG.md line 24 ("AoE4 build order: research occupies its building").
- Milestone text listing it as left for later: MILESTONES.md:256.
- Plan spec gap: plans/M11-20261116.md:61-67. Plan follows the design and leaves the item in the backlog until the owner answers.
- Design rules: design/M11.md B-B2 (line 199, researches never queue), B-B7 (line 204, missing building waits), B-B8 (line 205, research occupies its building), deferred option at line 351 (researches queueing behind researches, or a queue cap).
- Unverified: whether the owner wants researches to queue (not in the request text, which says "block its production queue", satisfied by B-B8).
