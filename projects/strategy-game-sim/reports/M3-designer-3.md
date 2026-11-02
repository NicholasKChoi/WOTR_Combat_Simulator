# M3 designer pass 3

Design: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M3.md (rewritten in place).

## What changed in this pass

1. **M3.11 numbered gold deposits.**
   - Deposits are written `gold#2`..`gold#8`, and deposit 1 is plain `gold`.
   - Each deposit defaults to 4000 (`gatherNodes.gold.amount`). Each can be overridden with `nodeAmounts['gold#k']`.
   - A deposit can be named in every node position.
   - Each deposit has its own stock, depletion and warnings. Trips and drop-offs stay per kind.
   - `move all` moves every villager on a node.
   - New reaction steps (`whenever <ref> runs out ...`, `reaction: true`) let a build switch deposits at the run-out instant without holding up the rest of the build.
   - The three shipped builds must switch deposits rather than idle (prebuilt-builds bar).
2. **Result severity (owner 2a).**
   - New `Severity` scale: `error | warning | info`. `severity` is set on every note and warning.
   - Request issues are the error level, with no new field.
   - The page shows a `simulation-warnings` list. Info messages go in a collapsible `simulation-notes` area, collapsed by default.
   - The Playwright notes test clicks `simulation-notes-toggle` first.
   - OpenAPI: `BuildOrderNote.severity` is now required.
3. **Issue cap (owner 2b).** Kept as in pass 2.
4. **Chart Y-axis label (owner 2c).**
   - New chart behavior row: no label overlap at 1280 px with 4-digit ticks.
   - The planner must order or merge the M3.8 Y-axis ticket with the M3.10 markers ticket, because both edit `line-chart.tsx`.
5. **Shared engine code (owner 2d).**
   - New `engine-common.ts` holds one tolerance (`1e-9`), one cost and payment loop, and the walk formula.
   - New `test-helpers.ts` holds the shared test helpers.
   - A jscpd duplication check is added as `npm run lint:dup`. The lint command becomes `npx tsc --noEmit && npm run lint:dup`, and the manager updates the profile on merge.
   - The cleanup ticket is the first engine ticket.
6. **New `step-stuck` warning.** One warning per step still `waiting` at the horizon.

## Contracts fixed (names)

- **Shared code and tooling:** `engine-common.ts` (`RESOURCE_TOLERANCE`, `VILLAGER_ID`, `HOUSE_ID`, `costOf`, `canAfford`, `payCost`, `villagerWalkSeconds`, `markCompleted`); `test-helpers.ts` (`ENGLISH`, `at`, `editGameData`, `inputsFor`, `buildOrder`, `run`, `series`, `countAt`, `sampleIndex`, `withHandler`); `.jscpd.json`, `lint:dup`.
- **Nodes and deposits:** `MAX_DEPOSITS`, `DepositRef`, `NodeRef`, `FiniteNodeRef`, `NODE_REFS`, `FINITE_NODE_REFS`, `nodeKindOf`, `nodeRefIssue`, `runRefs`.
- **Steps and triggers:** `BuildStep.reaction`, `move.count: number | 'all'`, the `whenever` paste prefix.
- **Messages:** `Severity`, `SEVERITIES`, `BuildOrderNote.severity`, `SimWarning` (adds `severity` and the `step-stuck` variant), `ResultMessage`, `resultMessages`, `WarningMessages`, `InfoMessages`.
- **Test ids:** `simulation-warnings`, `simulation-notes`, `simulation-notes-toggle`, `simulation-notes-list`, `simulation-message`, `step-field-reaction`, `step-timeline-row[data-reaction]`.
- **OpenAPI schemas:** `NodeRef`, `FiniteNodeRef`, `Severity`.
- **Kept from pass 2:**
  - Node and resource types and constants: `FiniteGatherNodeId`, `GATHER_NODES`, `FINITE_GATHER_NODES`, `RESOURCE_KINDS`.
  - Triggers: `depleted` and `bank`.
  - Inputs: `SimInputs.nodeAmounts`, now keyed by `FiniteNodeRef` with 13 keys.
  - Step timing: `StepWait`, `waitingOn`, `waitBreakdown`.
  - Result fields: `SpendCategory`, `NodeDepletion` (`node` widened to `FiniteNodeRef`), `spent`, `spawnedPopulation`, `populationCapReachedAt`.
  - Markers: the marker contracts and colors.
  - Route: `MAX_REPORTED_ISSUES`/`omittedIssues`.
  - Page: `StepOptions` (`nodes: NODE_REFS`, `finiteNodes: FINITE_NODE_REFS`), compare and overlay, and the M3.7 build files.

