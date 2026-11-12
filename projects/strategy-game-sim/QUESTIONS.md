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

next: Q60

## Q59: SGS-130: how should bumpCounter handle the landed-write check (it lets parallel saves beat the rate limit)?
kind: decision
blocks: SGS-130 (Blob store retry cap, landed write, live test), SGS-131 (My builds: no wipe on bad value, backup), SGS-134 (Chart layout model and key-results collapse), SGS-136 (Simulator emits production buildings, OpenAPI 2.6.0), SGS-140 (Compact text-editor mode below 48rem)
options: A) Drop the read-back check from bumpCounter only: a lost response to a landed write costs at most one extra count (safe side); create and replaceNamed keep it | B) Add a random per-write nonce to the counter JSON so identical text proves the write was ours: keeps the check, but touches the memory and file stores sharing nextCounter and is larger
recommendation: A: simplest, fails safe toward the limit, no store-contract change
research: reports/batch-SGS-130-SGS-140-tech-lead-1.md
thread: 1570246028815503394
answered: 2026-11-12T01:31Z discord

SGS-130's tech-lead gate found that the new landed-write check in bumpCounter lets parallel saves from one client bypass the 30-per-hour save rate limit, and blocks the whole batch (no PRs opened; SGS-131/134/136/140 are stacked above it). Report: reports/batch-SGS-130-SGS-140-tech-lead-1.md
- Counter value is only {windowStart,count}; N parallel saves all read k and write k+1, one wins, the rest read back identical text, count as landed: all N saves allowed, counter +1.
- Before the change a 412 re-read and recounted or ended contended. design/M9.md:521,526 (owner-approved) asked for the check on the counter; its reasoning holds for builds, not a counter.
- Test blob-build-store.test.ts:322-332 asserts the current behavior; design rows M9.md and ARCHITECTURE.md storage row need updating either way.

### Answer
A) Drop the read-back check from bumpCounter only: a lost response to a landed write costs at most one extra count (safe side); create and replaceNamed keep it
