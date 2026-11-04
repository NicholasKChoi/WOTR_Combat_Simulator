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

next: Q12

## Q10: SGS-088: picking Text/Table while on Results - switch to the Build tab, or disable the toggle on Results?
kind: confirmation
blocks: SGS-088 (Keep step-table row state and let a failing stored pin be d…)
options: A) Switch to Build: the click always does something visible | B) Disable toggle on Results: no surprise tab jump, but a dead control
recommendation: A: ticket default; keeps the toggle useful from any tab
research: reports/SGS-088-spec-gate-1.md
thread: 1567561776973877268

SGS-088 (keep step-table row state, drop a failing stored pin) Scope 2: the Text/Table view toggle is visible while the Results tab is open.
- Picking a view there has to do something; the ticket defaults to jumping to the Build tab.

### Answer

## Q11: SGS-085: drop the step index from check issues when a paste line fails to parse?
kind: confirmation
blocks: SGS-085 (Polish text editor issue reporting)
options: A) Drop it: no index pointing into a hidden partial order | B) Keep it: same shape as other issues, but the index is meaningless to callers
recommendation: A: nothing reads it, and a wrong index is worse than none
research: reports/SGS-085-ticket-2.md
thread: 1567561779394121728

SGS-085 (polish text editor issue reporting) re-spec added one rule the gate did not ask for.
- When a pasted line fails to parse, the check issues for the other lines would carry a step index into a partial order the caller never sees.
- Nothing in pages, components or lib reads issue.step today.

### Answer
