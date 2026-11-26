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

next: Q158

## Q156: SGS-219 follow-up: keep or drop the timeMarkDrawn test-coverage note?
kind: decision
blocks: none
options: A) Keep defects only (drops this nit) | B) Triage it on its own | C) Drop all
recommendation: A: it is a nit, nothing wrong today
priority: low
thread: 1575329167552024586

SGS-219 left one follow-up in the backlog: the in-window rule in timeMarkDrawn (line chart) is hidden in the browser because recharts drops out-of-domain reference lines, so only a unit test pins it. It harms nothing now.
- Nit: no behavior is wrong; a test-coverage note only.

### Answer

## Q157: Backlog triage: save a set of 1-3 builds and compare them side by side
kind: decision
blocks: none
options: A) standalone bug | B) standalone chore | C) debug | D) milestone: needs design | E) docs | F) drop
recommendation: D: too big for a chore; needs storage and compare design
research: projects/strategy-game-sim/reports/SGS-220-ticket-1.md
priority: low
thread: 1575329496897421397

Backlog item: save a named set of 1-3 related builds and compare them side by side. The ticket agent judged it too big for a chore: compare is strictly pin vs current run, and sets need a storage decision, an N-run compare model, and new UI (well over 400 lines).
- Saved builds are server-backed named builds; only My builds is in localStorage
- Open questions: sets private to this browser or shareable by link? does compare replace the single pin?

### Answer
