Title: Allocate report paths with a script, not by hand (repeat after #11)

## Problem

`commands/manage.md` asks the manager to name every report as `<id>-<agent>-<n>.md` "with the next free
`n` (check with `test -e`; never overwrite)", and the launch prompt (from #11) tells the agent "If that
path exists, use the next free n". In one lane run both failed. The manager passed `-1` for the first
re-spec of six tickets, and the ticket agents overwrote their earlier reports. The agent had just read
its own previous report as re-spec context, which satisfied the Write tool's read-before-overwrite
guard, so nothing stopped the overwrite.

## Evidence (WOTR_Combat_Simulator, strategy-game-sim, run-20261112-2038)

- `reports/SGS-147-ticket-1.md`, `SGS-151-ticket-1.md`, `SGS-153-ticket-1.md`, `SGS-154-ticket-1.md` and
  `SGS-155-ticket-1.md` each have two commits: fa87714 (the original ticket report) and 9311ee9 (re-spec 1
  written over it). The originals survive only in git history.
- SGS-144 has three `## Re-spec` sections and one ticket report.
- From 2026-11-13 on the numbering was right (SGS-156 ticket-1..6, SGS-157 ticket-1..2).

## Suggested edit

Add `scripts/report-path.sh <PROJECT_DIR> <id> <agent>`. It prints
`$PROJECT_DIR/reports/<id>-<agent>-<n>.md` for the lowest `n` with no file, and creates the file empty
(`: > path`, under `set -o noclobber`) so two launches in one wave cannot pick the same `n`. In
manage.md, replace "with the next free `n` (check with `test -e`; never overwrite)" with "from
`report-path.sh` (never by hand)". Agents keep `test -s`. The existing empty file then signals "not yet
written", so manage.md's missing-report check becomes `test -s`, which it already is.

Source: retro 2026-11-15 (WOTR_Combat_Simulator, strategy-game-sim), pattern 4.
