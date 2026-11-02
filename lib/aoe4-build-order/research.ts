import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import type { EffectState } from './effects';
import { canAfford, costOf, markCompleted, payCost } from './engine-common';
import type { BuildOrder, BuildOrderNote } from './model';
import type { BuildingInstance, EngineState, PaidItem, StepHandler } from './simulate';

// Queue length is not consulted: the first candidate building with an instance takes it on instance 1.
function researchTarget(state: EngineState, candidates: readonly string[]): BuildingInstance | undefined {
  for (const baseId of candidates) {
    const first = state.instances.get(baseId)?.[0];
    if (first) {
      return first;
    }
  }
  return undefined;
}

function researchItem(entry: SnapshotEntry, index: number): PaidItem {
  return {
    entry,
    complete(state) {
      state.researchedIds.add(entry.id);
      state.researched.add(entry.baseId);
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

export const researchHandler: StepHandler<'research'> = (step, index, state) => {
  const entry = researchEntry(step.tech, state);
  if (!entry) {
    return { started: false };
  }
  const target = researchTarget(state, step.at === undefined ? entry.producedBy : [step.at]);
  if (!target) {
    return { started: false };
  }
  const cost = costOf(entry, 1);
  if (!canAfford(state.resources, cost)) {
    return { started: false, reserve: cost };
  }
  payCost(state, cost, 'research');
  target.paid.push(researchItem(entry, index));
  return { started: true };
};

// A unit's entry is read when it is paid, so a unit paid before an upgrade completes keeps the lower tier.
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

export function researchNotes(order: BuildOrder, data: GameData): BuildOrderNote[] {
  const notes: BuildOrderNote[] = [];
  order.steps.forEach((step, index) => {
    if (step.action !== 'research') {
      return;
    }
    const entry = data.byBaseId.get(step.tech)[0];
    const support = classifyTech(entry, data);
    if (support.kind === 'effects-ignored') {
      notes.push({
        code: 'tech-effect-ignored',
        step: index,
        tech: step.tech,
        properties: support.properties,
        severity: 'info',
        message: `${entry.baseId}: its effect on ${support.properties.join(', ')} is not simulated; it still costs resources and queue time.`,
      });
    } else if (support.kind === 'effects-unmodeled') {
      notes.push({
        code: 'tech-effect-unmodeled',
        step: index,
        tech: step.tech,
        properties: [],
        severity: 'info',
        message: `${entry.baseId}: its effect is not simulated; it still costs resources and queue time.`,
      });
    }
  });
  return notes;
}
