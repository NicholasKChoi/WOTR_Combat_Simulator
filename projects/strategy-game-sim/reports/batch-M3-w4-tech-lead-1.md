# Tech-lead gate: batch M3 wave 4 (SGS-038, SGS-044, SGS-045, SGS-048)

## Decision

No blockers. Four draft PRs opened as two footer-linked stacks. No new commits were added; the branches were pushed at the tips the manager gave.

| ticket | PR | base | head tip | merge risk |
|---|---|---|---|---|
| SGS-038 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/49 | main | 6efd8365253786096d365aa2a1748e6ff2798409 | medium |
| SGS-044 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/50 | sgs-038-aoe4-depletion-engine | a2ea776a343db0dec3bda9fd915d18b5b578960c | medium |
| SGS-045 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/51 | main | ffe63c6abbc3d5cb9e01a8825c7c2963364a8c7f | low |
| SGS-048 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/52 | sgs-045-aoe4-severity-message-lists | 772962028e20ac66af6eb884605361ac90e66284 | low |

## What I reviewed

- Base: origin/main 77fa279. Both stacks fork from it.
- Stack check: each branch's diff against its intended base contains only its own task's commits. 038: 12f0c53, 4749c13, 04ff671, 6efd836. 044: 9f040a7, a2ea776. 045: 5ecb2c8, e68dc07, ffe63c6. 048: 79dd597, 7729620. No diamond. `git merge-tree` of the two stack tops is clean, so there is no cross-stack conflict.
- Commit hygiene: every commit is authored as choinickolas@gmail.com, with no ticket ids and no PR numbers.
- No PRs existed for these branches before this run.
- Per-PR diffs:
  - 038: 16 files, +1173/-104; hand-written code +236/-52 (simulate.ts +145/-38, validate.ts +72/-6).
  - 044: 12 files, +406/-7; code +59/-1.
  - 045: 7 files, +241/-16; code +84/-13.
  - 048: 10 files, +536/-13; code +179/-11.
- Read in full: the simulate.ts engine diff, depletion.ts (on main from SGS-037), the validate.ts node-ref and nodeAmounts checks, the openapi depletions contract (main says one row per run ref, "empty today"), the docs Depletion section, markers.ts/research.ts, messages.ts/message-lists.tsx, and chart-rows.ts/compare.ts/compare-panel.tsx/line-chart.tsx.

## Blocker check

- A2 (resources never negative): nothing new spends. `creditIncome` pays a stocked ref only what `drawDown` removed, clamped to `remaining`. A depleted ref has 0 gatherers after `collectRunOuts` and is excluded from both credit paths.
- A3 (determinism): no randomness or clock. Stock is a Map in FINITE_NODE_REFS order, and run-outs are collected in that order.
- S3 (bounded): `nodeAmounts` is 0..100,000 or null, and deposits are 2..8. A run-out wakes at most once per ref. The tolerance (1e-9) is far above the float ulp at t <= 3600, so a run-out wake always advances time (no zero-step loop).
- A1: `createdBy` lives in rules/base.json. No game number was added to code.
- Contracts: request fields only widen. `depletions` changes from `[]` to six null rows by default, which matches the documented shape, and no page code reads `depletions`. `markers` is an additive required field, and the only consumer (the page) ignores unknown fields.
- No new concurrency, no security surface, no open question answered (CONTEXT has none).

## Merge risk and review focus (verbatim from the PR bodies)

