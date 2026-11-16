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

next: Q105

## Q104: Run the M9 retro now (not found as run)?
kind: handoff
blocks: retro
options: A) Done | B) Not now
recommendation: A: run it in a terminal, then answer Done
thread: 1571715406228365372

Owner answered Q103 'Done', but no retro report is newer than retros/retro-20261031.md and checkpoint retro.lastRun (2026-11-12) predates M9's last merge, so the retro has not run. It is interactive; a headless pass cannot run it.
- Run `/code-factory:manage strategy-game-sim retro` in a terminal in the code repo.
- Nothing else is queued: all 44 rows are integrated; M10 (checkpoint nextMilestoneScope) starts after the retro.

### Answer
