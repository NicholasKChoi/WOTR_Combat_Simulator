import { RESOURCE_TOLERANCE } from './engine-common';
import type { Resources } from './engine-common';
import { isLandmark } from './landmarks';
import { AGE_NAMES, RESOURCE_KINDS } from './model';
import type { BreakdownReason, NodeRef, ResourceKind, StepWaitDetail } from './model';
import type { EngineState } from './simulate';

type Named = { baseId: string; name: string };
type Age = 2 | 3 | 4;

function named(state: Pick<EngineState, 'data'>, baseId: string): Named {
  return { baseId, name: state.data.byBaseId.get(baseId)?.[0]?.name ?? baseId };
}

// Earliest completesAt first, ties by baseId in code-unit order.
function nextLandmark(state: EngineState): Named | null {
  let picked: { baseId: string; completesAt: number } | undefined;
  for (const item of state.constructing) {
    const entry = state.data.byBaseId.get(item.baseId)?.[0];
    if (!entry || !isLandmark(entry) || entry.age !== state.age) {
      continue;
    }
    if (!picked || item.completesAt < picked.completesAt || (item.completesAt === picked.completesAt && item.baseId < picked.baseId)) {
      picked = item;
    }
  }
  return picked ? named(state, picked.baseId) : null;
}

/** A wait for an age; names the landmark of the current age under construction that completes first, only when the age is the next one (Outputs). */
export function ageWait(state: EngineState, age: number): StepWaitDetail {
  return { kind: 'age', age: age as Age, landmark: age === state.age + 1 ? nextLandmark(state) : null };
}

/** A wait for a building with no instance, or for instance `instance` of it (Outputs). */
export function buildingWait(state: EngineState, baseIds: readonly string[], instance: number | null): StepWaitDetail {
  return { kind: 'building', buildings: baseIds.map((baseId) => named(state, baseId)), instance };
}

/** A wait for a built instance to be free; `every` when a produce waits for all of its several targets (Outputs). */
export function busyWait(state: EngineState, baseIds: readonly string[], instance: number | null, every: boolean): StepWaitDetail {
  return { kind: 'building-busy', buildings: baseIds.map((baseId) => named(state, baseId)), instance, every };
}

/** A wait on the resources the bank lacks for a need, each rounded up to a whole number (Outputs). */
export function resourceWait(state: EngineState, need: Readonly<Resources>): StepWaitDetail {
  const short: Partial<Record<ResourceKind, number>> = {};
  for (const kind of RESOURCE_KINDS) {
    const missing = Math.ceil(need[kind] - state.resources[kind] - RESOURCE_TOLERANCE);
    if (missing > 0) {
      short[kind] = missing;
    }
  }
  return { kind: 'resources', short };
}

/** A wait for villagers at a node (Outputs). */
export function villagerWait(node: NodeRef, needed: number, available: number): StepWaitDetail {
  return { kind: 'villagers', node, needed, available };
}

/** A wait for population space, with the population used and the supply now (Outputs). */
export function populationWait(state: EngineState, needed: number): StepWaitDetail {
  return { kind: 'population', needed, used: state.population, supply: state.supply };
}

/** The waitBreakdown reason a detail's seconds count under (Outputs). */
export function waitReasonOf(detail: StepWaitDetail): BreakdownReason {
  switch (detail.kind) {
    case 'age':
    case 'building':
    case 'building-busy':
      return 'prerequisite';
    default:
      return detail.kind;
  }
}

/** The key two details share when they wait for the same target; a step's waitDetails has one entry per key (Outputs). */
export function waitTargetKey(detail: StepWaitDetail): string {
  switch (detail.kind) {
    case 'age':
      return `age:${detail.age}`;
    case 'building':
      return `building:${detail.buildings.map((b) => b.baseId).join(',')}#${detail.instance ?? ''}`;
    case 'building-busy':
      return `busy:${detail.buildings.map((b) => b.baseId).join(',')}#${detail.instance ?? ''}`;
    default:
      return detail.kind;
  }
}

function withArticle(name: string): string {
  if (name.startsWith('The ')) {
    return name;
  }
  return /^[AEIOU]/.test(name) ? `an ${name}` : `a ${name}`;
}

// `x`, `x and y`, `x, y and z`.
function joinAnd(parts: readonly string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function busyText(buildings: readonly Named[], instance: number | null, every: boolean): string {
  if (every) {
    return `every ${buildings[0].name} to be free`;
  }
  if (instance !== null) {
    return `${buildings[0].name} ${instance} to be free`;
  }
  return buildings.map((b) => `a free ${b.name.replace(/^The /, '')}`).join(' or ');
}

/** The words that say what a detail waits for, such as `Castle Age (King's Palace)` or `50 gold and 20 wood` (Outputs). */
export function waitDetailText(detail: StepWaitDetail): string {
  switch (detail.kind) {
    case 'age': {
      const age = `${AGE_NAMES[detail.age]} Age`;
      return detail.landmark === null ? age : `${age} (${detail.landmark.name})`;
    }
    case 'building':
      return detail.instance === null ? detail.buildings.map((b) => withArticle(b.name)).join(' or ') : `${detail.buildings[0].name} ${detail.instance}`;
    case 'building-busy':
      return busyText(detail.buildings, detail.instance, detail.every);
    case 'resources':
      return joinAnd(RESOURCE_KINDS.filter((kind) => detail.short[kind] !== undefined).map((kind) => `${detail.short[kind]} ${kind}`));
    case 'villagers': {
      const more = detail.needed - detail.available;
      return `${more} more ${more === 1 ? 'villager' : 'villagers'} at ${detail.node}`;
    }
    case 'population':
      return `${detail.needed} population space (${detail.used}/${detail.supply} used)`;
  }
}
