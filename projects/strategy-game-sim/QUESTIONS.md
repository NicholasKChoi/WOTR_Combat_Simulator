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

next: Q58

## Q57: Approve the M9 design with its six recommended choices (all A)?
kind: confirmation
blocks: M9 (AoE4 workbench: version saves work in production, and the r…)
options: A) approve, all six as recommended | B) change: <number and choice, e.g. 2B>
recommendation: A: each A keeps the bounds in the criteria (1280x800, data-driven buildings) and needs no new infra
thread: 1570209467323129866

The M9 design (contracts C1-C14 for M9.3-M9.13) is ready; planning waits on its approval and six choices. Design: design/M9.md (Owner decisions section).
- 1 Production buildings (M9.6): A any building that produces a unit in the data, incl. town center and landmarks (rec) | B military only (hand list)
- 2 Editor at 1280x800 (M9.8): A compact mode below 48rem: finish time in gutter, 8ch annotations, 0.875rem font (rec) | B a Times toggle
- 3 Save status lifetime (M9.3): A shown while the link panel shows (rec) | B clears after 5s
- 4 Blob retry cap (M9.10): A VERCEL_BLOB_RETRIES=1 set in code when unset (rec) | B 0 via Vercel env
- 5 Live Blob check (M9.10): A you run vercel env pull + npm run test:blob-live once on the PR and paste output (rec) | B give agents a preview-only Blob token
- 6 Collapsed key-results panel (M9.4): A pin/unpin stay visible in header (rec) | B only heading and caret

### Answer
