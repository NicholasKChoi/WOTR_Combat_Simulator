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

next: Q150

## Q147: SGS-209 follow-ups: 2 test-coverage nits
kind: decision
blocks: none
options: A) Keep defects only: both are nits, so both are deleted | B) Triage each: ask about each separately | C) Drop all
recommendation: A: neither shows wrong behavior; unit tests already cover both
priority: low
thread: 1572902433565315152

SGS-209 (rename API) left two test-coverage gaps in the backlog. Both are already covered by a unit test; neither is a wrong behavior today.
- Acceptance 'after 30 writes across the three routes' omits the rename route; a unit test covers the shared write budget.
- The API contract spec compares only example bodies, so a missing WWW-Authenticate header on the PATCH 401 is caught only by a unit test.
Both are nits (tests pinning behavior that already works).

### Answer

## Q148: SGS-212 follow-up: stale name in My builds after a race
kind: decision
blocks: none
options: A) Standalone bug: fix withMyBuilds to also keep the listed name | B) Standalone chore | C) Debug: cause unknown | D) Milestone | E) Docs | F) Drop: matches Q146, working as decided
recommendation: F: Q146 chose the stored name always wins, so this is probably the decided behavior; A only if the label can visibly go stale
priority: low
thread: 1572902436451127306

SGS-212 (rename UI, merged as #220) noted that withMyBuilds in components/apps/aoe4-build-order/build-library.ts keeps the stored name over the server name when the My builds read lands after a load, so a stale label can survive depending on arrival order.
- Your Q146 answer was 'always take the stored name', which this behavior may match; the implementer read it as a design-D17 inversion.
- Impact if real: a renamed build can show its old name in the library until the next reload.

### Answer

## Q149: M12.4: check repeat and rename in production, then run the M12 retro
kind: handoff
blocks: M12.4 (Owner checks the changes on the PR previews and then produc…)
options: A) Done | B) Not now
thread: 1572902464196186226

M12.1 to M12.3 are done and merged (#218 to #221). M12.4 is yours: check the changes in production.
- Repeat: enter a step with a trailing xN (e.g. 'build Farm from wood x9') in the paste text and the step table Repeat field; see the copies timed and annotated.
- Rename: rename one of My builds; the new name shows in the library and My builds, and an old link still opens.
- Then run the retro (/code-factory:manage strategy-game-sim retro).

### Answer
