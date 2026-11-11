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

## Q45: Retro P1 (engine): never skip acceptance-test when a diff adds or edits acceptance specs?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: the only defect that reached main in M8 came through this gap
research: reports/retro-20261111.md

M8 retro. Nothing else runs end-to-end tests since f2c25b4, but the skip rules assume the implementer and suite do.
- SGS-113 (#123) merged a failing acceptance spec and needed SGS-126 to fix; SGS-118/126 also skipped; the suite ran full acceptance in 2 of 4 batches. Draft: reports/retro-20261111-issue-1.md

### Answer

## Q46: Retro P2 (engine): take run-log names and times from `date`, and pick the open log by mtime?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: cheap fix, makes the run log trustworthy
research: reports/retro-20261111.md

M8 retro. Run logs carry wrong timestamps, so later passes append to the wrong log.
- Five logs named 21:50-23:00 were written 13:47-17:28; one lists 23:30-07:50 for work done 18:27-19:15. Draft: reports/retro-20261111-issue-2.md

### Answer

## Q47: Retro P3 (engine): put batch report naming and the no-overwrite check in manage.md's launch prompt?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: repeat finding; the last fix landed in the wrong file
research: reports/retro-20261111.md

M8 retro. The previous retro's P4 went only into common.md, which simplify never reads.
- Reports named batch12-*/batch13-*; two simplify reports overwritten. Draft: reports/retro-20261111-issue-3.md

### Answer

## Q48: Retro P4 (engine): tell manage.md that worktree-cleanup EBUSY/EROFS and transient config.lock are not issue lines?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: cuts noise from the Factory issues section
research: reports/retro-20261111.md

M8 retro. Earlier proposals P5/P7 never reached manage.md, the file the manager writes from.
- 5 such noise lines in one run log. Draft: reports/retro-20261111-issue-4.md

### Answer

## Q49: Retro P5 (engine): make drive-loop.sh wait for the usage-limit reset instead of stopping?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: removes an avoidable human-stop
research: reports/retro-20261111.md

M8 retro. Hitting the 5-hour usage limit ended the drive loop.
- Happened once; factory sat idle ~3.5 h and it cost a human-stop. Draft: reports/retro-20261111-issue-5.md

### Answer

## Q50: Retro P6 (engine): in review.md, a test that cannot fail is never a note, and dictated preconditions must leave room to move?
kind: confirmation
blocks: retro-20261111
options: A) approve: file it as a GitHub issue on code-factory | B) reject: drop it
recommendation: A: recurring review gap
research: reports/retro-20261111.md

M8 retro. This recurred after engine issue #4.
- SGS-118 and SGS-120 reviews filed can't-fail tests as notes; on SGS-115 review dictated a test that still couldn't fail, so the rework repeated and the ticket went to re-spec. Draft: reports/retro-20261111-issue-6.md

### Answer

## Q51: Retro P7 (repo): add the AoE4 acceptance directory to .jscpd.json so the duplicate checker scans test setup?
kind: confirmation
blocks: retro-20261111
options: A) approve: add as a backlog item | B) reject: drop it
recommendation: A: lets the linter catch it before review
research: reports/retro-20261111.md

M8 retro. Copied acceptance test setup keeps causing rework. This is a code change, so it becomes a BACKLOG item for a ticket.
- SGS-120 and SGS-125 reworks; four copies already in BACKLOG.

### Answer

## Q52: Retro P8 (repo): add a LESSONS.md line: tests differing only in method/key/input use describe.each/it.each, and shared fakes are imported, not copied?
kind: confirmation
blocks: retro-20261111
options: A) approve: add the line to $FACTORY_DIR/LESSONS.md | B) reject: drop it
recommendation: A: one line, prevents repeat reworks
research: reports/retro-20261111.md

M8 retro. Same duplication evidence as P7.
- SGS-120 and SGS-125 reworks for copied tests/fakes.

### Answer

## Q53: Retro P9 (repo): in the REPO.md review checklist, apply the 60% sticky-area limit at 1280x720 too, and require the editor to keep >=50% of content width at 390px and 1280px?
kind: confirmation
blocks: retro-20261111
options: A) approve: edit the REPO.md checklist | B) reject: drop it
recommendation: A: matches the problems you found in the post-M8 UI check
research: reports/retro-20261111.md

M8 retro. Review filed a layout problem as a note that the owner later hit.
- SGS-125 review filed a 52% sticky bar at 1280x720 as a note; owner UI check found the editor pushed down ~140px and the step gutter taking ~260px of 390px.

### Answer

## Q54: Retro P10 (project): add a project LESSONS.md line: grep criteria use word boundaries, exclude test files, and name the paths searched?
kind: confirmation
blocks: retro-20261111
options: A) approve: add the line to the project LESSONS.md | B) reject: drop it
recommendation: A: four bounces from one cause
research: reports/retro-20261111.md

M8 retro. Spec-gate kept bouncing tickets on loose grep criteria.
- SGS-116, 118, 120 and 124 each bounced at spec-gate on a grep that matched tests or substrings.

### Answer
