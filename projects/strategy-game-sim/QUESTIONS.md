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

next: Q123

## Q118: May a research queue behind another research at its building?
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Research waits for a fully idle building: literal, but breaks prebuilt builds | B) Research waits only while a unit trains: floors and caps hold, 3 starts move <=6 s
recommendation: B: A fails the prebuilt-build bar and floors; B keeps them and still reports busy buildings
research: reports/M11-research-3.md
thread: 1572015078448832526

You decide how literally "wait for an idle building" applies to researches; the engine ticket and every prebuilt build wait on it.
- Option A (literal): a research also waits for other researches at its building. Measured on a prototype: two prebuilt builds leave steps 73-78 and 49-55 unstarted at 20 min, so the "no waiting" bar fails.
- Under A, Knight/Longbow makes 17 knights by 20 min (floor 23, today 31) and 1TC Council Hall floats 3021 wood (cap 2600). Fixing it means reordering steps in three builds or lowering floors, which needs another answer from you.
- Option B: a research waits only while its building is training a unit; researches still queue behind researches, as today. All floors and caps hold; three step starts move by at most 6 s.
- B still shows "a free Archery Range" whenever a research meets a training building. Only a research queued behind another research shows its payment time as its start.

### Answer

## Q119: Approve the M11 design defaults 1/4: unit lines and markers?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default took the smaller, reversible choice and lists what it gave up
research: reports/M11-research-3.md
thread: 1572015090121842771

You decide whether these unit-line and marker picks match what you want to see; planning waits on it. Each took the smaller, reversible choice.
- Upgrades show as a dot on the unit's line, not a vertical line each.
- The Units chart is one line per unit type (tiers summed); no per-tier view.
- Line names come from the server: the words the tiers share (Spearman, not Hardened Spearman).
- The upgrade-to-unit link rides on the marker, not on a catalog sent to the page.
- A pinned run gets no upgrade dots.
- Hiding the upgrade-marker kind does not hide the dots.
- The marker control keeps hover/focus labelling and adds click to hide a kind.
- All marker code moves into one module.

### Answer

## Q120: Approve the M11 design defaults 2/4: zoom and chart layout?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default took the smaller, reversible choice and lists what it gave up
research: reports/M11-research-3.md
thread: 1572015101383282859

You decide whether these zoom and chart-layout picks match what you want to see; planning waits on it. Each took the smaller, reversible choice.
- Marker visibility and zoom are not saved; they reset on reload.
- Zoom windows survive new runs, view toggles and pins (adjusted to the new run length).
- A selection shorter than 30 s does nothing.
- Selection edges round to whole seconds.
- The y axis fits the visible window.
- The zoom bar (range, pan, reset) shows only while zoomed; reset moves focus to the chart's collapse button.
- Pan buttons step half a window and stay focusable at the ends.
- Charts become one table, one group per chart with a four-column header row; the key results panel stays outside.

### Answer

## Q121: Approve the M11 design defaults 3/4: wait text and help dialog?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default took the smaller, reversible choice and lists what it gave up
research: reports/M11-research-3.md
thread: 1572015104634130532

You decide whether these wait-text and help-dialog picks match what you want to see; planning waits on it. Each took the smaller, reversible choice.
- Wait details: one entry each for resources, villagers, population; one per target for prerequisites; first-seen numbers and order.
- A missing age is reported before a missing building; a landmark is named only for the next age.
- The "step stuck" warning text stays generic.
- Busy wording: "a free Archery Range", "Barracks 3 to be free", "every Barracks to be free".
- The help dialog is a native dialog opened from a button beside the title, before the run bar in Tab order.
- Only the step-kind legend moves into the dialog; the per-chart pinned legend and hidden reorder help stay.

### Answer

## Q122: Approve the M11 design defaults 4/4: busy-building engine?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default took the smaller, reversible choice and lists what it gave up
research: reports/M11-research-3.md
thread: 1572015108069130390

You decide whether these busy-building engine picks match what you want; planning waits on it. Your research answer is separate. Each took the smaller, reversible choice.
- A busy-building wait counts as "prerequisite" in the API; no new wait value.
- A produce checks the busy building last, after population and resources, and reserves its cost meanwhile.
- A produce on several buildings starts only when all are free at once; the free ones idle meanwhile.
- Only the current step holds buildings; reactions hold none and treat held ones as busy.
- A building counts as free when nothing is paid in its queue, even if its order is waiting to pay.
- A research takes the first free building among its candidates, not always the first.
- A research never holds a building; it can take one the instant a unit ends.
- Prebuilt-build floors and caps are not regenerated; a measured miss stops the ticket.
- Auto-house demand still counts a held building's order (off by at most one unit's time).

### Answer
