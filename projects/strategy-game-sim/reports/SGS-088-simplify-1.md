# SGS-088 simplify 1
New tip: see `git rev-parse --short HEAD` on sgs-088-aoe4-workbench-ui-state-kept (one commit on 3b0bd18).
Changed: moveStep made generic (inRange takes unknown[]); moveFlag removed and the flag moves use moveStep (its tests now call moveStep); dropped dead `open[index] ?? false` in step-table.tsx (open is always one entry per step).
Results: tsc clean, lint:dup pass, npm test 1488 passed / 10 skipped. Comments reviewed: none to trim. Not pushed.
