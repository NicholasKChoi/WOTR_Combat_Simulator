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

next: Q45

## Q39: M8 design: approve design/M8.md as written?
kind: confirmation
blocks: M8 (AoE4 workbench)
options: A) approve | B) change: <what>
recommendation: A: covers M8.1-M8.9 on save model B
research: design/M8.md
thread: 1569889602964295890

M8 design is written (design/M8.md, 534 lines); planning into tickets waits on approval.
- Save model B (Q37): named builds get a stable 22-char id and a ?n= link showing the latest version; editing needs an edit secret kept in the creator's browser; reads are no-store; old ?b= links keep working
- Routes: create, get, update (secret + If-Match revision), delete outside production only; openapi 2.5.0
- Per-browser 'my builds' list, '(edited)' marker, a discard guard so edits are never silently lost
- Collapsible/reorderable charts saved per browser, split-column scrolling, pinned-legend and step-table fixes, M8.6 correctness fixes, M8.7 test fixes, M8.8 shared helpers
- Later: per-version history links, export/import, shared edit rights, rename, delete all fit without breaking changes

### Answer

## Q40: M8: remove the snapshot 'Save build' (?b= link) button and keep only named builds?
kind: decision
blocks: M8 (AoE4 workbench)
options: A) only named builds in the UI: one kind of link, old links still work | B) keep a Share snapshot button too: frozen links available, two link kinds
recommendation: A: snapshots can come back with per-version history later
research: design/M8.md
thread: 1569889606407553086

With editable named builds, the page would have two kinds of saved link.
- A: Save only creates named builds; POST /builds and all existing ?b= links keep working
- B: also keep a 'Share snapshot' button that makes a frozen ?b= link

### Answer

## Q41: M8: write limit for named builds: share the 30/hour save limit, or a separate 60/hour?
kind: decision
blocks: M8 (AoE4 workbench)
options: A) shared 30/hour: one counter, same abuse limits | B) separate 60/hour: more headroom for frequent edits
recommendation: A: every save is a deliberate click
research: design/M8.md
thread: 1569889608727003289

Saves are rate-limited per client today (30/hour).
- A: one shared 30/hour counter covers snapshot saves, named creates and named updates
- B: a separate 60/hour counter for named writes

### Answer

## Q42: M8: cap the per-browser 'my builds' list at 50?
kind: decision
blocks: M8 (AoE4 workbench)
options: A) cap at 50: bounded, but evicted builds become read-only | B) no cap: never lose edit rights, unbounded list
recommendation: A: keeps the list usable
research: design/M8.md
thread: 1569889612757733516

The 'my builds' list (with each build's edit secret) lives in browser storage.
- A: keep the newest 50; the 51st evicts the oldest, which loses its edit secret (the link still works, read-only from this browser)
- B: no cap, limited only by browser storage quota

### Answer

## Q43: M8: let the creator delete a named build in production?
kind: decision
blocks: M8 (AoE4 workbench)
options: A) no delete in M8: less work, builds stay forever | B) creator delete + Remove control: tidy, extra route and UI
recommendation: A: not in the M8 criteria; can be added later without breaking changes
research: design/M8.md
thread: 1569889616016707684

Named builds have no delete in production in the design.
- A: no delete in M8; unused builds stay on the server like ?b= builds
- B: the creator can delete with the edit secret, plus a Remove control

### Answer

## Q44: M8: keep the build's link in the URL while editing it?
kind: decision
blocks: M8 (AoE4 workbench)
options: A) URL follows the selected build: a named link means latest version | B) drop the link once edited (current M6 rule)
recommendation: A: the discard guard covers reloads
research: design/M8.md

M6 dropped ?b= from the URL once the text was edited (OD-5a).
- A: the URL keeps ?n=/?b= of the selected build even while edited; reload asks before discarding edits
- B: keep OD-5a: drop ?n=/?b= once the text diverges

### Answer
