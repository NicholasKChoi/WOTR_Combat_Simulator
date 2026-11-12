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

next: Q59

## Q58: Did the #138 preview pass the live-Blob version-save check (SGS-127)?
kind: repro
blocks: SGS-127 (Named-build update 412: weak CDN etag in compare-and-swap), SGS-128 (Shared test helpers and two jscpd gates), SGS-129 (Turn on strict in tsconfig)
options: A) Passed: saves 200, link loads | B) Failed: 503 weak etag (paste the log line)
recommendation: A: nothing to decide until you run it
research: reports/SGS-127-review-1.md
thread: 1570235520104271982

SGS-127 (named-build 412 fix) is ready as draft PR #138 but its ticket forbids merging until the live-Blob preview check passes; only you have Blob credentials. #139 and #140 are stacked on it.
- Open the #138 Vercel preview, save a named build, then Save a new version twice (revisions 2 and 3); open the named-build link.
- Pass: every save answers 200 and the link loads.
- Fail: any 503 with 'returned a weak etag' in the function log -> do not merge; the ticket goes back to needs_spec.
- On merge: delete debug/named-build-412-diagnostics (local and origin); the factory drops the BACKLOG bullet.

### Answer
