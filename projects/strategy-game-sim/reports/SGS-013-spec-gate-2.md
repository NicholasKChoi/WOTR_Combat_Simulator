# SGS-013 spec gate 2

Verdict: READY (no blocking gaps; 3 non-blocking notes)

Checked: ticket SGS-013 (respec 2, risk high), design/M2.md (committed), CONTEXT.md, INVARIANTS.md (A1-A3, S3), SGS-014 (data values),
origin/main 6013fcc (no `docs/aoe4-build-order.md`, no AoE4 files: confirmed), LESSONS.md files (empty).

All four prior gaps are closed: starting units and population are in Scope 4/8 and a criterion; the state diagram is labeled conceptual
and mapped to `StepTiming.status` (all four values); the unverified labeling is reworded to point at the rules files; the model-scope,
simulation and game-data Decisions rules are enumerated in Scope 1/4 and covered by a line-by-line criterion. The notes from gate 1
(case-insensitive widened grep, present-tense naming of later files, "reached or not, in step order", real baseIds in examples,
checkable A1-A3/S3 sentences) are also in.

Spot checks: bounds table in Scope 2 matches the design table row for row; engine rules, task-switch walk and divisor, `classifyTech`
order, `SUPPORTED_EFFECT_PROPERTIES` (eleven), grammar details, CivRules hook list (eight), `startingState` field list, SnapshotSource
fields, route shapes all match design/M2.md. The 5 s walk, 3/(N+2), 0.75/0.69/10/25 and +20/25/30/30% match CONTEXT/SGS-014. On merge
names the Design docs row and the deleted Decisions lines (all exist); "AoE4 interface" is kept and already states the route decision.
Risk high is right (public contract, adjacent A1-A3 and S3). Size is prose only. Diagram trigger statement is correct and the doc
carries its own two.

## Notes (non-blocking)

1. Scope 3 and criterion 8 say the doc "does not call the carry capacities unverified". Per SGS-014 only the sheep, deer and boar
   capacities are observed (`unverified: false`); the 10s for berry, farm, wood, gold and stone are wiki-sourced and `unverified: true`.
   Safer wording: "does not call the sheep, deer or boar capacities unverified". Not blocking because the doc defers per-node labels to
   `rules/base.json`, so an author who simply avoids the claim passes and nothing false is forced.
2. Scope 6 `at <building>` example is described, not given. Suggest the author pick one from the English snapshot (for example a
   tech whose `producedBy` lists a building) and check it; the snapshot is not on main until SGS-014 merges, so the author must read
   it from aoe4world at `e89f01e`.
3. The lifecycle diagram says "completed (`completedAt` set)". The design does not say when instant steps (`pause`, `move`) complete.
   The doc should not invent it; if the author needs a rule, it should state only what the design says and flag the rest back.
