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

next: Q113

## Q112: M10.5: check the AoE4 build-order page on desktop and on a phone, then report what you saw
kind: handoff
blocks: M10.5 (Owner checks the page on the PR preview and then production…)
options: A) Done, looks right | B) Done, found a problem (say what) | C) Not now
thread: 1571985177868242974

M10.5 is the owner's check of the desktop-only AoE4 page; all code for M10 (SGS-184, SGS-185) is merged to main.
- On the production page (or a preview of main), open the AoE4 build order at a desktop width (1200+ px): two columns, no tabs.
- On a phone: the page should keep its 1200 px layout and scroll sideways, with nothing overlapping.

### Answer
