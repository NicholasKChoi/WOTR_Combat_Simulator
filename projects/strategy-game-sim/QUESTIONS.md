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

next: Q38

## Q36: Confirm the M8 exit criteria (M8.1-M8.9)?
kind: confirmation
blocks: M8 (AoE4 workbench: iterate on builds, tidy results, and pay do…)
options: A) approve as drafted | B) change: <what to add, drop or reword>
recommendation: A: matches the scope you picked in Q35
thread: 1569885907614703628
answered: 2026-11-11T01:26Z discord

M8 cannot start design until you confirm its exit criteria (drafted from your Q35 pick C plus the build-iterate and chart items).
- M8.1 start from a build and iterate (no prebuilt framing, edited marker, never lose edits, named copies, my builds list)
- M8.2 collapsible + reorderable charts, remembered per browser
- M8.3 build order and results columns scroll separately; consistent heading sizes
- M8.4 pinned legend: explain pinned once, each series once
- M8.5 step-table readability (time labels, Waited 0:00, badge/select truncation, editor scroll)
- M8.6 correctness bugs (?b= query keys, VERCEL_ENV fail-closed, save rate-limit counter, test env, sendReply typing, README)
- M8.7 tests that cannot fail are fixed; M8.8 duplicated helpers and doc text fixed; M8.9 docs + Playwright
- Left in backlog: data freshness CI, gather rates, English tech gaps, SGS-098 removed coverage, 360x760 flake, smoke-script hardening
Full table: MILESTONES.md, section M8.

### Answer
A) approve as drafted

## Q37: M8 saved builds: immutable links plus a per-browser 'my builds' list, or editable named builds on the server?
kind: decision
blocks: M8 (AoE4 workbench: iterate on builds, tidy results, and pay do…)
options: A) immutable links + per-browser my-builds list: least work, links never change, list is per browser | B) editable named builds on server: one link per build that updates, but edit secrets, new route, links can change | C) A plus export/import of the list: A's model, list movable across devices, small extra UI
recommendation: A: keeps every link stable and needs no server change; C1 can be added later
research: reports/M8-research-1.md

M8.1 (start from a build and iterate) needs a save model before design. Today a save is an immutable content-addressed ?b=<id> link with an immutable cache header.
- A: no server or API change; every link an agent hands you stays valid forever; the list lives in one browser
- B: needs a random id, an edit secret, a PUT route, an openapi change, and dropping the immutable cache; a shared link can change under you
- C1 adds export/import of the list (JSON) so it can move between devices

### Answer
