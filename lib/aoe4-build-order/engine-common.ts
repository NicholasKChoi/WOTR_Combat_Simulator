import type { SnapshotEntry } from './data';
import { modifiedValue } from './effects';
import type { EffectState } from './effects';
import { RESOURCE_KINDS } from './model';
import type { ResourceKind, SpendCategory } from './model';
import type { EngineState } from './simulate';

// Income credited up to the computed affordability time can land a hair under the cost in floating point.
// The same margin absorbs float noise in the auto-house population shortfall.
export const RESOURCE_TOLERANCE = 1e-9;

export const VILLAGER_ID = 'villager';
export const HOUSE_ID = 'house';

export type Resources = Record<ResourceKind, number>;

export function costOf(entry: SnapshotEntry, units: number): Resources {
  const cost = {} as Resources;
  for (const kind of RESOURCE_KINDS) {
    cost[kind] = entry.costs[kind] * units;
  }
  return cost;
}

export function canAfford(bank: Readonly<Resources>, cost: Readonly<Resources>): boolean {
  return RESOURCE_KINDS.every((kind) => bank[kind] + RESOURCE_TOLERANCE >= cost[kind]);
}

export function payCost(state: EngineState, cost: Readonly<Resources>, category: SpendCategory): void {
  for (const kind of RESOURCE_KINDS) {
    state.resources[kind] = Math.max(0, state.resources[kind] - cost[kind]);
  }
  state.spent[category] += RESOURCE_KINDS.reduce((sum, kind) => sum + cost[kind], 0);
}

export function villagerWalkSeconds(state: EffectState, walkSeconds: number): number {
  const villager = state.data.byBaseId.get(VILLAGER_ID)?.[0];
  const moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', { baseId: VILLAGER_ID, classes: villager?.classes ?? [] }, state);
  return walkSeconds / moveSpeedMultiplier;
}

export function markCompleted(state: EngineState, step: number): void {
  state.steps[step].completedAt = state.time;
  state.steps[step].status = 'completed';
}
