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

next: Q156

## Q155: M13.4: check the Population cap mark and past-200 production on the preview/production
kind: handoff
blocks: M13.4 (Owner checks the changes on the PR previews and then produc…)
options: A) Done | B) Not now
recommendation: A: once checked
thread: 1574988784494182532

M13 code is merged (SGS-215, 216, 217). M13.4 needs your eyes; nothing else is waiting on it.
- Open the AoE4 build order page, run a build past 200 population, and confirm the Population chart shows a 'Population cap m:ss' mark.
- Then check production after the deploy.

### Answer
