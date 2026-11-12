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

next: Q64

## Q60: Run the SGS-130 live Blob test on PR #142 and send back the logged error class
kind: repro
blocks: SGS-130 (Blob store retry cap, landed write, live test), SGS-131 (My builds: no wipe on bad value, backup), SGS-134 (Chart layout model and key-results collapse), SGS-136 (Simulator emits production buildings, OpenAPI 2.6.0), SGS-140 (Compact text-editor mode below 48rem)
options: A) Done, output attached | B) Skip the live run and merge without it: risk is an unmapped Blob error class on ifMatch for a missing key
recommendation: A: the ticket requires the recorded class before merge
thread: 1570256157644296212
question: Run the SGS-130 live Blob test on PR #142 (Claude tried 2026-11-12: blocked, it may not pull Vercel credentials) and send back the logged error class

PR #142 (SGS-130) changes Blob store writes and needs one live run only you can do; the stack #143-#146 sits on it, so nothing merges until it is done (auto-merge held).
1. In the repo, check out branch sgs-130-blob-landed-write-retry-cap (PR #142).
2. Run: vercel env pull .env.local
3. Run: npm run test:blob-live
4. Reply with the error class the test logs for ifMatch on a missing key (expected BlobNotFoundError or BlobPreconditionFailedError), or the full output if it fails.
Then approve merging the stack; I will update the replaceNamed comment with the recorded class and date.

### Answer

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
