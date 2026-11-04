# SGS-094 implementer 1

Branch sgs-094-aoe4-deer-pack-2450, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-094-aoe4-deer-pack-2450. Status: needs_review (one item for the manager, see Pins).

## Files
- data/aoe4-build-order/rules/base.json: deer amount 2450, source "owner-supplied starting total (2026-11-04): deer pack, 2450 food", unverified stays true.
- docs/api/openapi.json: two deer example amounts 1750 -> 2450.
- lib/aoe4-build-order/data.test.ts: shipped table deer row uses its own literal source string (owner constant is 2026-11-01).
- lib/aoe4-build-order/schema.test.ts, simulate-depletion.test.ts, simulate-triggers.test.ts, acceptance/aoe4-simulate-api-triggers.spec.ts: default deer 1750 -> 2450 in the default tables.
- lib/aoe4-build-order/simulate-house-warnings.test.ts: four digests re-pinned (see Pins).

## Tests
npm test: 48 files pass, 1488 passed, 10 skipped. npx tsc --noEmit clean. lint:dup ran. npx next build ok. npm run acceptance: 739 passed.
Mutation: set base.json deer value back to 1750; data.test.ts 'node amounts' failed (1 failed); restored.
git grep for "deer: 1750|7 deer x" finds nothing. No doc/comment changes were needed beyond the above (docs/aoe4-build-order.md has no deer figure).

## Pre-existing tests edited
All the table edits above change only the shipped deer value (explicit nodeAmounts override tests untouched). simulate-house-warnings.test.ts: digestTimeline tests, re-pinned.

## Pins (item 5, needs manager attention)
No shipped build references deer (0 occurrences in each builds/*.json), so each build's default deer depletion is amount 1750 -> 2450, depletedAt null before and after (nobody gathers deer; not separately printed, inferred from the data and the digest check below).
Four digests in simulate-house-warnings.test.ts moved because they hash the full `depletions` list, which contains the deer amount: late-house 67af1a20a5434d6f -> 975a4c07971b6e6d; ENG 1TC 42b0afc54e5e8bf8 -> 499e09e55f47604b; Spear/Longbow 95876b5e98214174 -> 91057a4051aa15eb; Knight/Longbow 082d524201cfafbd -> ba508ab49dcb2d6f.
Strictly, item 5 allows re-pinning only when the build sends villagers to deer; this reason (amount field inside the digest) is different. I verified it by temporarily running those four runs with nodeAmounts.deer 1750: the old digests matched exactly (24/24 passed), then restored. So only the deer amount moved, no timing. I re-pinned because the acceptance criteria require npm test to pass; the manager should confirm this is acceptable.

## Out-of-scope findings
None.
