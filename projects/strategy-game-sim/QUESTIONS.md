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

next: Q147

## Q146: When another tab refreshes My builds, keep this tab's newer build name? Yes: only take the stored name if it is not older
kind: decision
blocks: M12 outline E (rename UI)
options: A) Keep the newer name: take the stored name only if its revision is not older than the one this tab loaded | B) Always take the stored name: simpler, but an unrelated write from another tab can put an old name back on the label
recommendation: A: one small check prevents the wrong name showing, and no new data is needed
research: reports/M12-research-6.md
priority: low
thread: 1572854041749360770

Only you can pick how much edge-case polish the rename box gets; the rename screen (outline E) waits on it. The rule matters only in two rare cases:
- This tab renamed a build but saving the new name in the browser failed; then another tab of the same browser saves something unrelated. Always-take-stored (B) shows the old name again.
- The build was renamed in another browser; this tab shows the server's newer name, but the browser's stored list still has the old one. A write from another tab again brings back the old name under B.
A adds one revision comparison; B ships the design as written. Either way the saved build itself is never changed, only the label shown.

### Answer
