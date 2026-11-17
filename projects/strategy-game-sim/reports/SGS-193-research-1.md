# SGS-193 research 1 (frame depth)

Question: for a `waiting` step whose own wait entry is also what it still waits for, does the run cell show the time and the tail (`Castle Age 20:00, still waiting for Castle Age`) or the tail only (`still waiting for Castle Age`)?

Sources read: reports/SGS-193-ticket-2.md (Open questions), design/M11.md B-W10 (lines 246-250) and the M11.5b acceptance row (line 147). No new facts gathered.

## What changes with the answer

- (a) Only the design's acceptance sentence changes. B-W10 line 248 already says "the entries as above, then `still waiting for <waitingForText>`", so the table gives the full text.
- (b) B-W10, the SGS-193 criteria, the design acceptance sentence and the unit rows all change. A new rule must define "same entry": `waitTargetKey` equality. That is wrong when keys match but the text differs, for example an `age` entry with no landmark against a `waitingFor` naming a landmark. There the entry would be dropped and the landmark text lost.

## Options

- A) Keep the table: the cell shows time spent and the tail, e.g. `Castle Age 20:00, still waiting for Castle Age`. Cost: slightly repetitive. Rules out nothing. Conflicts: none; only the design's acceptance sentence is corrected.
- B) Tail only: the cell reads `still waiting for Castle Age`. Cost: loses how long it already waited, and needs a key-match rule plus its mismatch case. Conflicts: B-W10 table, C17, and the knight acceptance text all change.

## Recommendation

A. It is the only option where the table, criteria and unit tests already agree, and the repeated name carries the 20:00 wait. B adds a rule with an edge case that can drop the landmark wording.

## Unknowns

Whether the owner prefers the shorter cell for looks. That is taste only the owner has.

## Board item (exact command; run from the factory dir, body on stdin)

```
bash -c 'python3 /home/choin/git/code-factory/bot/board.py /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/QUESTIONS.md add "question=Waiting step already counted for its wait: show the time too (Castle Age 20:00, still waiting for Castle Age)? Yes: keep time and tail" kind=decision blocks=SGS-193 "options=A) Show time and tail: Castle Age 20:00, still waiting for Castle Age; keeps how long it waited | B) Tail only: still waiting for Castle Age; shorter, loses the waited time, extra rule to get right" "recommendation=A: it matches the design table already, and the time is useful; B adds a rule that can drop the landmark name" research=reports/SGS-193-research-1.md' <<'"'"'EOF'"'"'
Only you can pick how a waiting step reads in the run cell; the step annotation work and its docs and tests wait on it, and so do the later docs tickets.
- Example: a knight step that waited 20:00 for Castle Age and is still waiting.
- A shows `Castle Age 20:00, still waiting for Castle Age`. B shows `still waiting for Castle Age`.
- B also needs a rule for when the two names differ (for example an age with no landmark versus one naming a landmark), so that case is handled separately.
EOF'
```

If `question=` with the board's tool does not take a quoted multi-word value in one shell word, the manager should adjust quoting; field values contain no newlines.
