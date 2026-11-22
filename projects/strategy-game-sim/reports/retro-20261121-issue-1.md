Title: Drive passes still end their turn with a background agent running (regression of #17)

## Problem

`commands/manage.md:176-180` says a drive pass must never end its turn while a background agent runs,
because `claude -p` kills it about 10 minutes later. The same paragraph also says "Launch an agent in the
foreground when no other agent is running", so every agent launched while another one runs goes to the
background. When the pass handles one background agent's result and writes a summary, that text ends
the turn, and the remaining background agents die. The rule names nothing the manager can check, so it
does not fire. #17 was closed with this rule; the 2026-11-18 retro's regression note was posted as a
comment on the closed issue, so nothing tracked it, and it recurred.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim)

- 2026-11-19 00:30 (drive log `reports/drive-20261118-2153.md` pass 4, session e2f2a8ee): the
  SGS-211 acceptance-test agent was launched in the background at 00:18 while the SGS-212
  acceptance-test was running. SGS-212's returned at 00:20:41, and the manager ended the pass at
  00:20:46 with "I'm holding it for SGS-211's acceptance run so both go through the batch gate
  together." The SGS-211 agent's transcript stops at 00:30:46, the session's end, and its
  `subagents/*.meta.json` has `finished: null`. Pass 5 relaunched it (run log `run-20261118-2325.md`
  "00:31 resumed after interruption"): $0.55 lost, $0.84 relaunch, ~13 min.
- Earlier, same cause (2026-11-18 retro, pattern 2): the M11 designer (11-16 14:14, $2.85 lost) and the
  SGS-192 and SGS-197 implementers (11-16 22:27, relaunched 12 h later at $5.40 and $1.66).
- Counter-evidence that the foreground form works: pass 5 (session 708f5bc8) launched all 7 of its
  agents in the foreground and lost none.

## Suggested edit

1. `commands/manage.md` (the paragraph at 176-180):
```diff
-In a drive pass (`CODE_FACTORY_DRIVE_PASS=1`), `claude -p` kills a background agent about 10 minutes
-after the pass ends its turn. Launch an agent in the foreground when no other agent is running.
-Launch parallel agents together in one message, except the ticket stage, whose agents launch in the
-same-file order `pipelines/standalone.md` and `pipelines/docs.md` state. Never end the pass's turn while one is still
-running: wait for each background agent's result first.
+In a drive pass (`CODE_FACTORY_DRIVE_PASS=1`), `claude -p` kills a background agent about 10 minutes
+after the pass ends its turn, and any text reply ends the turn. So a drive pass never uses
+`run_in_background` for an agent: it launches every agent in the foreground, and agents that can run
+in parallel together in one message, which blocks until all of them return (the ticket stage keeps
+the same-file order `pipelines/standalone.md` and `pipelines/docs.md` state). Gates that become ready
+while a group runs start in the next group.
```
2. `scripts/drive-loop.sh`: after each pass, read the pass session's
   `~/.claude/projects/<cwd-slug>/<session>/subagents/*.meta.json` and count entries whose `finished`
   is not `true` (or, from the stream, async launches with no matching task-notification). When the
   count is non-zero, append `issue: pass ended with <n> agents unfinished (<descriptions>)` to the
   drive log and treat the pass as `changed=yes`, so the next pass picks the work up at once. Add a
   drive-loop test with a fake stream that has one unfinished agent.

Side effect: less pipelining inside a pass (a review cannot start while another ticket's implementer
runs unless they launch together). Pass 5 above ran its two batches serially in 42 minutes with no loss.

Source: retro 2026-11-21 (WOTR_Combat_Simulator, strategy-game-sim, M12 close), pattern 1. Report:
`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261121.md`.
