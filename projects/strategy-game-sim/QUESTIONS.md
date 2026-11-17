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

next: Q136

## Q134: Run /code-factory:upgrade (optional migrations 007, 008)?
kind: handoff
blocks: none
options: A) Done | B) Not now
recommendation: B: nothing waits on it
thread: 1572328649590439966

Two optional state migrations (007 upgrade-auto, 008 rescan-issues) are pending; the factory runs fine without them.
- Run /code-factory:upgrade in a Claude Code session in the code repo (not blocking anything).

### Answer

## Q135: How to handle the inverted aria-pressed on the series legend vs the marker control?
kind: decision
blocks: none
options: A) standalone bug: fix the series legend to aria-pressed=shown | B) standalone chore | C) debug | D) milestone | E) docs | F) drop
recommendation: A: behavior assistive tech users hear is wrong and the cause is plain; Priority low
thread: 1572356372539121795

SGS-200's docs work found that the AoE4 results page's series legend buttons set aria-pressed=true when a series is HIDDEN, while the new marker control sets aria-pressed=true when a kind is SHOWN. Screen-reader users get opposite meanings from two similar controls (components/apps/aoe4-build-order/chart-legend.tsx). Not a doc defect; no visible sighted-user change.

### Answer
