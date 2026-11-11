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

next: Q38

## Q37: M8 saved builds: immutable links plus a per-browser 'my builds' list, or editable named builds on the server?
kind: decision
blocks: M8 (AoE4 workbench: iterate on builds, tidy results, and pay do…)
options: A) immutable links + per-browser my-builds list: least work, links never change, list is per browser | B) editable named builds on server: one link per build that updates, but edit secrets, new route, links can change | C) A plus export/import of the list: A's model, list movable across devices, small extra UI
recommendation: A: keeps every link stable and needs no server change; C1 can be added later
research: reports/M8-research-1.md
thread: 1569886070425002075

M8.1 (start from a build and iterate) needs a save model before design. Today a save is an immutable content-addressed ?b=<id> link with an immutable cache header.
- A: no server or API change; every link an agent hands you stays valid forever; the list lives in one browser
- B: needs a random id, an edit secret, a PUT route, an openapi change, and dropping the immutable cache; a shared link can change under you
- C1 adds export/import of the list (JSON) so it can move between devices

### Answer
