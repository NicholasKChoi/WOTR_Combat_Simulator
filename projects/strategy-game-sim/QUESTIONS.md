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

next: Q55

## Q47: Retro P3 (engine): put batch report naming and the no-overwrite check in manage.md's launch prompt?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: repeat finding; the last fix landed in the wrong file
research: reports/retro-20261111.md
thread: 1570126548529320070

M8 retro. The previous retro's P4 went only into common.md, which simplify never reads.
- Reports named batch12-*/batch13-*; two simplify reports overwritten. Draft: reports/retro-20261111-issue-3.md

### Answer

## Q48: Retro P4 (engine): tell manage.md that worktree-cleanup EBUSY/EROFS and transient config.lock are not issue lines?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: cuts noise from the Factory issues section
research: reports/retro-20261111.md
thread: 1570126552522424453

M8 retro. Earlier proposals P5/P7 never reached manage.md, the file the manager writes from.
- 5 such noise lines in one run log. Draft: reports/retro-20261111-issue-4.md

### Answer

## Q49: Retro P5 (engine): make drive-loop.sh wait for the usage-limit reset instead of stopping?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: removes an avoidable human-stop
research: reports/retro-20261111.md
thread: 1570126558809686126

M8 retro. Hitting the 5-hour usage limit ended the drive loop.
- Happened once; factory sat idle ~3.5 h and it cost a human-stop. Draft: reports/retro-20261111-issue-5.md

### Answer

## Q50: Retro P6 (engine): in review.md, a test that cannot fail is never a note, and dictated preconditions must leave room to move?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: recurring review gap
research: reports/retro-20261111.md
thread: 1570126570704732201

M8 retro. This recurred after engine issue #4.
- SGS-118 and SGS-120 reviews filed can't-fail tests as notes; on SGS-115 review dictated a test that still couldn't fail, so the rework repeated and the ticket went to re-spec. Draft: reports/retro-20261111-issue-6.md

### Answer

## Q51: Retro P7 (repo): add the AoE4 acceptance directory to .jscpd.json so the duplicate checker scans test setup?
kind: confirmation
blocks: retro-20261111
options: A) approve: add as a backlog item | B) reject: drop it
recommendation: A: lets the linter catch it before review
research: reports/retro-20261111.md
thread: 1570126575691763772

M8 retro. Copied acceptance test setup keeps causing rework. This is a code change, so it becomes a BACKLOG item for a ticket.
- SGS-120 and SGS-125 reworks; four copies already in BACKLOG.

### Answer

## Q52: Retro P8 (repo): add a LESSONS.md line: tests differing only in method/key/input use describe.each/it.each, and shared fakes are imported, not copied?
kind: confirmation
blocks: retro-20261111
options: A) approve: add the line to $FACTORY_DIR/LESSONS.md | B) reject: drop it
recommendation: A: one line, prevents repeat reworks
research: reports/retro-20261111.md
thread: 1570126578883633362

M8 retro. Same duplication evidence as P7.
- SGS-120 and SGS-125 reworks for copied tests/fakes.

### Answer

## Q53: Retro P9 (repo): in the REPO.md review checklist, apply the 60% sticky-area limit at 1280x720 too, and require the editor to keep >=50% of content width at 390px and 1280px?
kind: confirmation
blocks: retro-20261111
options: A) approve: edit the REPO.md checklist | B) reject: drop it
recommendation: A: matches the problems you found in the post-M8 UI check
research: reports/retro-20261111.md
thread: 1570126581438091357

M8 retro. Review filed a layout problem as a note that the owner later hit.
- SGS-125 review filed a 52% sticky bar at 1280x720 as a note; owner UI check found the editor pushed down ~140px and the step gutter taking ~260px of 390px.

### Answer
