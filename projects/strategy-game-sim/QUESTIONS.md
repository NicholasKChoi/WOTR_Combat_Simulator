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

next: Q15

## Q14: Main has 28 failing AoE4 acceptance tests. Re-pin them in a new ticket, and let SGS-095 pass on 'no new failures'?
kind: decision
blocks: SGS-095 (test hygiene follow-ups); SGS-097 (docs and issue messages)
options: A) New ticket to re-pin the 28 tests; reword SGS-095's criterion to 'no new failures vs main, touched specs pass': SGS-095 and SGS-097 keep moving; main stays red until the new ticket merges | B) Fold the re-pin into SGS-095: one PR makes acceptance green, but a hygiene ticket becomes a large pin refresh and needs re-spec and a rerun of every gate | C) Accept 28 failures as the baseline, no re-pin ticket: nothing to do now, but the pins stay stale and hide real regressions
recommendation: A: keeps SGS-095 small and gets main green in its own reviewable change
research: reports/SGS-095-implementer-1.md
thread: 1568322652396060937

SGS-095 (test hygiene) is built and committed, but its acceptance criterion 'npm run acceptance passes' cannot hold: 28 AoE4 Playwright tests already fail on main (9274372).
- All 28 are in AoE4 specs; none in combat-simulator or fight-api-caps (the files SGS-095 touches).
- Cause looks like the villager-target change in 9274372: e.g. spear/longbow startedAt is now 708.15, the spec pins 696.41; the 1200 s gold test fails too.
- The 200-body example test in aoe4-simulate-api-contract.spec.ts:284 is one of them (same cause).
- SGS-095's own checks pass: unit tests, tsc, schema mutation check, 70/70 flake repeat, and the inserted-rally mutation leaves timings unchanged (708.15 both ways).
- Re-pinning is outside SGS-095's scope; SGS-097 acceptance is also running against this baseline.

### Answer
