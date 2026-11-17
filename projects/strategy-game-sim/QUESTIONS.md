# Strategy Game Simulator: Questions

Open owner questions. The manager adds and deletes items with `bot/board.py`; the Discord bot fills
`thread` and the Answer section. An answered item stays until the manager routes the answer (manage.md
Owner answers), then the manager deletes it. The owner reads items on a phone without the repo, so
each item stands alone: ids carry their titles (board.py glosses `blocks`; gloss ids in the body by
hand), each option names its tradeoff, and the body holds at most three findings with their numbers.
Detail goes in the research report. Each item has this shape:

    ## Q<n>: <the question, one line>
    kind: decision | confirmation
    blocks: <task ids or milestone, comma-separated; glossed with titles on add>
    options: A) <option>: <tradeoff> | B) <option>: <tradeoff>
    recommendation: <option letter>: <one line why>
    research: <report path relative to PROJECT_DIR>
    thread: <Discord thread id; bot only>
    answered: <UTC time> <source>

    <why it is asked, in a sentence or two>
    - <finding behind the recommendation, with numbers; at most three>

    ### Answer
    <the owner's answer; empty while open>

next: Q131

## Q126: Approve the 12-ticket M11 plan 1/2: engine, builds, docs. Yes: ticket writing starts
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: ticket writing starts | B) Change something: ticket writing waits; reply with what to change
recommendation: A: the plan follows the approved design and covers every exit criterion
research: reports/M11-plan-approval-research-1.md
thread: 1572093837915201537

You decide whether this split of the work is right before tickets are written; nothing is built until you say yes. Each ticket is one PR that auto-merges to production once its checks pass.
- Reorder two prebuilt builds (Knight/Longbow, Council Hall): small, no logic change. Recommend yes.
- Steps wait for a free building, for units and research: the biggest rule change; shifts timings of existing builds and drops four Castle blacksmith researches from Spear/Longbow. Recommend yes.
- Add unit-line names and upgrade-marker units to the simulation result: small, new fields only. Recommend yes.
- Record what a waiting step is waiting for in the result: large engine change, no timing change. Recommend yes.
- Step annotations name the wait (for example "a free Archery Range 0:23"): small. Recommend yes.
- Final docs ticket (UI doc, format doc check, architecture notes): small, runs last. Recommend yes.

### Answer

## Q127: Approve the 12-ticket M11 plan 2/2: charts, zoom, help. Yes: ticket writing starts
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: ticket writing starts | B) Change something: ticket writing waits; reply with what to change
recommendation: A: the plan follows the approved design and covers every exit criterion
research: reports/M11-plan-approval-research-1.md
thread: 1572093842025349240

You decide whether this split of the work is right before tickets are written; nothing is built until you say yes. Each ticket is one PR that auto-merges to production once its checks pass.
- Results charts render as one table so rows align when some are collapsed: medium. Recommend yes.
- One shared marker control that hides and labels marker kinds on every chart: medium. Recommend yes.
- Zoom math and zoom bar (pan buttons, reset): small, nothing visible until the next ticket. Recommend yes.
- Drag-select zoom, Shift+drag pan and reset on every chart: large, UI only. Recommend yes.
- Units chart shows one line per unit line, with upgrade dots (current run filled, pinned run dashed rings): medium. Recommend yes.
- "How this page works" help modal: medium. Recommend yes.

### Answer

## Q128: Help text for the page: describe features before they ship, or wait?
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Write the help for the page as it is when it lands: later features get added at the end, so it may be briefly incomplete | B) Land the help last: it describes the finished page, but you get no help button until the end
recommendation: A: nothing shipped ever mentions a missing feature, and help arrives early at the cost of one small follow-up edit
research: reports/M11-help-timing-research-1.md
thread: 1572093844290281538

Only you can weigh an early, partial help button against a late, complete one; the help modal ticket waits on this, and every change goes live to production as soon as it merges.
- The help text is designed to cover the marker control, the unit-line chart with upgrade dots, zoom/pan/reset, and the new "waiting for ..." wording. Those arrive in separate changes that may merge after the help button does.
- A) The help button ships early and covers only what is live then. The closing docs change adds the missing sections once those features are live. Visitors never read about a feature that is not there.
- B) The help button ships after the wait-text, unit-line and zoom changes. Text is complete the first time, but the help button is the last thing to appear.
- Describing unshipped features is not offered: it would mislead visitors on production.

### Answer

## Q129: While zoomed, should the y axis also count the data just outside the window? A: yes, it may show slightly larger values than visible
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Count the two edge rows: axis may reach a little past what the window shows, lines run cleanly to the edges | B) Only rows inside the window: tighter axis, but lines may be cut off at the edges or the axis jumps as you pan
recommendation: A: it is the design as written and keeps the axis steady while panning
research: reports/M11-zoom-yaxis-research-1.md
thread: 1572093848153366568

You decide this because it is a look-and-feel tradeoff in the zoomed charts; the zoom work waits on it, and the plan picks A if you do not answer.
- Zoom lines run to both edges of the window by drawing one extra data point just before and just after it.
- A (recommended): those two extra points also set the vertical scale. Example: wood floating just before a spend can make the top of the axis a bit higher than anything visible in the window.
- B: only points inside the window set the scale. The axis hugs the visible lines, but a line heading to an off-window value can be clipped at the edge, or the axis can jump as you pan.
- Either way the effect is small; it also decides what the zoom test checks.

### Answer

## Q130: Close the backlog item "research occupies its building" once the busy-building change merges? Yes: it is removed from the backlog
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Close it when the change merges: the build order then already does what the item asks | B) Keep it open: reply with the remainder you want
recommendation: A: the change covers the whole item
research: reports/M11-backlog-research-occupies-research-1.md
thread: 1572093850674274456

You decide whether the backlog item is done, because the milestone text still lists it as "left for later" and only you know if you want more than the approved design builds. Nothing is blocked; the item just stays listed until you answer.
- The item asks that a research needs its building and that units queued there pause while it runs. The approved busy-building change does both: a research waits until the building is fully idle, and the building makes no units until it ends.
- What would remain if kept open: a research cannot queue behind another research or a unit; it waits, so two researches at one building run one after the other. Only worth keeping if you want queueing.

### Answer
