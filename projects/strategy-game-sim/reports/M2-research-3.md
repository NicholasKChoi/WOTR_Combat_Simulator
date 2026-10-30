# M2-research-3: v1 step-trigger kinds for the AoE4 build-order input

**Question**: Which step-trigger kinds should v1 support: time, villager count, and/or event triggers?

## Facts
- Community formats are mostly descriptive, not executable. RTS_Overlay's AoE4 step fields are population_count, villager_count, age, food/wood/gold/stone, builder (resource worker counts), and an optional string `time`; they are display guidance for a human, not triggers (CraftySalamander/RTS_Overlay python/aoe4/aoe4_build_order.py:37-46; https://github.com/CraftySalamander/RTS_Overlay). aoe4guides exports to that format (same repo/readme).
- The one executable-ish line format found, nordie92/AoE4BO, is "requirement(s): instruction" with supply (s), supply cap (sc), food/wood/gold/stone amounts, and time in seconds (t); multiple requirements on a line must all hold (https://github.com/nordie92/AoE4BO). So supply, time and resource thresholds all exist in the wild; supply/villager count is the dominant one.
- Not verified: the full aoe4guides / age4builder schema (fetch of RTS_Overlay manual doc 404'd; only field list from source was read).
- Constraints: A2 (unaffordable step waits, wait is reported), A3 deterministic, additive API (CONTEXT.md:57-61, INVARIANTS.md:55-61). Houses are auto-built, so supply is a simulator-owned quantity; villager count is cheap to read.

## Options
1. **vils-only (+ implicit "after previous step")** - triggers: villager count only; steps otherwise run in order when affordable. Cheapest; matches how humans write orders; time is dropped. Tradeoff: cannot express "@4:30" targets; the paste example "@0:00 town-center produce villager continuous" needs a special case (treat @0:00 as start).
2. **vils + time (recommended)** - `{"kind":"villagers","count":17}` and `{"kind":"time","seconds":270}`. Both are pure functions of simulator state (villager count, clock), so deterministic and trivially evaluable at each event. Matches the example lines in the proposed paste format. Cost: low (two predicates).
   - Ordering rules to specify: steps are processed in listed order (list order is the tiebreak, never sorted); a step becomes "armed" when its trigger is true AND all earlier steps have been started (a later step never jumps ahead); then it waits for affordability (A2). Equal-time triggers fire in list order. A trigger already true when armed fires immediately. A villager-count trigger that is never reached (e.g. count > possible) is reported as "not reached" at simulation end/horizon, not an infinite loop; same for unaffordable-forever steps.
3. **vils + time + resource thresholds ("when 200 wood banked")** - adds a predicate on banked resources. Cost moderate: resource-threshold can never fire if the resource isn't gathered (no wood assigned), and it overlaps with affordability waiting (A2), so semantics are redundant/confusing. Little community use as a trigger.
4. **Full event triggers (age reached, building complete, etc.)** - highest cost: needs an event bus/dependency graph, cycle and never-fires detection, and same-tick ordering of multiple completions. Real demand ("when feudal lands") is mostly expressed in community orders as villager counts plus the age-up step itself.

## Additive schema
Each step has `trigger` as a tagged object: `{"kind": "villagers", "count": 17}`; omitted trigger = "after previous step" (`{"kind":"afterPrevious"}` as the explicit default). Later kinds (`"event": {"type":"ageReached","age":2}`, `"resource"`, `"all"`/`"any"` combinators) are new `kind` values and do not change existing ones. Reject unknown kinds with a clear error in v1 (do not ignore silently). Paste format: `@m:ss ...` -> time, `at N vils ...` -> villagers, bare line -> afterPrevious.

## Recommendation
Option 2: time + villager count, with in-order processing and explicit "not reached" reporting, trigger as a tagged `kind` object so event/resource triggers are additive later. Defer resource and event triggers (options 3-4) until a real build order needs them.

## Unknowns
- Whether any real aoe4guides/age4builder order depends on non-villager triggers (would settle option 3 vs 2); check by sampling ~10 popular orders.
- Owner preference: whether "@time" means "not before" (assumed) or "exactly at" (impossible if unaffordable; recommend "not before").

## Sources
- https://github.com/CraftySalamander/RTS_Overlay (python/aoe4/aoe4_build_order.py:37-46)
- https://github.com/nordie92/AoE4BO
- https://forums.ageofempires.com/t/presenting-aoe4-guides-yet-another-build-order-site/228310
- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/CONTEXT.md:57-61, INVARIANTS.md:55-61
