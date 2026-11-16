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

next: Q108

## Q105: Should the AoE4 page offer any way to see debug messages?
kind: decision
blocks: SGS-169 (Move not-simulated research notes to debug severity)
options: A) Hidden entirely: matches the backlog wording, simplest | B) A toggle to show debug messages: more UI, more tests
recommendation: A: matches what you asked for; a toggle can follow later
research: tickets/SGS-169-effect-not-simulated-debug-severity.md
thread: 1571757343706849350

SGS-169 moves the 'effect is not simulated' research notes to a new debug severity, hidden on the page. The ticket assumes hidden entirely.

### Answer

## Q106: How should the step annotation popover work from the keyboard?
kind: decision
blocks: SGS-170 (Custom hover popover for step annotations)
options: A) Show it for the caret's step line: no new focus targets | B) Make gutter lines focusable: more a11y work, new tab stops | C) Pointer only: simplest, no keyboard access
recommendation: A: reuses the caret-driven active step
research: tickets/SGS-170-step-annotation-hover-popover.md
thread: 1571757357321424906

SGS-170 replaces the native title on step annotations with a custom popover. You asked for it on hover and keyboard focus, but the gutter lines are aria-hidden and cannot take focus; the textarea caret already picks the active step.

### Answer

## Q107: How should the StarCraft helper design doc handle the map source and the unreachable all-struck case?
kind: decision
blocks: backlog:starcraft-doc
options: A) Doc states what the code does, says source/season is not recorded, and calls all-struck unreachable via the UI: no invention | B) You give the map pool source and season and the player list source, doc records them | C) Drop the item: app is frozen
recommendation: A: documents truth without inventing a source
research: reports/SGS-175-ticket-1.md
thread: 1571757360060571700

The docs/starcraft-helper.md item cannot be ticketed without facts the code lacks. pages/apps/starcraft-helper.js hard-codes 3 players and 9 maps with no source or season. getMapText returns FAILURE when all maps are struck, but the UI caps strikes at 3 of 9, so it is unreachable (INVARIANTS H2). The app is frozen.

### Answer
