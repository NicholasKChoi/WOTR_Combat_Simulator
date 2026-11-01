# BATCH-032 simplify pass 1 (SGS-032)

Branch sgs-032-aoe4-research-veterancy, base a714a23. Tip unchanged: 7e41e68.

## /simplify invocation
The skill was invoked via the Skill tool. Its instructions call for 4 parallel reviewer agents. I did not spawn them: I ran the four angles (reuse, simplification, efficiency, altitude) inline myself over the roughly 120 changed source lines (research.ts, the simulate.ts seams, docs). This was a single-agent inline review, not four agents.

## Changes
None. Nothing committed.

## Declined (with reason)
- Folding the duplicated `entry.age > state.age` checks (produce and payOrder in simulate.ts) into resolveUnitEntry: would change its exported semantics and add simulate.ts churn that SGS-031 rebases over.
- Replacing the cost-copy loop in researchHandler with a literal or Object.fromEntries: no clearer, and typing gets worse.
- Extracting RESOURCES/tolerance into a shared module: excluded by instructions (separate backlog item); the local Math.sqrt(Number.EPSILON) is deliberate.
- Comments: all existing comments state hidden constraints (tolerance, tier-at-pay, queue-length not consulted); none restate code.

## Tests
`npm ci` ok. `tsc` and `npm test` were not re-run because no files changed since the branch tip.

Final tip: 7e41e68
