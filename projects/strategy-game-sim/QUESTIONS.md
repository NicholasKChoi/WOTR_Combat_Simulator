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

next: Q57

## Q55: Approve the M9 exit criteria (SGS-127 fix plus your 2026-11-11 results/save UI asks)?
kind: confirmation
blocks: M9 (AoE4 workbench: version saves work in production, and the r…)
options: A) approve as drafted | B) change: <what to add, drop or split>
recommendation: A: covers SGS-127 first and every owner request filed 2026-11-11
thread: 1570188557195284520

M9 has no criteria yet; planning waits on your approval. Drafted from SGS-127 (production 412 on Save a new version) and your 2026-11-11 backlog asks. Full table: MILESTONES.md, section M9.
- M9.1 SGS-127 fix: Blob reads uncompressed for a strong etag; weak etag -> 503, not 412; distinct 412 logs; delete debug branch
- M9.2 evidence: you verify Save a new version on preview and production
- M9.3 Saved status + save controls on one row at 1280
- M9.4 drag handle + caret for charts; key-results panel collapsible
- M9.5 tooltip without pinned values; one dashed=pinned legend entry
- M9.6 villagers-per-resource view; production-buildings view (new simulator series)
- M9.7 marker labels follow hovered legend kind
- M9.8 editor gutter readable on narrow screens
- M9.9 docs, Playwright coverage, Tab-order pin, jscpd scans acceptance/

### Answer

## Q56: Which leftover backlog items join M9 besides the drafted criteria?
kind: confirmation
blocks: M9 (AoE4 workbench: version saves work in production, and the r…)
options: A) 1, 2, 4, 8 (save-path correctness next to SGS-127) | B) none | C) other: <numbers>
recommendation: A: they sit on the same Blob/named-build seam SGS-127 touches and are small; the rest are independent and can wait
thread: 1570188559862730791

These backlog items are NOT in the M9 draft. Pick any to add (they become planner outlines).
- 1: Blob put(allowOverwrite+ifMatch) on a missing key: verify against real Blob (same seam as SGS-127)
- 2: Blob outage: SDK retries x3 CAS attempts; lost-response retry reports conflict for a landed write
- 3: test-helper dedupe (fake Storage, stubFetch) + ARCHITECTURE helper list
- 4: readMyBuilds wipes all edit secrets on a parse failure
- 5: split-scroll scroll-anchoring jump; sticky run bar covers 52% at 1280x720
- 6: tsconfig strict:true
- 7: AoE4 data freshness CI job; provisional gather rates; English economy overlay gaps
- 8: design/M8.md text fixes (ReplyTarget.end, Escape focus)

### Answer
