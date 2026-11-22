Title: drive-loop: after a usage-limit pause, resume the limited session so stopped agents continue instead of restarting

## Problem

When a drive pass hits the plan usage limit, `scripts/drive-loop.sh` (lines 205-218) waits for the
reset and runs a new `claude -p` pass. Agents of the limited pass stop with a task-notification that
says "This agent's work so far is saved ... send the agent a message (SendMessage) to let it continue
from where it stopped instead of starting a new agent." The new pass is a new session and cannot
address them, so it relaunches each from scratch: a relaunched agent re-reads the profile, the ticket
and the uncommitted checkout, and costs about twice the lost run.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim)

- 2026-11-18 22:41 (drive log `reports/drive-20261118-2153.md` pass 3, session ed308d4d): the SGS-208
  implementer (opus, high risk, $2.68 spent, uncommitted work in its checkout) and the SGS-209 review
  (opus, $0.70) stopped on the limit. Run log `run-20261118-2223.md` 22:52: "SGS-208 implementer
  interrupted (uncommitted partial work, no report) -> relaunch on same branch (opus)". The relaunch
  cost $5.31, the review relaunch $1.15.
- 2026-11-16 21:23 (retro 2026-11-18, Not acted on): the SGS-190 opus and SGS-195 implementers, $2.90
  lost; the SGS-190 relaunch cost $5.10 with the old work in its checkout.

## Suggested edit

In `drive-loop.sh`, when `limit_reset` fires, record the pass's session id from the stream (the
`session_id` of the `system`/`result` event). After the wait, run
`claude -p --resume <session> "The usage limit has reset. Continue each agent that stopped on the limit
with SendMessage, then continue this drive pass."` instead of a fresh `/code-factory:manage` pass, once;
fall back to a fresh pass if the resume fails. Verify first, in a throwaway session, that a resumed
`-p` session can SendMessage a subagent that stopped on a 429; if it cannot, the fallback is the
implementer committing work in progress (`wip:` commits on its local branch) so a relaunch can read
the diff instead of re-deriving it.

Confidence is low: two occurrences and a clear cost, but the resume mechanism is untested.

Source: retro 2026-11-21 (WOTR_Combat_Simulator, strategy-game-sim, M12 close), pattern 2. Report:
`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261121.md`.
