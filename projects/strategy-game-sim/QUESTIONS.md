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

next: Q9

## Q5: SGS-080 farm cap: when all farms are taken, does an extra farmer wait and take the next farm built, or stay idle until a step moves it?
kind: decision
blocks: SGS-080 (Hold one villager per farm in the engine), SGS-081
options: A) Wait and auto-take next farm: simple builds; a stated simplification | B) Stay idle until moved: like depleted nodes; may need a new step kind and more build steps | C) Only the builder takes its own farm, rest stay idle: B plus the builder case
recommendation: A: keeps builds simple; docs word it as a sim rule, not game behavior
research: reports/SGS-080-research-1.md
thread: 1567193000713388122

SGS-080 adds a one-villager-per-farm cap to the AoE4 build-order engine. A villager sent to farm when every farm is taken has nowhere to work.
- A: waits idle and takes the next farm built; build authors only write 'build farm' steps (~15 more engine lines)
- B: stays idle until a later step moves it, like villagers at a depleted node; but 'move farm -> farm' is likely a no-op, so B may need a new step kind and many extra steps in the 3 shipped builds
- No reliable AoE4 source either way; AoE2 forum evidence says idle builders do NOT auto-take farms. Research suggests calling A a sim simplification, not 'matches the game'

### Answer

## Q6: SGS-080: OK with this farm-idle warning text and severity?
kind: confirmation
blocks: SGS-080 (Hold one villager per farm in the engine)
options: A) Yes, as proposed | B) Change it (reply with wording)
recommendation: A
thread: 1567193002097508453

SGS-080 adds a warning when villagers reach farm with no free farm.
- Proposed: severity warning, shown once per run, summing all arrivals
- Text: '3 villagers arrived at farm from 0:50 on with no free farm and wait idle until one is built.'

### Answer

## Q7: SGS-080: should the one-farmer-per-farm rule have an off switch?
kind: confirmation
blocks: SGS-080 (Hold one villager per farm in the engine)
options: A) No switch: simpler, it is a model rule | B) Add an off switch: more surface and tests
recommendation: A
thread: 1567193004932862113

SGS-080's one-farmer-per-farm rule could have an input switch to turn it off and compare against the old no-limit model.
- Proposed: no switch; tests build their farms instead

### Answer

## Q8: SGS-081: should an unused farm (built, nobody on it) also fail the shipped-build quality bars?
kind: confirmation
blocks: SGS-081 (Re-time the farm steps of the prebuilt AoE4 builds for one…)
options: A) No, only idle farmers fail: simpler, one new test | B) Yes, unused farms fail too: stricter builds, one more test and tuning
recommendation: A
thread: 1567193091197112321

SGS-081 re-times the 3 shipped AoE4 builds' farm steps for the one-villager-per-farm rule (SGS-080).
- Planned bar: no villager ever waits idle for a farm (farm-idle warning absent at 20, 30 and 60 min)
- Open: should a farm built with nobody to work it (wasted wood) also fail the bars? Proposed: no, a tuning guideline only

### Answer
