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

next: Q14

## Q12: AoE4 charts: when you hide Gold in the legend, should 'Gold (pinned)' hide too?
kind: confirmation
blocks: SGS-096 (Workbench UI bug fixes)
options: A) Hide pinned too: matches the doc; pinned can still be hidden alone; small change in chart-rows.ts | B) Keep independent: no code change; reword the doc
recommendation: A: matches what the doc already promises
research: reports/SGS-096-ticket-1.md
thread: 1568318864834433054

SGS-096 (AoE4 workbench UI bug fixes) waits on this.
- docs/aoe4-build-order.md says a pinned chart item 'follows' its current item.
- Today hiding Gold in the legend leaves 'Gold (pinned)' visible: they are hidden under separate keys.

### Answer

## Q13: Keep the 'resize while Results is hidden' spec in SGS-096, or defer it to M6?
kind: decision
blocks: SGS-096 (Workbench UI bug fixes)
options: A) Defer to M6: no spec M6 rewrites; M6 covers the narrow-width case | B) Keep in SGS-096: catches a width-0 chart bug sooner if it exists
recommendation: A: M6 changes when Results is hidden at all
research: reports/SGS-096-ticket-1.md
thread: 1568318869263622184

SGS-096 (AoE4 workbench UI bug fixes) waits on this.
- The ticket adds a Playwright spec: resize the window while the Results tab is hidden (charts may render at width 0).
- M6.2 puts editor and charts side by side at desktop widths, so Results is hidden only under the narrow-screen breakpoint; the spec's desktop step would be rewritten in M6.

### Answer
