import { hasBuilding, modifiedValue } from './effects';
import type { EffectState, ModifierTarget } from './effects';
import type { GatherNodeId, SimInputs } from './model';

function villagerTarget(state: EffectState): ModifierTarget {
  const villager = state.data.byBaseId.get('villager')?.[0];
  if (!villager) {
    throw new Error(`effectiveGatherRate: no villager entry in the ${state.data.civ} snapshot`);
  }
  return { baseId: villager.baseId, classes: villager.classes };
}

function applyAll(base: number, properties: readonly string[], target: ModifierTarget, state: EffectState): number {
  return properties.reduce((value, property) => modifiedValue(value, property, target, state), base);
}

// Per villager, in resource per second.
export function effectiveGatherRate(node: GatherNodeId, state: EffectState, inputs: SimInputs): number {
  const rules = state.data.base.gatherNodes[node];
  const target = villagerTarget(state);
  const rate = applyAll(rules.rate.value, rules.rateProperties, target, state);
  const capacity = applyAll(rules.capacity.value, rules.capacityProperties, target, state);
  const moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', target, state);
  const trip = inputs.trips[node];
  const nearDropOff = rules.dropOffs.some((baseId) => hasBuilding(state, baseId));
  const walk = nearDropOff ? trip.walkSecondsCamp : trip.walkSecondsTownCenter;
  const cycle = capacity / rate + walk / moveSpeedMultiplier + trip.dropOffSeconds;
  return capacity / cycle;
}
