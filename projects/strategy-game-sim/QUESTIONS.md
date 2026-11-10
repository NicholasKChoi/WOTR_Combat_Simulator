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

next: Q26

## Q23: M7.8: which house rule replaces the auto-house gate?
kind: decision
blocks: M7 (The build order is the step timeline)
options: A) Drop the gate: auto-houses always plan, explicit house steps add on top; 2 warnings removed | B) Auto-houses yield only while an explicit house step is reached but not started | C) Keep the gate but open it whenever supply blocks production | D) Per-build setting
recommendation: A: simplest rule, matches the no-house-steps result, autoHouses:false still gives full manual control
research: reports/M7-planner-1.md
thread: 1569644163677294752

M7.8 (explicit build-house steps freeze production, build 259) needs a new house rule; the design does not state one.
- Today auto-houses stay off until the LAST explicit build-house step starts; build 259 froze villager production behind it.
- Without house steps the same build reached 20 villagers and 10 longbows by 7:30.
- A removes warnings auto-houses-never-start and auto-houses-held (OpenAPI change) and shifts english-1tc / knight-longbow timings.

### Answer

## Q24: M7: how to fix the Build panel scrolling sideways in the split layout?
kind: decision
blocks: M7 (The build order is the step timeline)
options: A) Table fits its column (cells wrap), scroll box on the table as fallback | B) Move only the sideways scroll from the panel onto the table | C) Use the under-768 px card layout inside the split column
recommendation: A: no panel-wide scroll, nothing clipped
research: reports/M7-planner-1.md
thread: 1569644167049650186

Backlog item in M7: in the split layout the sideways scroll applies to the whole ~9100 px Build panel.
- (a) is tested at 1280 px: table does not overflow, textarea not clipped.

### Answer

## Q25: M7: approve the five small UI defaults (legend above Text editor, gutter test ids, last-event-wins, drop results-split, conditional aria-describedby)?
kind: confirmation
blocks: M7 (The build order is the step timeline)
options: A) approve all five | B) change: name which
recommendation: A: each is the planner's recommendation
research: reports/M7-planner-1.md
thread: 1569644169797046293

Five small M7 UI choices; ticket authors take the recommendation unless you object.
- Kind legend also above the Text editor
- Gutter reuses step-started/step-finished test ids
- Caret line vs pointer-leave on another gutter line: last event wins
- Remove the results-split wrapper and its test id
- aria-describedby on results only while status text is non-empty

### Answer
