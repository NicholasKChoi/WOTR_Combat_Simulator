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

next: Q109

## Q108: M10 plan: build charts and clearer waits next? Yes: design starts
kind: confirmation
blocks: M10 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve as drafted: charts and clarity only; accuracy and mobile removal wait | B) Approve, but add or drop items: reply naming which | C) Pick a different focus for M10: e.g. sim accuracy or mobile removal; charts slip
recommendation: A: these are your own chart and clarity requests; mobile removal was to be its own milestone
research: reports/M10-research-1.md
thread: 1571950186245394503

You choose what M10 delivers; the design waits on this.
- Zoom: drag-select a time range on any time chart, pan, reset; each chart on its own, not saved on reload.
- Units produced chart: one line per unit line (all tiers one color), veterancy upgrades marked.
- One marker control: show or hide a marker kind on every chart at once.
- Chart rows become a real table; drag reorder and collapse keep working.
- Waiting steps say why: "waiting for Castle Age (The White Tower)", "waiting for 50 gold", "waiting for a free Archery Range".
- One "How this page works" help modal replaces the scattered legends and hints.
- Docs and browser tests updated; you check previews, then production.
- Left out: mobile removal, sim accuracy, gather rates and patch tracking, step repeat, research occupying its building, rename a saved build, English tech gaps, spread of outcomes.

### Answer
