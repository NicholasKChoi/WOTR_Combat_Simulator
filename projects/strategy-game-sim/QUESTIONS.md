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

next: Q102

## Q100: Triage: AoE4 charts' 0:00 and 0 axis labels overlap at the corner. How should it be handled?
kind: decision
blocks: backlog
options: A) standalone bug: fix soon as its own PR | B) standalone chore: no visible behavior change | C) debug: cause unknown | D) milestone: fold into a future milestone | E) docs | F) drop
recommendation: A (Priority: low): visible, cause plain, small fix
thread: 1571652757973377197

Untagged backlog item from the SGS-157 review: in every AoE4 series chart, the 0:00 x-axis label overlaps the 0 y-axis label at the chart's corner, at all widths, on main too. The repo's review checklist forbids overlapping tick labels.
- Cause is plain (axis label placement in line-chart.tsx), and the fix is visible but small.

### Answer

## Q101: Triage: AoE4 chart tooltips get cut off at the right edge on 360 px phones. How should it be handled?
kind: decision
blocks: backlog
options: A) standalone bug: fix soon as its own PR | B) standalone chore: no visible behavior change | C) debug: cause unknown | D) milestone: fold into a future milestone | E) docs | F) drop
recommendation: A (Priority: low): visible on phones, cause plain
thread: 1571652761114779838

Untagged backlog item from the SGS-157 review: at 360 px wide, an AoE4 chart tooltip shown near the chart's right edge cuts off its text (e.g. "Capital Town Center : 1"), on main too.
- Cause is recharts' default tooltip placement; fixable by constraining the tooltip to the chart (allowEscapeViewBox / position).

### Answer
