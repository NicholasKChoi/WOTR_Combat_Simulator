# SGS-080-research-1: farm overflow, wait-and-auto-take (A) vs stay idle (B)

Question: when a villager arrives at farm and every built farm has a farmer, does it (A) wait and auto-take the next farm built, or (B) stay idle until a later step moves it?
Changes with the answer: SGS-080 Scope 2 (promotion in completeConstruction, idle-first sendWalking), acceptance cases 2-5, the Idle->Gathering edge of the diagram, SGS-081 re-tune effort.

## Facts
- Engine today: idle villagers exist only at a depleted ref; `assignGatherers` sends arrivals there to `state.idle[ref]`, and `sendWalking` takes gatherers first then idle (simulate.ts:171-185). Docs: idle villagers are alive, count in `at N vils`, and only a step moves them (docs/aoe4-build-order.md:396-399). No auto-promotion exists anywhere; a depleted node never refills, so B is the existing semantic, A is a new mechanism (one new loop in completeConstruction).
- Ticket: A is the stated default (SGS-080 ticket, Scope 2, Open questions). A's own text says "matches the game"; that claim is unverified (see below).
- Real game: I found no official or reliable source that an AoE4 villager sent to an occupied farm waits and auto-takes a later-built farm. Search found only forum reports, mostly AoE2:DE. Reports point the other way: villagers that finish building a farm stay idle rather than take an empty nearby farm (AoE2 bug thread, https://forums.ageofempires.com/t/idle-farmers/64006); villagers who build farms together stack on the first farm and only start farming when the shift queue ends (feature request, https://forums.ageofempires.com/t/feature-request-villager-construction-distribution-option/287650, game not stated, unverified for AoE4); right-click spreading to nearby free farms works, but if none is near the villager goes idle (search summary, https://forums.ageofempires.com/t/suggestion-idle-villagers-automatically-find-nearby-work/268481, not opened). Builder-starts-farming: the same request says default is builders do not start farming immediately; a lone builder with `then farm` follows its queued order, consistent with the engine's `build ... then farm`.
- Net: real-game evidence favors "idle, does nothing on its own" (B), or at best "takes a nearby free farm at the moment of the order" (not modelled either way). A's "waits at the farm and auto-takes a future one" is not supported by anything found. Only an in-game test settles it.

## Options
- A: wait and auto-promote - matches ticket default; build authors only write `build farm` steps and income self-corrects; cost: new promotion code (~15 lines), idle-first move order, warning text promises "until one is built"; risks overstating the game's helpfulness (a build tuned on A may be unreachable in game if villagers truly stay idle); conflicts: none with invariants (A3 deterministic).
- B: stay idle until a step moves them - reuses the existing depleted-node idle semantic (no promotion, no idle-first ordering change, simpler diagram and fewer acceptance cases); authors must add `move N from farm to farm` (or `build farm ... then farm`) after each farm; cost: more explicit steps in all three shipped builds (english-1tc 12 farm refs, knight-longbow 46, spear-longbow 22) so SGS-081 grows; but a `move farm->farm` is a no-op today (gatherers and idle share one ref), so B needs a way to say "promote idle" -- unresolved: either a new step or `move` special case. That undermines B's simplicity. Check this before choosing B.
- C (hybrid, not in the ticket): A for builders only (`build farm then farm` takes its own farm) and everything else idle until moved. Closest to verified game behavior, but is B plus the builder case already in the ticket; the move-onto-same-ref gap remains.

## Recommendation
A, as a stated modelling simplification, not a claim about the game: the farm-to-farm no-op move makes B unworkable without a new step kind, and A keeps the author cost at `build farm` steps. Word the docs and warning as "wait idle until a farm is built" (modelled), and do not say it matches the game. If the owner wants fidelity over convenience, B needs a new "reassign idle" mechanism first, which is a separate ticket.

## Unknowns
- Actual AoE4 behavior for (a) a villager rallied/queued to farms when all are full and a new one finishes, (b) a builder with an empty queue. Settle by a 5-minute in-game test or a maintainer/community-source reply.
- Whether `move N from farm to farm` is a deliberate no-op in simulate.ts (not read in detail; inferred from shared gatherers+idle bucket at simulate.ts:167).

## Sources
- lib/aoe4-build-order/simulate.ts:158-185; docs/aoe4-build-order.md:286-317, 393-399
- .claude/code-factory/projects/strategy-game-sim/tickets/SGS-080-aoe4-one-villager-per-farm.md (Scope 2, Open questions)
- https://forums.ageofempires.com/t/idle-farmers/64006
- https://forums.ageofempires.com/t/feature-request-villager-construction-distribution-option/287650
- https://forums.ageofempires.com/t/suggestion-idle-villagers-automatically-find-nearby-work/268481
