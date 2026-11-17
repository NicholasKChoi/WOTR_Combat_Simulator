import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import type { EffectState } from './effects';
import { canAffordHeld, costOf, heldNeed, instanceFree, markCompleted, payCost, recordUnits } from './engine-common';
import { researchMarker } from './markers';
import type { BuildOrder, BuildOrderNote } from './model';
import type { BuildingInstance, EngineState, PaidItem, StepHandler } from './simulate';
import { ageWait, buildingWait, busyWait, resourceWait } from './wait-detail';

// Every instance of the candidate buildings, in candidate order, then instance number.
function candidateInstances(state: EngineState, candidates: readonly string[]): BuildingInstance[] {
  return candidates.flatMap((baseId) => state.instances.get(baseId) ?? []);
}

function researchItem(entry: SnapshotEntry, index: number): PaidItem {
  return {
    entry,
    complete(state) {
      state.researchedIds.add(entry.id);
      convertUnits(state, entry);
      state.researched.add(entry.baseId);
      state.markers.push(researchMarker(entry, state.time, state.data.upgradeTargets.get(entry.baseId)?.value));
      markCompleted(state, index);
    },
  };
}

// The highest tier available at the current age; undefined while every tier is above it.
export function researchEntry(baseId: string, state: EffectState): SnapshotEntry | undefined {
  let picked: SnapshotEntry | undefined;
  for (const entry of state.data.byBaseId.get(baseId) ?? []) {
    if ((entry.type === 'technology' || entry.type === 'upgrade') && entry.age <= state.age && (!picked || entry.age > picked.age)) {
      picked = entry;
    }
  }
  return picked;
}

// The lowest age among a tech's technology and upgrade entries; undefined when it has none.
function lowestResearchAge(baseId: string, state: EffectState): number | undefined {
  const ages = (state.data.byBaseId.get(baseId) ?? []).filter((entry) => entry.type === 'technology' || entry.type === 'upgrade').map((entry) => entry.age);
  return ages.length === 0 ? undefined : Math.min(...ages);
}

/** The step handler for `research`: pays for the tech on the first free candidate instance, or reports what the step waits on (Model rules). */
export const researchHandler: StepHandler<'research'> = (step, index, state) => {
  const entry = researchEntry(step.tech, state);
  if (!entry) {
    const age = lowestResearchAge(step.tech, state);
    return { started: false, waitingOn: 'prerequisite', detail: age === undefined ? null : ageWait(state, age) };
  }
  const candidates = step.at === undefined ? entry.producedBy : [step.at];
  const instances = candidateInstances(state, candidates);
  if (instances.length === 0) {
    return { started: false, waitingOn: 'prerequisite', detail: buildingWait(state, candidates, null) };
  }
  const cost = costOf(entry, 1);
  if (!canAffordHeld(state, cost)) {
    return { started: false, waitingOn: 'resources', detail: resourceWait(state, heldNeed(cost, [state.houseHold])), reserve: cost };
  }
  const target = instances.find((instance) => instanceFree(state, instance, index));
  if (!target) {
    const built = candidates.filter((baseId) => (state.instances.get(baseId)?.length ?? 0) > 0);
    return { started: false, waitingOn: 'prerequisite', detail: busyWait(state, built, null, false), reserve: cost };
  }
  payCost(state, cost, 'research');
  target.paid.push(researchItem(entry, index));
  return { started: true };
};

// Moves every spawned unit the upgrade targets from a lower tier to the upgrade's tier.
export function convertUnits(state: EngineState, upgrade: SnapshotEntry): void {
  const baseId = state.data.upgradeTargets.get(upgrade.baseId)?.value;
  const target = baseId === undefined ? undefined : state.data.byBaseId.get(baseId)?.find((entry) => entry.age === upgrade.age);
  if (!target) {
    return;
  }
  let moved = 0;
  for (const record of state.spawned.values()) {
    if (record.entry.baseId === baseId && record.entry.age < target.age && record.held > 0) {
      moved += record.held;
      recordUnits(state, record.entry, -record.held);
    }
  }
  recordUnits(state, target, moved);
}

/** The entry of a unit at the highest tier researched so far, else its first entry; the tier at payment sets only a unit's cost, production time and population, and the unit spawns at the highest researched tier, never below the tier paid (Model rules). */
export function resolveUnitEntry(baseId: string, state: EffectState): SnapshotEntry | undefined {
  const entries = state.data.byBaseId.get(baseId);
  if (!entries) {
    return undefined;
  }
  let tier: number | undefined;
  for (const id of state.researchedIds) {
    const upgrade = state.data.byId.get(id);
    if (!upgrade || state.data.upgradeTargets.get(upgrade.baseId)?.value !== baseId) {
      continue;
    }
    tier = tier === undefined ? upgrade.age : Math.max(tier, upgrade.age);
  }
  return entries.find((entry) => entry.age === tier) ?? entries[0];
}

/** The notes for research steps whose tech effects are ignored or unmodeled (Technologies). */
export function researchNotes(order: BuildOrder, data: GameData): BuildOrderNote[] {
  const notes: BuildOrderNote[] = [];
  order.steps.forEach((step, index) => {
    if (step.action !== 'research') {
      return;
    }
    const entry = data.byBaseId.get(step.tech)![0];
    const support = classifyTech(entry, data);
    if (support.kind === 'effects-ignored') {
      notes.push({
        code: 'tech-effect-ignored',
        step: index,
        tech: step.tech,
        properties: support.properties,
        severity: 'debug',
        message: `${entry.baseId}: its effect on ${support.properties.join(', ')} is not simulated; it still costs resources and queue time.`,
      });
    } else if (support.kind === 'effects-unmodeled') {
      notes.push({
        code: 'tech-effect-unmodeled',
        step: index,
        tech: step.tech,
        properties: [],
        severity: 'debug',
        message: `${entry.baseId}: its effect is not simulated; it still costs resources and queue time.`,
      });
    }
  });
  return notes;
}
