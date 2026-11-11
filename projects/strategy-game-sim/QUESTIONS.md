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

next: Q39

## Q38: M8 saved builds (re-ask of Q37): immutable links plus per-browser my-builds list, or editable named builds on the server?
kind: decision
blocks: M8 (AoE4 workbench: iterate on builds, tidy results, and pay do…)
options: A) immutable links + per-browser my-builds list: least work, links never change | B) editable named builds on server: one updating link, but edit secrets, new route | C) A plus export/import of the list: movable across devices, small extra UI
recommendation: A: keeps every link stable, no server change
research: reports/M8-research-1.md

Q37 was answered on Discord at 17:27 but its text was lost when the item left the board before it was routed; please answer again.
- A: no server change; links stay valid forever; list lives in one browser
- B: editable named builds on the server: needs edit secret, PUT route, openapi change; links can change
- C: A plus JSON export/import of the list

### Answer
