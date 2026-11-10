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

next: Q23

## Q20: M7 compact view: annotate the Text tab (A) or collapse the step-table rows (B)?
kind: decision
blocks: M7 (The build order is the step timeline)
options: A) Text-tab gutter annotations: timings visible in the default view | B) Collapsible table rows: slightly smaller, but the default view loses timings | C) Both: most work
recommendation: A: the default Text view keeps per-step timings once the timeline is gone
research: reports/M7-research-1.md
thread: 1569588043898163275

M7 (the build order becomes the step timeline) drops the separate step timeline, so the compact view needs per-step timings somewhere (criterion M7.6).
- A: the Text tab line gutter gets a kind colour swatch and start-finish time per step line; waited/blocked-by in a tooltip. Text is the default view, so the default page keeps step timings. ~250-300 lines.
- B: step-table rows collapse to a one-line summary keeping the annotations; Text tab stays plain. ~200 lines, but the default (Text) view would show no timings, and collapsed rows are still taller than text lines.
- Designer and research both recommend A.

### Answer

## Q21: Approve the M7 design, including charts dimming between an edit and its new result?
kind: confirmation
blocks: M7 (The build order is the step timeline)
options: A) approve | B) approve, but keep charts undimmed during the debounce (only annotations dim) | C) change: <what>
recommendation: A: dimming everything together avoids showing old times next to a new build
thread: 1569588052148621352
answered: 2026-11-10T05:43Z discord

Approve the M7 design (design/M7.md) so the planner can cut tickets.
- One per-step annotation model (step-annotations.ts) feeds the step table and the compact view; the step timeline component goes away and the charts take its width.
- Steps are matched to the shown run by step text (common prefix, then suffix); an unmatched step keeps its colour but shows no times; another selected build shows no times at all.
- Behaviour change to M6.3: the charts now also dim during the ~500 ms debounce and while a run is updating, not only on invalid or failed input (read from M7.4: charts and annotations dim together).
- Hover/focus on a row shades the step's span on the charts, as the timeline did.

### Answer
A) approve

## Q22: Which backlog items go into M7?
kind: decision
blocks: M7 (The build order is the step timeline)
options: A) The sideways-scroll layout item and the two doc wording fixes | B) A plus the house-gate production freeze | C) None; keep M7 to its criteria
recommendation: A: they touch the same pane and doc section M7 rewrites; the house gate is a simulator change better as its own ticket
thread: 1569588055264993320
answered: 2026-11-10T05:43Z discord

36 backlog items exist (BACKLOG.md). Which should go into M7 as tickets?
- Closest to M7: workbench.module.css:42-44 sideways scroll covers the whole ~9100 px Build pane in the split layout (layout work M7 touches anyway).
- docs/aoe4-build-order.md:874/878 wording fixes in the section M7 rewrites nearby.
- simulate.ts:665 explicit house steps hold auto-houses and freeze production (build 259) - a simulator rule change, not UI.
- The rest are test, store and route cleanups unrelated to M7.

### Answer
B) A plus the house-gate production freeze
