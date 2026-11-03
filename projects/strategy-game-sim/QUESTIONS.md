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

next: Q10

## Q9: Spear/longbow build: how should it satisfy one villager per farm?
kind: decision
blocks: SGS-081 (Re-time the farm steps of the prebuilt AoE4 builds for one…), SGS-080 (Hold one villager per farm in the engine)
options: A) Change or cap the spear build's rallies to farm so fewer villagers need farms: fewest extra farm steps, keeps the 1200s bar, alters the build's shape | B) Relax the 1200s all-steps-started bar for farm blocks in this build: build stays as is, weaker timing check | C) Allow farm-idle villagers in the spear build and drop zero farm-idle for it: least work, build keeps idle farmers
recommendation: A: the build then models a realistic economy and every existing bar stays intact
research: reports/SGS-081-implementer-1.md
thread: 1567213079417069638

SGS-081 (re-time farm steps of prebuilt AoE4 builds for one villager per farm) cannot be built as specced. The implementer found that the spear/longbow build produces ~146 villagers and its rallies to farm (200s, 380s, King's Palace, 760s) send nearly all to farm until the pop cap.
- Zero farm-idle needs ~90 extra build farm steps (110 total, cap 200).
- Farms are paid from wood; at 1200s, 12 of those steps have not started, so the 'every non-reaction step started by 1200s' bar fails.
- Farm blocks earlier: Castle not reached by 1200s. Later: breaks the man-at-arms 681s trigger.
- Knight/longbow build is done (11 farm steps added) and passes. SGS-080 is tested and waits on this; no PRs open until it is resolved.
- Report: reports/SGS-081-implementer-1.md

### Answer
