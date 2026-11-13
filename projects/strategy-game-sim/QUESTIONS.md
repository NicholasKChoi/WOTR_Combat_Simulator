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

next: Q66

## Q65: Text-editor compact mode: keep 48rem (864px) or move to 768px?
kind: decision
blocks: SGS-144 (Fix rem sizing that assumed a 16px root)
options: A) Move to 768px: matches design C14's intent; tablets keep the wide editor | B) Keep 48rem (864px): no change to shipped behavior; 768px tablets stay compact
recommendation: A: the design meant 768px; the 864px value is an accident of the 18px root
research: reports/SGS-144-ticket-1.md

SGS-144 (rem sizing that assumed a 16px root) is a lane bug. The app root is 18px, so the editor's 48rem compact threshold is 864px, not the 768px design M9 C14 intended.
- At 48rem a 768px tablet gets the compact editor; at 768px (~42.7rem) it keeps the wide editor.
- 1280x800 and 390px layouts are fine either way.

### Answer
