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

next: Q35

## Q27: Retro P2: a visible defect in UI the diff adds is blocking (NEEDS_SPEC if it conflicts with spec)
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830098314731612

Retro 2026-11-10 proposal 2 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- SGS-108 note on mid-word badge wrap shipped; seen again in M7 validation

### Answer

## Q28: Retro P3: launch prompts state the report path is the requested deliverable to write with Write
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830103066611872

Retro 2026-11-10 proposal 3 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- 16 agents returned without writing their report (was 2)

### Answer

## Q29: Retro P4: never overwrite a report; take next free n; name batch reports by ticket range
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830106128588801

Retro 2026-11-10 proposal 4 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- suite overwrote batch10-suite-1.md

### Answer

## Q30: Retro P5: spec-gate and ticket read code at origin/<base> after git fetch, not the main checkout
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830108800225301

Retro 2026-11-10 proposal 5 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- SGS-110 spec-gate read a stale tree; same as SGS-064

### Answer

## Q31: Retro P6: a rework caused only by rebasing onto a sibling is (rebase) and does not bump reworkCount
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830112076111934

Retro 2026-11-10 proposal 6 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- SGS-105 hit the rework cap on a post-rebase stale test; also SGS-093, SGS-102

### Answer

## Q32: Retro P7: treat EBUSY/EROFS on worktree remove/prune as deferred cleanup, not an issue
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830115049734145

Retro 2026-11-10 proposal 7 (engine layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- 5 issue lines over 2 runs; .git/worktrees are read-only sandbox mounts

### Answer

## Q33: Retro P8: LESSONS.md: Vitest CSS-module keys are proxies; pin visual state in Playwright via getComputedStyle
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830117977366638

Retro 2026-11-10 proposal 8 (repo layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- SGS-108 reworks 1-2; step-annotation.test.ts:33-39 cannot fail

### Answer

## Q34: Retro P9: REPO.md Tooling gaps: note sandbox read-only worktree mounts, push -u config lock, npm/Playwright cache EROFS
kind: confirmation
blocks: retro-20261110
options: A) approve | B) change: say what | C) reject
recommendation: A: evidence in the retro report
research: reports/retro-20261110.md
thread: 1569830121219821718

Retro 2026-11-10 proposal 9 (repo layer). Approve to apply; engine edits go to an agent in the code-factory repo.
- about 12 sandbox issue lines

### Answer
