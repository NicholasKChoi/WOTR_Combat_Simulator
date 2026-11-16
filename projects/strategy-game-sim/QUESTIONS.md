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

next: Q117

## Q114: How should a zoomed chart pan? Pan buttons plus Shift+drag
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Pan buttons only: smallest, fully keyboard usable, no mouse slide | B) Pan buttons plus Shift+drag: plain drag always zooms, Shift+drag slides the window | C) Plain drag pans while zoomed, Shift+drag zooms: common in maps, but one drag means two things and zooming further needs Shift
recommendation: B: a drag never changes meaning, mouse users get a direct pan, buttons cover keyboard users
research: reports/M11-research-2.md
thread: 1572008981239697438

You decide how it feels to move around a zoomed results chart; the design and the chart-zoom ticket wait on it.
- Today a plain drag on a chart selects a time range to zoom into.
- A: two buttons, earlier and later, each moving the window by half its width. Nothing else.
- B: the same buttons, and holding Shift while dragging slides the window live. The help dialog explains the Shift gesture.
- C: while zoomed, a plain drag slides the window and Shift+drag selects a new range.

### Answer

## Q115: Report "waiting for a free Archery Range"? Only report waits the engine models
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Report only modeled waits: missing building, age, resources, villagers, population | B) Change the engine so steps wait for an idle building: matches the example, changes every build's timings
recommendation: A: no timing changes; the busy-building wait arrives with the already-deferred "research occupying its building"
research: reports/M11-research-2.md
thread: 1572008984150278326

You decide whether this milestone may change how builds are simulated. The step-wait wording ticket waits on it.
- Today a produce step takes over a building's queue and a research step joins it, so no step ever waits for a busy building. The example "waiting for a free Archery Range" cannot happen.
- A: wait notes say what really blocks a step, e.g. "still waiting for an Archery Range" (none built yet), "Castle Age", "50 gold", "2 more villagers at wood". The busy-building note is added later with the deferred item. The example in the exit criteria is not reproducible this milestone.
- B: steps wait for an idle building, then report it. Every existing build's timings and floors change, and a deferred item is pulled into this milestone.

### Answer

## Q116: Approve the M11 chart and waits design with its 21 defaults?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve design and defaults: stage 2 planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default takes the smaller, reversible choice and lists what it gave up
research: reports/M11-research-2.md
thread: 1572008986570395723

You decide whether the designer's picks match what you want to see; planning waits on it. Your answers to the pan and busy-building questions are already folded in.

Contracts, in short:
- The server adds to each step a typed "waiting for" detail plus a per-target list of waits with seconds; the step notes print them (e.g. "still waiting for Castle Age (King's Palace)"). The API schema changes in the same PRs.
- The server also adds a unit-line name to each unit series, and tags an upgrade marker with the unit it upgrades.
- Charts become one table, one row group per chart, each with its own zoom window; one shared marker control sits above it.
- A "How this page works" dialog next to the title takes over the step-kind legend.

The 21 defaults:
1. Upgrades show as a dot on the unit's line (not a vertical line each).
2. The Units chart becomes one line per unit type (tiers summed); no separate per-tier view.
3. Line names come from the server: the words the tier names share (Spearman, not Hardened Spearman).
4. The upgrade-to-unit link rides on the marker, not on a catalog sent to the page.
5. A pinned run gets no upgrade dots.
6. Hiding the upgrade-marker kind does not hide the dots.
7. Marker visibility and zoom are not saved; they reset on reload.
8. The marker control keeps hover/focus labelling and adds click to hide a kind.
9. Zoom windows survive new runs, view toggles and pins (adjusted to the new run length).
10. A selection shorter than 30 s does nothing.
11. Selection edges round to whole seconds.
12. The y axis fits the visible window.
13. The zoom bar (range, pan, reset) shows only while zoomed; reset moves focus to the chart's collapse button.
14. Pan buttons step half a window and stay focusable at the ends.
15. Chart rows are one table group per chart with a four-column header row; the key results panel stays outside.
16. All marker code moves into one module.
17. Wait details: one entry each for resources, villagers, population; one per target for prerequisites; first-seen numbers and order.
18. A missing age is reported before a missing building; a landmark is named only for the next age.
19. The "step stuck" warning text stays generic.
20. The help dialog is a native dialog opened from a button beside the title, before the run bar in Tab order.
21. Only the step-kind legend moves into the dialog; the per-chart pinned legend and hidden reorder help stay.

### Answer
