# M10 research 2: three board items (depth: frame)

Source: design/M10.md (Owner decisions OD1, OD2; Defaults; Starting state). Nothing new gathered; no web.

## Question
Three owner questions from the M10 design (AoE4 build order becomes desktop-only): minimum width, behavior below it, approval of the design's defaults.

## Item 1: minimum supported width

$B add fields:
- question: Lowest screen width the AoE4 build order page supports: 1200 px?
- kind: decision
- blocks: M10
- options: A) 1200 px: laptops at 125% zoom and iPad landscape scroll sideways | B) 1024 px: those fit, but needs a new untested layout | C) 1280 px: drops 1200-1279 px, which works today
- recommendation: A: the two-column layout is already built and tested from 1200 px
- research: design/M10.md

Body lines:
- You decide who the page is for; the design and its tests wait on this number.
- A) 1200 px (recommended): the width two columns already start at. Covers 1280, 1366, 1440, 1536 and 1920 px screens. Cost: a 1280 px laptop at 125% browser or OS zoom (1024 px effective) and an iPad in landscape (1024-1180 px) scroll sideways.
- B) 1024 px: those screens fit. Cost: two columns would be about 444 px each, never built or tested. The save row would need redesign and the step table scrolls more. New layout work in a milestone that is meant to remove code.
- C) 1280 px: matches the test screen size. Cost: gives up 1200-1279 px, which works today, for no gain.

## Item 2: below-minimum behavior

$B add fields:
- question: On screens narrower than the minimum, scroll sideways only, or add a notice too?
- kind: decision
- blocks: M10
- options: A) Sideways scroll only: no notice, nothing extra to maintain | B) Scroll plus a one-line "needs a wider screen" notice: one more rule and test
- recommendation: A: simplest; the page stays whole and a phone can pinch-zoom out
- research: design/M10.md

Body lines:
- You decide how a phone or small window is treated; this fixes the below-minimum rule and its test.
- Either way the page keeps its 1200 px layout and the window scrolls sideways. A phone sees the same page as a 1200 px desktop; pinch-zoom out shows it whole.
- A) Scroll only (recommended): no breakpoint in the AoE4 styles, one test. Cost: a phone visitor gets no explanation.
- B) Scroll plus a one-line notice above the page heading, shown only below 1200 px: visitors learn why the page is wide. Cost: one style rule, one more test case, notice text to maintain.
- A "notice with no scroll" option is not offered: squeezing two columns into a 390 px phone breaks or overlaps things, which fails the milestone's own bar ("nothing breaks or overlaps at 390 px"). Avoiding it would mean keeping a narrow layout, the thing this milestone removes.

## Item 3: design approval

$B add fields:
- question: Approve the M10 design and its defaults? Yes: work starts in three steps
- kind: confirmation
- blocks: M10
- options: A) Approve the design and defaults | B) Change something: reply naming what
- recommendation: A: each default keeps desktop behavior as it is today
- research: design/M10.md

Body lines:
- You own the scope of what gets removed; implementation tickets wait on this. This assumes your answers to the width and below-minimum questions.
- Two columns (Build | Results) are the only layout and the tabs go away.
- Compact editor style everywhere: desktop users already see it today, so nothing changes for them.
- Viewport media queries are removed from the AoE4 page only; other apps keep phone support and the site-wide viewport setting stays.
- Opening a saved link (?n= or ?b=) no longer switches to a Results tab, since both columns are always visible.
- The test screen-size constant changes: the 1200 px minimum replaces the old tabs and split constants.
- Delivery in three steps: (1) move or delete specs to desktop widths, passing on today's code; (2) remove the code, add the below-minimum test (aoe4-min-width.spec.ts); (3) update the docs.
- Corrections to the milestone's M10.1 wording: the container queries are what make the editor compact on desktop (so they are folded into the base styles, not deleted); and the tabs layout also covers 768-1199 px, not only phones.

## Recommendation
A on all three: 1200 px; scroll only; approve. Deciding reason for 1: layout already built and tested at 1200. For 2: fewest moving parts. For 3: defaults preserve today's desktop behavior.

## Unknowns
- Not verified against code; frame depth takes the design as written (starting state is origin/main @ 6411526, main has since moved).
- Who actually visits on phones or iPads is unknown; analytics would settle OD1 and OD2 if the owner has any.

## Sources
- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M10.md: Summary (lines 8-17), Starting state (19-32), Delivery order (199-206), Defaults (208-218), Owner decisions (220-236).
- /home/choin/git/code-factory/templates/QUESTIONS.md for the item rules.
