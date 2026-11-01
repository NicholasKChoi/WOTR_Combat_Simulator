# SGS-031 ticket re-spec 1

Ticket: tickets/SGS-031-aoe4-build-move-ages.md (rewritten in place; new `## Re-spec 2026-10-31 (2)` section). Inputs: reports/SGS-031-spec-gate-1.md, reports/SGS-032-spec-gate-1.md, the manager's decisions, SGS-030 and SGS-032 tickets, and on 68e004a `data.ts` (byBaseId sorted by ascending age), the English snapshot and rules JSON, and `docs/aoe4-build-order.md`.

## Gaps folded in

1. **SGS-030 Seam test.** New Scope section 5. SGS-031 edits that test in place: it drops the `build` and `move` no-handler cases and keeps the `research` case (SGS-032 replaces that one later). The test-handler half stays on `stepHandlers.build`, but it now saves the real handler and puts it back in `finally`. The old "delete in finally" would have removed the real `build` handler for later tests. The last criterion now names exactly this edit and says every other SGS-030 test is unchanged. SGS-030 itself is not re-specced.
2. **Age-blocked scenario.** Rewritten with shared test data: starting `capital-town-center`, `barracks`, two `house` (supply 30); food 2000, wood 200, gold 1000; 6 sheep villagers; `autoHouses: false`. Steps: abbey with 4 from sheep, then continuous `produce man-at-arms from barracks`, then `produce spearman from barracks`. Man-at-arms are paid at multiples of 14.65 up to 87.9. Spearman `armedAt` 0, `startedAt` 100, `waitSeconds` 100. Man-at-arms step `completedAt` 100. The last man-at-arms spawns at 102.55 as `man-at-arms-1` (count 7); the spearman spawns at 117.55 as `spearman-2`. Following the note, Ages is split into two runs: council hall finishing at 195 does not move the age; kings-palace starts at 100 and completes at 270 into age 3. I re-derived all the numbers by hand from the snapshot.
3. **House cost.** The start check and the payment use all four `food/wood/gold/stone` costs. The wake-up uses the binding resource, with no wake-up when that resource has no income. New criterion: a house that costs 10 stone with start stone 0 never starts (3 villagers at 120); with start stone 10 it starts at 40.

## SGS-032 coordination (demand lookup)

`resolveUnitEntry` is not in SGS-030's contract, so SGS-031 does not use it. SGS-031 adds a non-exported `currentUnitEntry(unit, state)` in `simulate.ts`. It returns the lowest-age entry. The demand computation is its only caller, and SGS-030's two lookups are untouched. Whichever ticket merges second makes `currentUnitEntry` return `resolveUnitEntry(unit, state)`. The name is fixed. SGS-031 has no `[0]` grep. The new criterion is: `git grep -n currentUnitEntry` finds the definition and one call. A mutation test is added: a continuous man-at-arms order on the two-producer scenario moves the first auto-house to 43.95; counting only villager orders moves it to 60. I removed the "available at state.age" filter on demand because it was dead code (an order exists only after its unit was payable, and ages only rise).

## Other changes

- `ctx` is defined as `{ data, inputs, time: state.time }`.
- The landmark class regex is exempt from the numeric-literal rule.
- The test `GameData` is named in the A2/reserve and "Reservation ignored" criteria (villager costs wood 50).
- The "Reservation ignored" test handler now saves and restores the handler.
- **Fixed a pre-existing error the gate missed.** "Auto-houses never block" said wood gatherers dip to 5 at t=105. That figure leaves out the spawned villagers rallied to wood. The correct value is `15 x rw` against `16 x rw` with `autoHouses: false`, and the two are equal again at 125.

## Checks run on 68e004a

- `back to back` finds 1 line (181).
- `overrides auto-houses` finds 1 line (182).
- `taken from .wood.` finds 1 line (180).
- The determinism grep finds nothing (the files are absent).
- `currentUnitEntry` finds nothing.
- The mutation criteria target new code that does not exist yet, so I could not run them.

## Open questions

None.
