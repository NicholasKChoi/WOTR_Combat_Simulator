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

next: Q114

## Q113: Confirm the goals for the next milestone, "AoE4 workbench: readable results charts and clear step waits"? Yes: the design starts with these 8 goals.
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Confirm as written: the 8 goals below become the milestone, design starts | B) Change the goals: reply with what to add, drop or reword
recommendation: A: you chose this order (mobile removal first, then this), and the goals are drafted from your earlier answers.
research: reports/M11-research-1.md
thread: 1571991566271258726

Only you can settle what this milestone should deliver; the design and all work wait on it.

What you would get on the AoE4 page:
- 1. Zoom: drag on any results chart to zoom into a span of game time, pan along it, and press a reset button (keyboard reachable). Each chart zooms alone; reload shows the full game.
- 2. Unit lines: the Units produced chart shows one line per unit line (all spearman tiers in one color), with a dot or vertical marker at each veterancy upgrade finish time.
- 3. One marker control: one shared control shows or hides each marker kind's vertical lines on every chart at once.
- 4. Chart rows as a real table: rows line up cleanly when collapsed; drag reorder, collapse and saved state keep working.
- 5. Specific waits: a waiting step says what it waited for, e.g. "waiting for Castle Age (The White Tower)", "waiting for 50 gold", "waiting for a free Archery Range".
- 6. Help modal: a help button opens one "How this page works" modal (step-kind legend, what the yellow step tint means); the scattered inline legends and hints are removed.
- 7. Docs and tests: build-order docs, architecture notes and the API spec updated; browser tests cover zoom/reset, unit lines and upgrade markers, the marker control, the table, a wait reason, and the help modal.
- 8. Your check: you try the changes on the PR previews, then production.

Left for later milestones: sim accuracy, gather rates and patch tracking, step repeat, research occupying its building, renaming a saved build, English tech gaps, spread of outcomes.

### Answer
