# SGS-032 implementer report 1

- Ticket: SGS-032 (research handler and veterancy)
- Branch: sgs-032-aoe4-research-veterancy, base origin/main a714a23
- Tip: 422b26f34d519032dcdccac3be21d36c59a78136 (author choinickolas@gmail.com, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-032-aoe4-research-veterancy
- Status: needs_review

## Files

- lib/aoe4-build-order/research.ts (new, 99 lines): `researchHandler`, `resolveUnitEntry`, `researchNotes`. It imports from `./simulate` as types only, so there is no runtime cycle.
- lib/aoe4-build-order/simulate.ts: `unitEntry` is removed. `produce` and `payOrder` call `resolveUnitEntry` (2 calls) and check `entry.age > state.age` inline. `research: researchHandler` is registered. `notes: researchNotes(order, data)`.
- lib/aoe4-build-order/simulate.test.ts: `withHandler` saves and restores the existing handler. The seam test now covers only build and move. A new delete-and-restore test checks that an action with no handler stays waiting and blocks the steps after it, then restores the handler (`toBe(saved)`) and confirms the real handler runs.
- lib/aoe4-build-order/simulate.acceptance.test.ts: `withHandler` gets the same save/restore fix. Its `capture` overrides `research`, and the old delete would have left the handler unregistered for later tests.
- lib/aoe4-build-order/research.test.ts (new, 34 tests).
- docs/aoe4-build-order.md: "Queues" gets the Research target paragraph ("lowest-numbered") and the research-payment paragraph ("resumes"). "Tiers" now says the tier is "fixed when paid" and that an upgrade with no unit entry at its age does not change the tier. The `notes` bullet now says "whether or not the step is reached, in step order". Step life now says research completes when its research time ends.

## Tests

`npm test`: 21 files, 590 passed, 0 failed. `research.test.ts` has 34, all passing. Invariants they encode:
- Delay and tier, at age 3 with a barracks: the research runs 5 to 75 s, and the next spearman is paid when it ends as spearman-3. Each tier is its own series. The produce order stays on the instance.
- The tier is fixed at payment. A unit paid before the upgrade completes keeps the lower tier, and a unit paid after it gets the upgraded tier. Shown by comparing a timed run with an untimed one.
- `resolveUnitEntry`: no upgrade, veteran, highest (elite gives spearman-4), a gap (spearman-3 removed gives spearman-2), and unknown baseId gives undefined.
- Research target: the first `producedBy` building with an instance, on instance 1. With `at`, instance 1 regardless of queue length (checked against queue snapshots). A candidate building with no instance is skipped.
- Waits (A2):
  - Short of gold only: the research reserves and starts at 100/(6 x gold rate), floating never goes below 0, and the villager payment is held back.
  - These wait without a reserve and the villager order keeps paying: no target instance, `at` naming a missing building, unreached age (with an age-3 contrast that starts at 0), `upgrade-king-3`, and a tech with no producing building and no `at`.
  - Starts at the exact instant the gold arrives despite float rounding (9 gold miners, 3 gold).
- Wheelbarrow at a starting mill:
  - Cost is paid at start and `completedAt` = research time.
  - Gather rates are unchanged before completion. After it, 9 gatherers run at the wheelbarrow rate.
  - `unitsProduced` is unchanged.
  - Changed time or cost data changes the output.
- Shared queue: textiles at capital-town-center at 0:05 runs 20 to 40 s. The villager order pays nothing during it and resumes after. The villager paid before still spawns on time.
- Notes:
  - One per ignored or unmodeled research step, reached or not, in step order.
  - Messages name the tech and the ignored properties.
  - The notes are a pure function of the order and the data. A rejected tech gives none.
  - An ignored-effects tech still costs resources and queue time.
- research.ts has no numeric literals other than 0 and 1.

## Mutation checks

Each break was applied with a script, the `lib/aoe4-build-order` tests were run, and the source was restored in `finally`. Final `git status` showed no leftover changes.

| break | result |
|---|---|
| `resolveUnitEntry` returns `entries[0]` | 5 tests fail (delay/tier, series, resolve) |
| `complete` skips `researched.add` | 4 fail (tier, wheelbarrow rates) |
| tolerance 0 | 1 fails (gold-arrival instant; added after this break first survived) |
| target takes the last instance | 4 fail |
| candidates in reverse order | 1 fails |
| reserve on no target or unreached age | 2 fail |
| age check dropped | 1 fails |
| research clears the instance order | 4 fail |
| unmodeled note branch dropped | 2 fail |
| ignored note branch dropped | 3 fail |
| first upgrade instead of max | 1 fails |
| cost not subtracted | 3 fail |
| produce site uses `byBaseId.get(...)[0]` | 1 fails |
| order payment site uses `byBaseId.get(...)[0]` | 2 fail |
| `notes: []` | 4 fail |
| research handler not registered | 12 fail |
| seam test does not delete the handler | 1 fails |
| produce age check dropped | 1 fails |
| `completedAt` not set | 6 fail |
| payOrder `entry.age > engine.age` dropped | survives (see below) |

The payOrder age check survives because it cannot be reached. An order exists only after `produce` passed the same check. Ages never decrease. A resolved upgrade tier has the age of a researched upgrade, which is at most the current age. The check was in the removed `unitEntry` on main and is kept as it was.

## Build and lint

- Codegen: none configured.
- `npx tsc --noEmit`: clean.
- `npx next build`: succeeds.
- `git diff --stat origin/main`: 6 files, all named by the ticket's scope. No stray tool changes.

## Greps

- `classifyTech` appears in research.ts.
- `byBaseId\.get\(([A-Za-z_.]*\.)?unit\)` finds nothing in simulate.ts. houses.ts is not on this base because SGS-031 is not merged.
- `resolveUnitEntry(` has 2 calls in simulate.ts.
- `git grep -n "stepHandlers.research" -- lib/` finds only the restore assertion.
- `resumes|fixed when paid` and `lowest-numbered` each match in docs.

## Invariants

- A1 (determinism): the handler and notes depend only on order, data and inputs. A test checks that the notes are a pure function of the order and data.
- A2 (resources never negative; waits reported): cost subtraction is clamped at 0. Floating stays at or above 0 in tests. Waits with no target or an unreached age reserve nothing, and only a shortage of resources reserves.
- A3 (data-driven numbers): research.ts has only the literals 0 and 1, enforced by a test. Time, cost and tier come from data, and a test shows changed data changes the output.

## Deviations and notes for review

- Ticket data error: the ticket says `research shaft-mining` gives a `tech-effect-unmodeled` note. But rules/english.json has overlay rows with `grantedBy: shaft-mining`, so `classifyTech` returns `supported` and there is no note. The tests use `admiralty` (also effects-unmodeled: naval-arrowslits, serpentine-powder, silk-bowstrings) and assert that shaft-mining gives no note. The examples in the ticket and design should be corrected. In docs "Technologies" item 4, shaft-mining is the example, and the same item says an overlay makes a tech supported, so the example is misleading. I did not edit it because it is outside this ticket's docs bullets.
- Tolerance: research.ts uses `Math.sqrt(Number.EPSILON)` (about 1.5e-8) for affordability. A `1e-9` literal would break the 0/1 literal rule, and importing simulate.ts's constant at runtime would create a cycle. Without it, a research waits to the next event when gathered gold lands a hair under the cost. That was observed with 9 miners and 3 starting gold: 20 s instead of 17.47 s. A test covers it.
- `currentUnitEntry` is not added because the ticket does not name it.
- SGS-031 and SGS-033 are not on this base. The auto-house lookup in houses.ts must go through `resolveUnitEntry` in whichever of SGS-031/032 merges second.

## Out-of-scope findings

- The docs/aoe4-build-order.md "Technologies" item 4 example (shaft-mining as effects-unmodeled) conflicts with the overlay rows in data/aoe4-build-order/rules/english.json. The design/M2.md and ticket examples have the same error.
