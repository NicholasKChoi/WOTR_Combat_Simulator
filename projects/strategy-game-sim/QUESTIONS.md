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

next: Q153

## Q151: Run the M12 retro, then start M13 (AoE4 overlay import/export)
kind: handoff
blocks: none
options: A) Done | B) Not now
recommendation: A: retro is interactive; run /code-factory:manage strategy-game-sim retro in a session, then drive starts M13 from the (milestone) backlog item
thread: 1573786140819857599

M12 is complete (all criteria done). The retro never runs in a drive pass, and the next milestone waits on it. Run it from a terminal in the code repo.

### Answer

## Q152: Start M13: AoE4 overlay import/export with these five criteria?
kind: confirmation
blocks: M13 (AoE4 overlay import/export: bring a community build in, tak…)
options: A) Confirm: design starts next | B) Pick a different next milestone: reply with which backlog item | C) Not now: hold M13
recommendation: A: the one clear AoE4 gap in the backlog, medium priority, fits the question budget
priority: high
thread: 1573863453637214230

Only you can confirm what the next AoE4 milestone (M13) delivers; design and tickets wait on it.
- Import: paste a community overlay/guide build (AoE4_Overlay / aoe4guides JSON) and run it in the simulator. Steps that don't map (villager counts, notes) are listed as skipped, never silently dropped.
- Export: take a build tuned here out to the overlay format; re-importing it gives the same build for every step the format can express.
- First step fetches a real overlay export to base the mapping on (the format is not yet verified).
- Also: docs and Playwright specs, then you check the previews and production.
- Left for later: sim accuracy, patch tracking, English tech gaps, spread of outcomes.
Criteria are in MILESTONES.md under M13 (M13.1 to M13.5).

### Answer
