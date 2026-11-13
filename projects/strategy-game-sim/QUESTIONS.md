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

## Q61: File engine issue: planner outlines name the owner of each shared test/spec/helper?
kind: confirmation
blocks: retro
options: A) file it: fewer sibling conflicts, one more planner field | B) skip: low evidence (3 cases)
recommendation: A: cheap, and conflicts cost a re-spec each (~$0.67)
research: reports/retro-20261112.md

Retro 2026-11-12 proposal 4 (engine, low confidence).
- Sibling tickets written in parallel claimed the same spec/helper: SGS-137/138, 133/132, 141/132.
- Fix: planner outlines name the owner of each shared test, spec and helper. Draft: reports/retro-20261112-issue-4.md

### Answer

## Q62: File engine issue: tech-lead delta mode on rerun after a one-task rework?
kind: confirmation
blocks: retro
options: A) file it: ~$1 saved per rerun | B) skip: reruns are rare, full rerun is safer
recommendation: B: only one occurrence, and tech-lead is the last human-risk check
research: reports/retro-20261112.md

Retro 2026-11-12 proposal 7 (engine, low confidence).
- After SGS-130's one-task rework, tech-lead re-read the whole 5-task batch (~$1 per rerun).
- Fix: tech-lead delta mode on rerun. Draft: reports/retro-20261112-issue-7.md

### Answer

## Q63: Run ticket re-specs on sonnet for one milestone (REPO.md models)?
kind: decision
blocks: retro
options: A) try it for M8: ~$2.6/milestone saved | B) keep opus: re-specs already bounce 80% first pass, sonnet may worsen it
recommendation: B: ticket quality is the main cost driver now; revisit after issues #18-#20 land
research: reports/retro-20261112.md

Retro 2026-11-12 proposal 8 (repo, low confidence).
- Opus ticket re-specs were 9% of window spend; 19 re-specs at ~$0.67 each.
- Change: add models: { ticket: sonnet } to REPO.md for one milestone; revert if the second spec-gate round bounces more.

### Answer

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
