# M2 designer, wave 5 (additive)

Design: `design/M2.md`. Earlier uncommitted edits kept. SGS-030 seam names are unchanged.

## Decisions

| # | gap | resolution | where in design/M2.md |
|---|---|---|---|
| 1 | which instance takes `research` | Decided: the lowest-numbered existing instance of the first candidate baseId that has one. Candidates are `[at]`, else the tech's `producedBy` in snapshot order. Queue length is not consulted. With no instance, the step waits and reserves nothing. No `instance` field now; an optional `instance?` on `research` is listed as an extension point. | "Research target"; Extension points row "Pick the researching instance" |
| 2 | repeat `research` | Decided as a validation issue. Game fact: a tech is researched once and cannot be queued twice. A `research` whose `tech` matches an earlier `research` step's `tech` is `invalid`, with the issue on the later step. The check runs after ids resolve. The engine has no runtime check. | "Repeat research"; Issue codes `invalid` row |
| 3 | `planAutoHouse` signature | Confirmed `planAutoHouse(state, inputs, data, demand: HouseDemand): number` with `HouseDemand { pendingSupply; populationPerSecond }`, both exported from `houses.ts`. | Modules row; "Auto-houses" block |
| 4 | explicit `build house` suppression scope | **Owner decision** (Owner decisions 4). Options: (a) whole run; (b) from the first house step's start; (c) **recommended**: off from t=0 until the last `build house` step has started, then on. Until the owner decides, SGS-031 keeps (a). | Owner decisions 4; "Auto-houses" last bullet |
| 5 | first house stalls with 0 on `wood` | Decided as a fallback, because the approved doc promises "supply never blocks production". `houseBuilderSource` is the preferred node. If it has fewer than `houseBuilders` gatherers, builders come from the node with the most gatherers (ties go to the first in `GatherNodeId` order). Builders return to the node they came from. The house waits only when no node has enough gatherers, or when wood is short. Confirmed on origin/main 68e004a: the English start is `sheep: 6`, `wood: 0`. | "Auto-houses" Builder source bullet; `SimInputs.houseBuilderSource` comment |

## Contracts fixed or changed (names)

- New: `HouseDemand`; `planAutoHouse(state, inputs, data, demand)` (adds a 4th param to the Modules row).
- New rule: Repeat research (`invalid`). This is the ninth `invalid` rule.
- New rule: Research target (instance choice).
- Changed meaning: `SimInputs.houseBuilderSource` is now a preferred node with a fallback.
- No change to `BuildStep` (no `instance` on `research`), to the issue code list, or to SGS-030 seams.

## Re-spec needed

- SGS-029: add the Repeat research `invalid` rule, a failing case (`wheelbarrow` twice, issue on step 2) and a passing neighbour. "eight" `invalid` rules becomes "nine" in the docs criterion.
- SGS-031: add the builder-source fallback and return-to-origin rule, and drop "the house waits rather than invent a fallback". Rewrite the "source node with 0 villagers keeps production blocked at supply 10" criterion: the default start with `houseBuilderSource: 'gold'` now takes a `sheep` villager. Add a new case where every node has fewer than `houseBuilders` gatherers and the house waits. The docs bullet changes the same way. The suppression rule stays (a) until Owner decision 4. If (c) is chosen, re-spec loop step 5's gate and the docs sentence. The `@10:00` test holds under all options.
- SGS-032: remove both Open questions. Scope already matches the Research target rule. Add a test with two `town-center`s showing that `research textiles` goes to `capital-town-center` #1. No engine repeat check.

## Extension points

- Optional `instance?: number` on `research` (as on `produce`).
