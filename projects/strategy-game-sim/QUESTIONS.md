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

next: Q137

## Q134: Run /code-factory:upgrade (optional migrations 007, 008)?
kind: handoff
blocks: none
options: A) Done | B) Not now
recommendation: B: nothing waits on it
thread: 1572328649590439966

Two optional state migrations (007 upgrade-auto, 008 rescan-issues) are pending; the factory runs fine without them.
- Run /code-factory:upgrade in a Claude Code session in the code repo (not blocking anything).

### Answer

## Q136: Merge PR #210 (aria-pressed legend fix)?
kind: handoff
blocks: SGS-201 (Series legend aria-pressed means shown)
options: A) Done: merged | B) Not now
recommendation: A: low risk, all gates passed

PR #210 (SGS-201, series legend aria-pressed fix, merge risk low) passed every gate but was not auto-merged: REPO.md has babysit false, so checks-evidence.sh finds no logged GREEN and never qualifies a PR. Merge it from GitHub once the Vercel preview is green, or set babysit: true.

### Answer
