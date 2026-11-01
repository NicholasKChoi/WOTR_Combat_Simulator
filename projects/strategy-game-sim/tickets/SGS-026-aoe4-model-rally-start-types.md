# SGS-026: Add the rally step, build order start and line map types

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.4 (type half)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes a cross-component contract (shared types every M2 module imports). Small, but the type is the seam for parse, validate, simulate and the route. -->
- **LOC estimate**: ~20 (types and comments in `lib/aoe4-build-order/model.ts`; plus a 2-name edit in one existing test)
- **Depends on**: none (SGS-014 merged)
- **On merge**: none
- **Source**: design/M2.md Contracts block (`BuildStep`, `BuildOrder`, `BuildStart`, `BuildOrderLines`), reports/M2-designer-line-map.md; plan outline L

## Context

M2 adds villager rally and a t=0 start split. Parser, validator, simulator and route all import their shapes from `model.ts`, so the types land first and verbatim from the design Contracts block.

## Scope

All in `lib/aoe4-build-order/model.ts` (on main it has no `rally` step, no `BuildStart`, no `BuildOrder.start`):

- Add `export interface BuildStart { villagers?: Partial<Record<GatherNodeId, number>>; rally?: GatherNodeId }` (t=0 split, absent = civ split; rally at t=0).
- Add `start?: BuildStart` to `BuildOrder`, between `source?` and `steps`.
- Add the `BuildStep` variant `{ action: 'rally'; producer: string; instance?: number; to: GatherNodeId; walkSeconds?: number }` (villager rally from its start on; no cost). It takes the shared optional `trigger` like every variant.
- Correct the `produce` comment (currently "rally is required for villagers", which the design reverses) to: no count = continuous; rally only for villager, sets the producer's rally; walkSeconds only with rally. The `produce` fields themselves do not change.
- Add `export interface BuildOrderLines { start?: number; steps: number[] }` with the comment from the design: paste line numbers, 1-based; `steps[i]` = line of `order.steps[i]`; `start` absent = no start line. Types only; no consumer in this ticket.
- Update `lib/aoe4-build-order/data.acceptance.test.ts` test "model.ts exports exactly the 16 documented types and no runtime code": the sorted export list gains `BuildOrderLines` and `BuildStart`, and the title says 18. Without this the test fails once the types exist.

No code on main narrows `BuildStep.action` or reads `BuildOrder` fields exhaustively (`git grep` for `BuildStep` outside `model.ts` finds only that test), so no other file changes.

**Out of scope:** `docs/aoe4-build-order.md` (its `produce` row still says "required for villagers"; fixed by SGS-025); parser, validator, simulator, route; `ValidateOptions` and `ParseTextResult` (they belong to their own modules' tickets); `BuildOrderIssue` (unchanged).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `model.ts` declares `BuildStart`, `BuildOrderLines`, `BuildOrder.start?: BuildStart` and the `rally` step variant exactly as in the design Contracts block (field names, optionality, types), and the `produce` comment states the design wording.
- [ ] A type-level check compiles: a `BuildOrder` with `start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' }` and a step `{ trigger: { kind: 'time', seconds: 30 }, action: 'rally', producer: 'town-center', to: 'wood', walkSeconds: 5 }` type-checks, and a `rally` step without `to` is a type error (`@ts-expect-error`). `npx tsc --noEmit` passes.
- [ ] `lib/aoe4-build-order/data.acceptance.test.ts` export-list test passes with the 18 names; it still asserts no runtime exports.
- [ ] `npm test` passes unchanged otherwise. `git grep -nE "^export (const|function|class|enum)" -- lib/aoe4-build-order/model.ts` finds nothing.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
