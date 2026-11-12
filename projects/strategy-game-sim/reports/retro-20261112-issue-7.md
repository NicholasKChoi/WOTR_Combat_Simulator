Title: tech-lead: delta mode on rerun after a one-task rework

## Problem
Review gained a delta mode in 75ab002; tech-lead has none. In project strategy-game-sim, batch
SGS-130..SGS-140 tech-lead 1 blocked only SGS-130 (bumpCounter); after its rework the rerun re-read
all five tasks (about $1.5 real, about $1 more than a delta).

## Suggested edit
agents/tech-lead.md: "On a rerun whose prompt names the prior report and the reworked tasks, review
only those tasks' new diffs plus the stack check (restack, cross-task interactions with the changed
files); carry the other tasks' verdicts from the prior report." commands/manage.md passes the prior
report path and reworked task ids on rerun.

Confidence low: one occurrence; the delta must still catch a cross-task effect of the rework.