## Changed contracts (re-spec tickets that use them)

- **Node fields:** every node field in `BuildStep`/`BuildStart` widens from `GatherNodeId` to `NodeRef`. `Trigger.depleted.node`, `NodeDepletion.node` and the `node` field of the node warnings widen to `FiniteNodeRef`.
- **Inputs:** `SimInputs.nodeAmounts` and `SimInputOverrides.nodeAmounts` are now keyed by `FiniteNodeRef`.
- **Steps:** `move.count` adds `'all'`, and `BuildStep` gains `reaction?: true`.
- **Messages:** `BuildOrderNote` and every `SimWarning` gain `severity`. `SimWarning` gains the `step-stuck` variant.
- **Result:** `depletions` now has one entry per run ref, not a fixed six.
- **Step options:** `StepOptions.nodes`/`finiteNodes` now hold refs.
- **Page:** `simulation-notes` changed meaning (info only, collapsed). `step-field-<field>` adds `reaction`.
- **Engine code:** research tolerance becomes `1e-9`, and houses population shortfall uses the tolerance.

## Behavior rules added or changed

- **Node stock:** draw-down per ref; run-out order is `FINITE_NODE_REFS`.
- **`node-depleted`:** `idleVillagers` is counted at the end of the run-out instant (changed). It gives `severity: 'warning'` when the count is above 0, else `info`.
- **Deposits:** new rows for the no-target case and independence between deposits.
- **Auto-houses:** `houseBuilderSource: 'gold'` means deposit 1.
- **`move all`:** new start and repeat rows.
- **Reactions:** new ordering, arming, cannot-start (no reserve), conflict (step order, reaction before cursor) and repeat rows.
- **Ordering:** the cursor skips reaction steps (any trigger: order).
- **Step status:** `waitBreakdown` applies to every armed unstarted step, including reactions.
- **`step-stuck`:** new.
- **Warnings ordering:** changed to include `step-stuck`.
- **Messages:** new page list, collapse and Playwright rows.
- **Chart:** new Y-axis row.
- **Step table:** change trigger kind drops `reaction`. New reaction checkbox. `move.count` accepts `all`.
- **Timeline:** reaction rows are marked.
- **Prebuilt builds:** the bar is rewritten into five parts covering reactions and gold warnings.

## Extension points

- Numbered stone or other deposits.
- Per-deposit trips, walks or positions.
- More deposits.
- More severities or per-code changes.
- Engine-level error messages.
- Severity on request issues.
- ESLint plus sonarjs.
- Save and share.
- Other civs.
- Automatic fallback node.
- More trigger kinds and reactions on other triggers.
- Idle-villager series.
- Marker toggles and kinds.
- Combat stats.
- More compare metrics.
- Mill coverage.
- Table-editable `start`.

## Owner decisions (open)

1. **How a build reacts to a deposit running out.**
   - **A (recommended, written in):** `whenever` reaction steps.
   - **B:** sequential `when` steps only. The bar cannot hold for builds whose gold runs out mid-build.
   - **C:** an automatic next-deposit input.
2. **Severity of a `node-depleted` with 0 idle villagers.**
   - **A (recommended, written in):** `info`, collapsed.
   - **B:** always `warning`. Bar part 5 would then have to exclude it.

## Notes for the manager

- MILESTONES has no exit-criterion row for result severity (owner 2a) or for the shared engine module and duplication lint (owner 2d). M3.8 covers the Y-axis and the issue cap. Consider adding rows or folding them into M3.8 and M3.9.
- The repo lint command changes to `npx tsc --noEmit && npm run lint:dup` once the cleanup ticket merges. The profile needs that update.
- The cleanup ticket (engine-common, test-helpers, jscpd) should be first in the engine sequence.
- The M3.8 Y-axis ticket and the M3.10 markers ticket both edit `line-chart.tsx`.
