drive-loop.sh: wait for the usage-limit reset instead of stopping

## Problem

`scripts/drive-loop.sh` treats a pass that ends on the plan usage limit like any failed pass: retry once
after 60s, then stop with "stopped: pass failed; answers are still waiting". The limit will not clear in
60s, so the loop always stops and needs a human to restart it.

## Evidence

- A drive run had two consecutive passes end at 19:15 and 19:16 with "You've hit your 5-hour limit · resets 10pm".
  The loop stopped; the owner resumed by hand at 22:41, so about 3.5 hours were idle and a human-stop was spent.
- The first of those passes had already cost $32.5 of work before hitting the limit.

## Suggested edit

In `scripts/drive-loop.sh`, before counting a pass as failed:

```bash
if grep -qE "hit your .*limit" "$pass_log"; then
  reset=$(grep -oE 'resets [0-9]{1,2}(:[0-9]{2})?\s*(am|pm)' "$pass_log" | tail -1 | sed 's/resets //')
  target=$(date -d "$reset" +%s 2>/dev/null) || target=$(( $(date +%s) + 3600 ))
  now=$(date +%s); [ "$target" -le "$now" ] && target=$(( target + 86400 ))
  echo "$(date +%H:%M) usage limit; sleeping until $reset" >> "$drive_log"
  sleep $(( target - now + 120 ))
  continue   # does not count as a failure
fi
```

Cap the wait (for example 6 hours) and post one board note so the owner knows the loop is paused, not stopped.
