Title: graph.sh: refuse status=rework without a new `## Rework` section in the ticket

## Problem

`commands/manage.md` "Rework in place" step 1 appends `## Rework N - <date> (<gate>)` to the ticket
before the row goes to `rework`. In two manager sessions on 2026-11-12 the manager skipped it six times.
It passed the gate's findings to the implementer in the launch prompt and set the row with `graph.sh`.
Nothing ties the status change to the ticket, so the skip costs nothing at the time. Later:

- the ticket no longer says why the code changed, and the implementer's "if it has `## Rework` sections,
  this is a corrective pass" check has nothing to read;
- `reworkCount` drifts. SGS-153's text-only rework was counted, and SGS-147's review rework was not.
  The `reworkCap` and `respecThreshold` decisions read that count.
- retro has to rebuild reworks from run logs.

## Evidence (WOTR_Combat_Simulator, strategy-game-sim)

- run-20261112-1339: SGS-135 (13:59), SGS-139 (14:42), SGS-137 (14:44) review reworks; no section in any
  ticket; graph reworkCount 1 each.
- run-20261112-2038: SGS-147 review rework (20:51, reworkCount empty), SGS-152 rebase rework (20:59),
  SGS-153 text rework (21:02, reworkCount 1). No sections.
- run-20261115-1308: all four reworks (SGS-156 R1, SGS-157 R1-R3) were written correctly.

## Suggested edit

`scripts/graph.sh set <id> status=rework ...`: read the row's `ticket` cell (relative to the graph's
directory). Count headings matching `ticket-lint.py`'s `REWORK_RE`, split into counted (no `, text`, gate
not `rebase`) and uncounted. Refuse with exit 1 and
`status=rework needs a new "## Rework N - <date> (<gate>)" section in <ticket> (manage.md Rework in place)`
unless one of these holds:
- the counted headings equal the new `reworkCount` (when the same call sets it), or
- the total headings exceed the count recorded the last time the row entered `rework`. Store that count
  in a hidden column, or compare against the ticket's git HEAD version if no column is wanted.

The first rule alone catches every case above, and also flags a text or rebase rework that bumped
`reworkCount`. Add a manage.md line under step 2: "graph.sh refuses `rework` until step 1 is done."

Source: retro 2026-11-15 (WOTR_Combat_Simulator, strategy-game-sim), pattern 3.