### #49 (SGS-038), base main
## Merge risk
**medium** - It changes the event loop (`simulateBuildOrder`, `runInstant`, `nextWake`) and the simulate request/response surface. Both stay backward-compatible: request fields only widen, `depletions` follows its documented shape, and `move.count` adds `"all"`. A revert undoes it, and unit plus API tests pin the new behavior.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:545-569`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/49/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R545-R569) - run-outs are collected at the start of every `runInstant` pass but recorded only once the instant settles (line 778). If the `runOuts` guard or that ordering slips, a node gets two `node-depleted` warnings, or `idleVillagers` is read before a same-instant `move all` moved them. Check that the collect, offer and record order matches the warning's documented count.
- [`lib/aoe4-build-order/simulate.ts:616-644`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/49/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R616-R644) - `creditIncome` pays stocked refs only what `drawDown` removed, while `income` (gather-rate samples, `affordableAt`) still counts them at full rate. That is correct only because `nextWake` cuts every interval at the next run-out. If the run-out candidate is ever skipped, the interval runs past the run-out: the stock pays nothing from then on, but the gatherers stay non-idle, `depletedAt` lands on the next sample instead of the exact time, and `affordableAt` wakes early for income that never comes. Check that the candidate is pushed for every ref with gatherers and stock left.
- [`lib/aoe4-build-order/simulate.ts:352-360`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/49/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R352-R360) - the `createdBy` no-walk branch is the one change that moves default results for every user (every farm build). A wrong match (for example a mill with `then farm`) would silently drop a walk from other builds. Check that the comparison is created-node vs the built entry's baseId.


### #50 (SGS-044), base sgs-038-aoe4-depletion-engine
## Merge risk
**medium** - It adds a required `markers` field to the public simulate response and touches `simulateBuildOrder`. The change is additive (no existing field or value changes), and a revert undoes it.

## Review focus
No hotspots: the markers are write-only output pushed beside the existing `ages.push` and research completion. Simulation state and timings are unchanged, and `markers.test.ts` plus the API marker spec pin kinds, order and ties.


### #51 (SGS-045), base main
## Merge risk
**low** - It is page-only UI with no API, schema or critical-path change, a revert fully undoes it, and Playwright pins both lists, the toggle, and its persistence across runs and reloads.

## Review focus
No hotspots: this is a pure presentation split of messages the API already returns, and `messages.test.ts` and the page specs cover the severity split and the toggle state.


### #52 (SGS-048), base sgs-045-aoe4-severity-message-lists
## Merge risk
**low** - It is page-only UI with no API, schema or critical-path change, a revert fully undoes it, and unit tests plus Playwright pin the row union, the overlay and the compare values.

## Review focus
No hotspots: the change is client-side and read-only over results the API already returns. `chart-rows.test.ts` covers the time-union row merge, `compare.test.ts` covers the compare values, and the pin/unpin/failed-run flows have Playwright specs.


Rating rationale for SGS-038: medium, not high. No high factor applies:
- A revert undoes it.
- No contract an existing consumer reads changes incompatibly. The page does not read `depletions`, and the six rows match the documented shape.
- No concurrency or security change.
- The critical-path behavior (run-out wake, credit clamp, collect/record order, `createdBy` walk) is pinned by simulate-depletion.test.ts and the depletion-engine API spec.
- With default inputs no node is finite (no amounts ship), so the depletion paths run only when a request sets `nodeAmounts`. The page never does. The only default-path change is the farm walk, which the timelines spec pins.

The ticket's required PR-body content is in #49's Summary: the seven pre-existing test edits with reasons, the ENG 1TC numbers (596.2798390913501 -> 618.3789316586852; 378 -> 400 at 1200 s; ulp-only shifts on steps 23/24), and that these come only from farm builders joining the farm at completion.

## Non-blocking notes

- `components/apps/aoe4-build-order/compare.ts:39` defines its own `AGE_NAMES` (Feudal/Castle/Imperial). Once #50 lands, `lib/aoe4-build-order/model.ts` exports the same `AGE_NAMES`, so the copy should import it. That needs a small follow-up after both stacks merge, or the second-merged stack can switch to the import when it rebases. REPO.md's review checklist treats a copied constant as blocking only within `lib/aoe4-build-order/`, and it cannot be fixed now because 048's base does not have the export.
- `components/apps/aoe4-build-order/messages.ts:11` silently drops `severity: 'error'` result messages. None exists today (the engine and notes emit only warning/info); this is recorded in #51's scope line.
- `docs/aoe4-build-order.md` is edited by all four branches. The cross-stack merge is clean today, but whichever stack merges second needs a rebase check.
- PR bodies were set with `gh api -X PATCH .../pulls/<n> -F body=@file` (gh pr edit is broken here).
