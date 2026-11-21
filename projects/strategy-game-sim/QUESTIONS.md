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

next: Q152

## Q151: Run the M12 retro, then start M13 (AoE4 overlay import/export)
kind: handoff
blocks: none
options: A) Done | B) Not now
recommendation: A: retro is interactive; run /code-factory:manage strategy-game-sim retro in a session, then drive starts M13 from the (milestone) backlog item
thread: 1573786140819857599

M12 is complete (all criteria done). The retro never runs in a drive pass, and the next milestone waits on it. Run it from a terminal in the code repo.

### Answer
