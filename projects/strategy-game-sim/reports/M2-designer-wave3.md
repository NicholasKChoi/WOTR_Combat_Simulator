# M2 designer: wave 3 engine gaps (SGS-030 open questions)

Additive edits to design/M2.md: new "Production" subsection (table) after Engine rules; Engine rules Queue bullet
points to `SAMPLE_SECONDS`; Modules row for `simulate.ts` lists the new exports. Earlier line-map and wave-2 edits kept.
No owner decision needed: every answer is either an AoE4 game fact or the simplest model consistent with the approved rules.

1. Switch/pause: the unit in production finishes and spawns (no cancel, no refund); the old order's unpaid units are dropped. Grounded in play: AoE4 refunds a cancel in full, but players switching or pausing let the current unit finish. Ticket default (cancel + refund) is reversed.
2. Cost timing: corrected. AoE4 deducts cost at queue time. Model: cost paid and population reserved together at payment; a `produce` step pays its first unit per targeted instance at step start (queued FIFO behind the item in production), every later unit pays when its instance has no paid item. So a switch does not block later steps while the current villager finishes.
3. Priority: confirmed, sharpened. Only one step can be armed and unstarted at a time; while it waits on resources only, an order payment is skipped if it would drop any resource it costs below that step's cost of it. Steps start before order payments in one instant. Supply-, age- or unbuilt-instance-blocked steps reserve nothing; auto-houses ignore the reservation.
4. Completion: counted `produce` completes at its last spawn; continuous (or counted replaced early) completes when no instance carries its order, at the replacing step's `startedAt`; paid units still spawn. `export const SAMPLE_SECONDS = 5` in `lib/aoe4-build-order/simulate.ts`, echoed by `SimulationResult.sampleSeconds`.

Also fixed: `pause` is zero-cost, completes at arm, acts on existing instances only (no-op otherwise, not held); `produce` with no existing targeted instance waits; later-built instances are not covered by a baseId-wide `produce`. Seam names: `EngineState`, `StepHandler`, `stepHandlers`, `addBuildingInstance(state, baseId)`.

SGS-031 must: pay `build` at step start; on completion call `addBuildingInstance` then `onBuildingComplete`; never alter paid items on age-up; re-check age-blocked steps at age-up; auto-house builds bypass the priority reservation.
SGS-032 must: pay `research` at step start and append it to the instance FIFO; never replace the instance order (it resumes after); tier fixed at payment, so a unit paid before an upgrade completes stays the lower tier.

Re-spec: SGS-030 (Q1 reversed: no cancel/refund, Queue acceptance criterion and docs bullet change; Q2 payment FIFO; pause semantics; produce-without-instance waits; seam names and `SAMPLE_SECONDS`; close open questions). SGS-031 and SGS-032 (follow-ons above, seam names).
