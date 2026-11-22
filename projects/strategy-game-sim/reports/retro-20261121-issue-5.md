Title: board.py reads a second `### Answer` heading as the owner's answer, so the question is never posted

## Problem

`bot/board.py` `parse_item` takes everything after the first `### Answer` line as the answer. An item
with two `### Answer` headings (an empty answer, then a stray heading) therefore has the answer
`### Answer`, `status` reports it `answered`, and the bot never posts it.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim, 2026-11-18)

The manager filed Q144 (M12 design approval) by editing the Q141 block in place; the result had no
`thread:` line and two `### Answer` headings (QUESTIONS.md at state commit fe005993, lines 85 and 87).
`board.parse` on that file gives Q144 `answer == '### Answer'`. Run log `run-20261118-1851.md` 19:04:
"issue: Q144 shows status answered with an empty answer and no answered= stamp; not routed, treated as
open". The owner never saw it; the next pass (21:11) refiled it as Q145, answered at 21:53. M12
planning waited about 2.5 h.

## Suggested edit

In `parse_item`, strip leading `### Answer` lines from `answer_raw`, and have the board's check/status
command print `Q<n>: duplicate ### Answer heading` (exit non-zero) so the manager fixes the file. Add a
board test with the duplicated heading. Separately, manage.md could say to file every question with
`board.py` and never by editing another item's block.

Confidence is low: one occurrence, but the fix is mechanical and local.

Source: retro 2026-11-21 (WOTR_Combat_Simulator, strategy-game-sim, M12 close), Not acted on / low.
Report: `.claude/code-factory/projects/strategy-game-sim/reports/retro-20261121.md`.
