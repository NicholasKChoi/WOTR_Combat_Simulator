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

next: Q103

## Q102: M9.2: does Save a new version work in production (reload shows revision 2)?
kind: handoff
blocks: M9.2 (Owner verifies on the PR preview and then production: save…)
options: A) Done, it works | B) Not now | C) It fails, details in reply
recommendation: A: confirms M9 can close and the retro can run
thread: 1571662927964934174

M9.2 is the only open M9 criterion; every code criterion is now done. It needs you on the deployed site.
- On production: save a build, Save as copy, edit, Save a new version; reload should show revision 2.

### Answer
