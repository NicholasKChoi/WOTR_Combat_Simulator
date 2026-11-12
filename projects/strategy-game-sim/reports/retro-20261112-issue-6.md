Title: drive once: end the pass after a batch gate completes

## Problem
drive-loop.sh relaunches a fresh pass until one changes nothing, and each pass reads its state from
files, but a pass does not stop at natural boundaries. In project strategy-game-sim, drive-1641 pass 2
ran 72 minutes and 182 manager calls through two batch chains, the SGS-132 needs_spec chain and the
SGS-130 tech-lead chain; manager context grew from 60k to 232k tokens and the manager alone cost about
$4.1 of the $34.10 pass. Another session (399e6fb7) cost about $2.5 the same way.

## Suggested edit
commands/manage.md, drive-once section:

```diff
+End the pass (after recording state) when a batch gate finishes or PRs open, or once the session
+has made about 80 tool calls; the loop starts a fresh pass from the files. Do not end it while a
+launched agent is still running.
```

Estimated saving $1.5-2 per long pass.
