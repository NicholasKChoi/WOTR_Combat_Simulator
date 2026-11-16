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

next: Q112

## Q109: Lowest screen width the AoE4 build order page supports: 1200 px?
kind: decision
blocks: M10 (AoE4 build order is a desktop page (mobile support removed))
options: A) 1200 px: laptops at 125% zoom and iPad landscape scroll sideways | B) 1024 px: those fit, but needs a new untested layout | C) 1280 px: drops 1200-1279 px, which works today
recommendation: A: the two-column layout is already built and tested from 1200 px
research: design/M10.md
thread: 1571953318346104832

Why you: you decide who the page is for; the design and its tests wait on this number.
- A (1200 px) covers 1280, 1366, 1440, 1536 and 1920 px screens. Cost: a 1280 px laptop at 125% zoom (1024 px effective) and an iPad in landscape (1024-1180 px) scroll sideways.
- B (1024 px) makes the columns about 444 px each, never built or tested; the save row needs redesign and the step table scrolls more.
- C (1280 px) gives up 1200-1279 px, which works today, for no gain.

### Answer

## Q110: On screens narrower than the minimum, scroll sideways only, or add a notice too?
kind: decision
blocks: M10 (AoE4 build order is a desktop page (mobile support removed))
options: A) Sideways scroll only: no notice, nothing extra to maintain | B) Scroll plus a one-line "needs a wider screen" notice: one more rule and test
recommendation: A: simplest; the page stays whole and a phone can pinch-zoom out
research: design/M10.md
thread: 1571953321021804745

Why you: you decide how a phone or small window is treated; this fixes the below-minimum rule and its test.
- Either way the page keeps its minimum-width layout and the window scrolls sideways.
- A costs nothing to maintain, but a phone visitor gets no explanation.
- B adds a notice above the heading, shown only below the minimum: one style rule, one test case, and notice text to maintain.
- "Notice with no scroll" is not offered: squeezing two columns into 390 px breaks or overlaps things, and avoiding that means keeping a narrow layout, which this milestone removes.

### Answer

## Q111: Approve the M10 design and its defaults? Yes: work starts in three steps
kind: confirmation
blocks: M10 (AoE4 build order is a desktop page (mobile support removed))
options: A) Approve the design and defaults | B) Change something: reply naming what
recommendation: A: each default keeps desktop behavior as it is today
research: design/M10.md
thread: 1571953323655962766

Why you: you own the scope of what gets removed; implementation tickets wait on this.
- Two columns are the only layout; the tabs go away.
- The compact editor style applies everywhere (desktop users already see it today).
- Viewport media queries are removed from the AoE4 page only; other apps keep phone support.
- ?n= and ?b= links no longer select a tab.
- Test viewport constants: a 1200 px minimum replaces the old tabs and split constants.
- Delivery in three steps: specs to desktop widths, then code removal plus aoe4-min-width.spec.ts, then docs.
- Corrections to M10.1's wording: the editor container queries are what make it compact on desktop, so they fold into base styles rather than being deleted; the tabs layout also covers 768-1199 px, not only phones.

### Answer
