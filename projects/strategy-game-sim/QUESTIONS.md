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

next: Q126

## Q123: How should the 3 prebuilt builds be fixed under the literal idle-building rule?
kind: decision
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Reorder steps in 3 builds, add a blacksmith to Spear/Longbow: all bars kept, one pinned test re-pinned | B) As A but Spear/Longbow drops 4 Castle blacksmith researches: bars kept, build loses upgrades | C) No build edits, lower floors and bars: weaker guarantees
recommendation: A: keeps every bar and the builds' strength
research: design/M11.md
thread: 1572019025955921930

You chose the literal rule: a research waits for a fully idle building. Measured on a prototype, three prebuilt builds then miss their bars, so one of them needs a fix. Planning waits on this.
- Knight/Longbow (17 knights vs floor 23, farm-idle) and 1TC Council Hall (wood 3021 vs cap 2600, steps 49-55 unstarted, farm-idle) are fixed by reordering research steps only.
- Spear/Longbow (steps 73-78 unstarted at 20 min) cannot be fixed by reordering alone.
- Option A edits all three: Spear/Longbow gets a second blacksmith step and its first blacksmith trigger moves 950 s to 900 s. After the edits every floor, cap and bar passes (last Spear/Longbow step starts at 1181.7 s); its pinned gold test is re-pinned.
- Option B: as A, but Spear/Longbow drops its four Castle-age blacksmith researches instead (passes, last start 1179.1 s, build loses upgrades).
- Option C: no build edits; lower bars: knight floor 23 to 17, wood cap to at least 3100, two builds exempt from the 20 min all-steps-started and farm-idle bars.

### Answer

## Q124: Approve the M11 design defaults 4/4 (updated): busy-building engine?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: each default took the smaller, reversible choice
research: design/M11.md
thread: 1572019029118427166

You decide whether these busy-building engine picks match what you want; planning waits on it. Updated for your literal-idle answer (earlier approval of this item is void).
- A busy-building wait counts as 'prerequisite' in the API; no new wait value.
- A produce or research checks the busy building last, after population and resources, and reserves its cost meanwhile.
- A produce on several buildings starts only when all are free at once.
- Only the current step holds buildings; reactions hold none and treat held ones as busy.
- A building is free when nothing is paid in its queue (even if its order waits to pay); this now applies to researches too, so a research chain runs back to back.
- A research takes the first idle building among its candidates, so a second blacksmith runs a second research at once.
- The free test is one function in engine-common.ts, avoiding an import cycle.
- Floors are not lowered silently; build fixes follow your answer to the separate question.

### Answer

## Q125: Approve the M11 design defaults 1/4 (updated): unit lines, markers, pinned dots?
kind: confirmation
blocks: M11 (AoE4 workbench: readable results charts and clear step waits)
options: A) Approve: planning starts | B) Change something: reply with what and the design is revised
recommendation: A: pinned dots need no schema change and cost about 60 lines
research: design/M11.md
thread: 1572019656451948685

You asked why pinned runs get no upgrade dots. It was only a clutter choice; no schema change is needed, since the page already holds the pinned run's full result. The design now draws them.
- Upgrades show as a dot on the unit's line, not a vertical line each.
- The Units chart is one line per unit type (tiers summed); no per-tier view.
- Line names come from the server: the words the tiers share (Spearman, not Hardened Spearman).
- The upgrade-to-unit link rides on the marker, not on a catalog sent to the page.
- NEW: a pinned run also gets upgrade dots: dashed rings on its dashed line, in the pinned colour, no vertical lines. About 60 more lines of work.
- Hiding a unit line in the legend hides its dots, current and pinned; hiding the upgrade-marker kind does not hide the dots.
- The marker control keeps hover/focus labelling and adds click to hide a kind.
- All marker code moves into one module.

### Answer
