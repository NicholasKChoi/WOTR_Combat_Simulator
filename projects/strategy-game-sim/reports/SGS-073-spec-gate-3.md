# SGS-073 spec gate 3

Verdict: READY.

Verified on origin/main (read-only):
- Parse: `start -> sheep` parses (parseStart accepts `->` plus NODE_TOKEN; sheep is a GATHER_NODE; the same line is used in existing specs). `produce <3000 a> from town-center` parses: ID regex has no length limit, producer `town-center` matches INSTANCE_REF, no truncation (quote() is only used on syntax errors).
- Validate: validate.ts:360 pushes `unknown-id` `unknown unit "<id>" in unit` with the full id, prefixed `line 2: ` through stepWhere when lines are passed. `cannot produce` is skipped when the unit is unresolved, and start.villagers is absent so no sum issue; so exactly one issue.
- M4 ordering: design/M4.md textToBuildOrder runs checkBuildOrder with lines before any POST; `checked` flag becomes true on the first Run click (runRejected clicks Run), so the check issue shows. nearestId threshold for a 3000-char id is 1000, no catalog id is that close, so no suggestion; still one issue. SGS-057 keeps the message text.
- Docs line `### Page` exists at docs/aoe4-build-order.md:762.

Notes (non-blocking): after SGS-057 the message is produced in schema.ts, not validate.ts line 360; the ticket's "on main" wording is correct today. Other checks (risk, invariants, deps, size, diagrams) unchanged from gate 2 and still hold.
