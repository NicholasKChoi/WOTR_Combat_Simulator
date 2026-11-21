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

next: Q151

## Q149: M12.4: check repeat and rename in production, then run the M12 retro
kind: handoff
blocks: M12.4 (Owner checks the changes on the PR previews and then produc…)
options: A) Done | B) Not now
thread: 1572902464196186226
answered: 2026-11-21T19:43Z discord

M12.1 to M12.3 are done and merged (#218 to #221). M12.4 is yours: check the changes in production.
- Repeat: enter a step with a trailing xN (e.g. 'build Farm from wood x9') in the paste text and the step table Repeat field; see the copies timed and annotated.
- Rename: rename one of My builds; the new name shows in the library and My builds, and an old link still opens.
- Then run the retro (/code-factory:manage strategy-game-sim retro).

### Answer
A) Done

## Q150: Triage: AoE4 import/export of the overlay/aoe4guides build format
kind: decision
blocks: none
options: A) standalone bug | B) standalone chore | C) debug | D) milestone: adds behavior, needs a design | E) docs | F) drop
recommendation: D: new behavior needing a design and a schema check
research: discovery/milestone-20261120-1.md
priority: low
thread: 1573425739838001182

Discovery found a new idea: let the AoE4 build-order page import and export builds in the community AoE4_Overlay / aoe4guides format, so users can run shared guides and take tuned builds back to the in-game overlay. The exact schema was not retrieved; the first ticket would fetch a real export. Report: discovery/milestone-20261120-1.md

### Answer
