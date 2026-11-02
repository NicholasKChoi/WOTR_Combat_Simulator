# SGS-062 tech-lead 1

## Decision
APPROVED - draft PR opened, no blockers.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/64 (draft, base `main`, head `sgs-062-aoe4-veterancy-convert-units` @ c566e070927735963097ab837783ef3de18e016a). Single PR, no stack footer.

Note: the branch was not on origin when this gate started (local only); it was pushed by this gate. No new commits.

## Reviewed
- Range: origin/main 54d7e90...c566e07 (3 commits: 998aa7d, 18625e3, c566e07), all authored choinickolas@gmail.com.
- Files: 10 changed, +342/-51. Reviewable business logic +67/-15 (research.ts, simulate.ts, engine-common.ts, model.ts comment); tests, acceptance spec, test-helpers, docs, OpenAPI excluded.
- Consumers of `unitsProduced`: `components/apps/aoe4-build-order/result-series.ts` (chart; maps counts straight to lines, unaffected in shape) and test helpers. Removed `Engine.spawns` has no other reader.
- Invariants: A1 (target tier read from data by age), A2 (spawn/conversion touch no resources; popcap from paid entry), A3 (conversion at the scheduled completion event; ledger changes are appended at monotone `state.time`). No violation.
- Irreversibility, concurrency, security: none. Open questions: none answered unilaterally (owner decided Q3=A).
- criticalPaths: no listed symbol is changed (`spawnUnit`, `unitSeries`, `researchItem` are not in the list); the public response semantics change sets the rating.

## PR Merge risk and Review focus (verbatim)
## Merge risk
**high** - changes the meaning of `UnitSeries.counts`, a field existing API consumers read (from cumulative per tier entry to units currently at that tier); schema shape is unchanged and a revert fully undoes it.

## Review focus
- [`lib/aoe4-build-order/research.ts:63-77`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/64/files#diff-6dea0adf30bf11d9accf8e7e324e7d858172051b5845ec1a4cbae0e47c1be4d4R63-R77) - if the conversion picks the wrong records (another `baseId`, a tier at or above the target) units are double-counted or vanish from the chart - check the filter and that the moved total is written once to the target entry.
- [`lib/aoe4-build-order/simulate.ts:288-291`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/64/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R288-R291) - a spawn landing below its paid tier, or popcap taken from the resolved instead of the paid entry, would shift `spawnedPopulation` and every downstream timing - check the floor at the paid tier and that popcap still reads `entry`.
- [`lib/aoe4-build-order/simulate.ts:864-889`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/64/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R864-R889) - series order and membership: a tier passed through within one instant (two upgrades at once) must not appear as a held series - check `firstHeldAt` evaluates only after all of an instant's changes.

## Non-blocking notes
- `convertUnits` calls `recordUnits(state, target, 0)` when nothing moves, leaving a zero-delta record; `firstHeldAt` filters it out, so it is harmless.
- Pre-existing, out of scope: `resolveUnitEntry` falls back to the lowest entry when the highest researched upgrade has no entry at its age, even if a lower researched upgrade does. With the new conversion that could leave new spawns below units already converted. The spawn floor at the paid tier does not cover it because pay-time resolution has the same fallback. Today's English data may not trigger it; worth a backlog line if a civ adds such an upgrade.
