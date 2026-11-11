Run-log names and times must come from `date` (one clock, not UTC vs local); pick the open log by mtime

## Problem

`commands/manage.md` (Run log, ~94-111) names the log `run-<YYYYMMDD-HHMM>.md`, writes `HH:MM` entries,
and resumes "the newest run log without an `ended` line". Nothing says to read the clock, so the manager
invents times. Once one log has a future name, every later pass resumes into it.

## Evidence

- Five run logs named 21:50-23:00 have file mtimes of 13:47-17:28.
- One log records 23:30-07:50 for work actually done 18:27-19:15 (matching drive-log pass and a state commit at 22:44).
- A future-named log collected later entries out of order (21:51, 22:00, then 13:47).
- Retro windows and time metrics built from these logs are wrong.

- Likely cause, confirmed on this machine (`date` = PST, UTC-8): the clock-skewed names are UTC. E.g. `run-20261110-2150.md` mtime is 13:47 PST = 21:47 UTC, `run-20261110-2210`/`-2230` mtimes 13:49/13:50 PST = 21:49/21:50 UTC. The manager mixes UTC and local time, so "future" logs are really UTC-named while others are local-named; the `-2300` and `-2330` logs read as 23:00/23:30 UTC-style stamps too. The fix must pick one clock (local, from `date`) for both names and entries.

## Suggested edit

`commands/manage.md`, Run log:

```diff
-Create `reports/run-<YYYYMMDD-HHMM>.md` ...
+Create `reports/run-$(date +%Y%m%d-%H%M).md` ... Every `HH:MM` in the log comes from
+`$(date +%H:%M)` in the same command that appends the line; never write a time from memory.
-Resume the newest run log without an `ended` line.
+Resume the run log with the newest mtime (`ls -t reports/run-*.md | head -1`) if it has no `ended` line.
```
