import type { SnapshotEntry } from './data';
import { modifiedValue } from './effects';
import type { EffectState } from './effects';
import { RESOURCE_KINDS } from './model';
import type { ResourceKind, SpendCategory } from './model';
import type { BuildingInstance, EngineState } from './simulate';

/**
 * Slack allowed when comparing a bank to a cost: income credited up to the computed affordability time can land a
 * hair under the cost in floating point. The same margin absorbs float noise in the auto-house population shortfall.
 */
export const RESOURCE_TOLERANCE = 1e-9;

/** The baseId of the villager unit. */
export const VILLAGER_ID = 'villager';
/** The baseId of the house building. */
export const HOUSE_ID = 'house';

/** An amount of each resource kind. */
export type Resources = Record<ResourceKind, number>;

/** The cost of a number of units of a snapshot entry, per resource. */
export function costOf(entry: SnapshotEntry, units: number): Resources {
  const cost = {} as Resources;
  for (const kind of RESOURCE_KINDS) {
    cost[kind] = entry.costs[kind] * units;
  }
  return cost;
}

/** Whether a bank covers a cost, within RESOURCE_TOLERANCE. */
export function canAfford(bank: Readonly<Resources>, cost: Readonly<Resources>): boolean {
  return RESOURCE_KINDS.every((kind) => bank[kind] + RESOURCE_TOLERANCE >= cost[kind]);
}

/** The bank a payment needs: its cost plus the holds, counting only the resources the payment spends, so a food-only payment never waits on a wood hold. */
export function heldNeed(cost: Readonly<Resources>, holds: readonly (Readonly<Resources> | undefined)[]): Resources {
  const need = { ...cost };
  for (const hold of holds) {
    if (!hold) {
      continue;
    }
    for (const kind of RESOURCE_KINDS) {
      if (cost[kind] > 0) {
        need[kind] += hold[kind];
      }
    }
  }
  return need;
}

/** Whether the bank covers a cost on top of the auto-house hold; paying handlers check through here, so a step leaves a due auto-house's cost in the bank. */
export function canAffordHeld(state: EngineState, cost: Readonly<Resources>): boolean {
  return canAfford(state.resources, heldNeed(cost, [state.houseHold]));
}

/** Takes a cost out of the bank, flooring each resource at 0, and adds it to the category's spent total. */
export function payCost(state: EngineState, cost: Readonly<Resources>, category: SpendCategory): void {
  for (const kind of RESOURCE_KINDS) {
    state.resources[kind] = Math.max(0, state.resources[kind] - cost[kind]);
  }
  state.spent[category] += RESOURCE_KINDS.reduce((sum, kind) => sum + cost[kind], 0);
}

/** The base walk seconds divided by the villager's modified move speed (Model rules). */
export function villagerWalkSeconds(state: EffectState, walkSeconds: number): number {
  const villager = state.data.byBaseId.get(VILLAGER_ID)?.[0];
  const moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', { baseId: VILLAGER_ID, classes: villager?.classes ?? [] }, state);
  return walkSeconds / moveSpeedMultiplier;
}

/** Whether an instance can take step `step`: nothing is paid in its queue and it is not held for another step (Model rules). */
export function instanceFree(state: EngineState, instance: BuildingInstance, step: number): boolean {
  return instance.paid.length === 0 && !(state.held !== null && state.held.step !== step && state.held.instances.has(instance));
}

/** Marks a step completed at the current time. */
export function markCompleted(state: EngineState, step: number): void {
  state.steps[step].completedAt = state.time;
  state.steps[step].status = 'completed';
}

/** Adds delta to the units of an entry the build holds, with a timed change record. */
export function recordUnits(state: EngineState, entry: SnapshotEntry, delta: number): void {
  const record = state.spawned.get(entry.id) ?? { entry, held: 0, changes: [] };
  state.spawned.set(entry.id, record);
  record.held += delta;
  record.changes.push({ time: state.time, delta });
}
