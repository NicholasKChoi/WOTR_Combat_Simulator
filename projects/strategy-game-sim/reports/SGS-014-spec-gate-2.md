# SGS-014 spec gate 2

Verdict: READY.

All three gaps from reports/SGS-014-spec-gate.md are closed in respec 3:
1. Test expectations. Re-derived from the upstream technologies/all.json at e89f01e. `fitted-leatherwork-2` has effects [meleeArmor] only. `armor-clad-3` (en) has [rangedArmor, meleeArmor]. `professional-scouts-2` (en) has [huntCarryCapacity, rangedAttack]. These match the ticket's expectations.
2. Hand-value count. "At least 71" is stated with its breakdown: 44 in base.json and 27 in english.json.
3. Map and freeze semantics. Plain objects and arrays are deep-frozen. The four Map fields are typed `ReadonlyMap` and are not frozen at runtime. Both a runtime TypeError test and a `@ts-expect-error` compile test cover this. design/M2.md Contracts already shows `ReadonlyMap` for the GameData Maps, and its "deep-frozen instance (A3)" wording is consistent.

Other checks:
- `classifyTech` on a unit or building now throws an `Error` naming the id, and a test covers it.
- The ticket's `readonly SnapshotEntry[]` for `byBaseId` values is a stated narrowing of the design's `SnapshotEntry[]`. This is consistent.
- Open questions are none in the ticket and in CONTEXT.md. Owner answers are folded into the body.
- Depends-on is SGS-012. Size is about 320 lines of business logic.
- Risk `high` is correct.
- On merge `none` is acceptable.
- No diagram is needed.
- Both LESSONS files are empty.
- The earlier checks (grounded names, 43/30/69/11 counts, the 7/3/4/41/14 classification, sources, stack) were verified in the first gate. Nothing they depend on changed.

Notes (non-blocking):
- design/M2.md `byBaseId` is `ReadonlyMap<string, SnapshotEntry[]>`, while the ticket types the values `readonly SnapshotEntry[]`. The designer may align the design line.
- The `patch` lookup may still come back as an implementer blocker, since the ticket says to stop if no citable patch is found.
- design/M2.md Summary still lists the old Recharts and TS versions (SGS-012 On merge covers this).
