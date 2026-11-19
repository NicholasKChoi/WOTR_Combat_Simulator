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

next: Q142

## Q141: Start the build-editing milestone with repeat-a-step and rename-a-build? Yes: work begins
kind: confirmation
blocks: M12 (AoE4 build editing: repeat a step, rename a saved build)
options: A) Confirm: repeat a step and rename a saved build, nothing else yet | B) Swap in a different backlog item: reply with which one | C) Change the scope: reply with your edits
recommendation: A: it is exactly your two 2026-11-13 requests, and the rest waits cleanly
research: reports/M12-research-1.md
priority: high
thread: 1572798906327367803

You decide which backlog requests the next milestone covers; M12 (build editing) does not start until you confirm. Both of your 2026-11-13 requests are in it:
- Repeat a step: one step can say "build Farm from wood x9" instead of nine identical steps. Works in the build text, the editor and the API, and the simulation runs it as nine separate timed steps. Old builds and saved links must give the same results.
- Rename a saved build: the My builds list renames a build in place, with no copy. The new name shows everywhere, old links keep working, and a stale or clashing save is reported, not lost.
- Also in scope: docs updated, browser tests for both, and you check the PR previews and then production.
- Left for later: sim accuracy and gather rates, patch tracking, English tech gaps, spread of outcomes.

### Answer
