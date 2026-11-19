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

next: Q146

## Q145: Approve the repeat-a-step and rename-a-build design with its 17 defaults? Yes: M12 planning starts
kind: confirmation
blocks: M12 (AoE4 build editing: repeat a step, rename a saved build)
options: A) Approve design and defaults: M12 planning starts | B) Change something: planning waits, reply with which numbered default or part
recommendation: A: the defaults are the smallest change and keep shipped results unchanged
research: reports/M12-research-4.md
priority: high
thread: 1572841677545283664

Only you can accept these product choices; M12 cannot be planned until you do. Your earlier approval reply arrived empty, so it is asked again. Rename placement and copy display are decided (both A).
- 1. Repeat works on build and move steps only. Produce already has a count; research, rally and pause are rejected.
- 2. Every copy is exact, including its trigger, so "when wood >= 75 build farm x9" waits for 75 wood before each farm.
- 3. In pasted text, "x9" must be the last word of a build or move line (build farm from wood x9).
- 4. Repeat is 1 to 200, and x1 is valid and kept as typed.
- 5. Total steps after repeats are capped at 200, the same cap as today.
- 6. Each copy gets its own timing in the results, tagged with its step number and copy number.
- 7. A repeated row is highlighted as a long wait when its summed wait reaches 60 s.
- 8. Hovering a repeated row shades one span: first copy start to last copy end.
- 9. Rename is a new request that sends only the name, and works even for builds the current game data would reject.
- 10. Rename needs the edit secret and the current version, counts as a save, and a racing save or rename is refused as a conflict.
- 11. The rename form closes as soon as you submit; a failure shows as an error message.
- 12. After a rename the save row shows the same link with the status "Renamed".
- 13. A pinned build keeps the name it was pinned with.
- 14. Repeat is an optional table field under More options, like walk time.
- 15. The built-in builds are not rewritten to use repeat, so their results are unchanged.
- 16. The server trims spaces around a new name instead of rejecting it.
- 17. Choosing one of My builds always shows the name stored on the server, which fixes stale labels.

### Answer
