import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import { VILLAGER_ID } from './engine-common';
import {
  FINITE_NODE_REFS,
  NODE_REFS,
  RESOURCE_KINDS,
  type BuildStep,
  type FiniteNodeRef,
  type NodeRef,
  type ResourceKind,
  type Trigger,
} from './model';

export interface StepOptions {
  actions: readonly BuildStep['action'][];
  triggerKinds: readonly ('none' | Trigger['kind'])[];
  nodes: readonly NodeRef[];
  finiteNodes: readonly FiniteNodeRef[];
  resources: readonly ResourceKind[];
  buildings: readonly string[];
  producers: readonly string[];
  villagerProducers: readonly string[];
  unitsByProducer: Readonly<Record<string, readonly string[]>>;
  techs: readonly string[];
  techSites: Readonly<Record<string, readonly string[]>>;
  names: Readonly<Record<string, string>>;
}

const ACTIONS: readonly BuildStep['action'][] = ['produce', 'pause', 'build', 'research', 'move', 'rally'];
const TRIGGER_KINDS: StepOptions['triggerKinds'] = ['none', 'time', 'villagers', 'depleted', 'bank'];

export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function entriesOfType(data: GameData, types: readonly SnapshotEntry['type'][]): [string, readonly SnapshotEntry[]][] {
  return [...data.byBaseId].filter(([, entries]) => entries.some((entry) => types.includes(entry.type)));
}

function sortedByAge(groups: readonly (readonly [string, readonly SnapshotEntry[]])[]): string[] {
  const lowestAge = (entries: readonly SnapshotEntry[]) => Math.min(...entries.map((entry) => entry.age));
  return [...groups]
    .sort(([idA, a], [idB, b]) => lowestAge(a) - lowestAge(b) || compareCodeUnits(idA, idB))
    .map(([baseId]) => baseId);
}

function unionOf(entries: readonly SnapshotEntry[], pick: (entry: SnapshotEntry) => readonly string[]): Set<string> {
  return new Set(entries.flatMap(pick));
}

export function stepOptions(data: GameData): StepOptions {
  const ageOf = (baseId: string) => data.byBaseId.get(baseId) ?? [];
  const byAge = (ids: Iterable<string>) => sortedByAge([...ids].map((id) => [id, ageOf(id)] as const));

  const buildingGroups = entriesOfType(data, ['building']);
  const unitGroups = entriesOfType(data, ['unit']);
  const unitEntries = unitGroups.flatMap(([, entries]) => entries);

  const unitsByProducer = new Map<string, Set<string>>();
  for (const unit of unitEntries) {
    for (const producer of unit.producedBy) {
      unitsByProducer.set(producer, (unitsByProducer.get(producer) ?? new Set()).add(unit.baseId));
    }
  }

  const techGroups = entriesOfType(data, ['technology', 'upgrade']).filter(([, entries]) =>
    entries.every((entry) => classifyTech(entry, data).kind !== 'rejected'),
  );

  const buildings = sortedByAge(buildingGroups);
  const producers = byAge([...unitsByProducer.keys()].filter((id) => buildings.includes(id)));
  const techs = sortedByAge(techGroups);
  const producedUnits = new Set(producers.flatMap((producer) => [...(unitsByProducer.get(producer) ?? [])]));
  // byBaseId lists each baseId's entries by age, so the first entry of a type is its lowest-age name.
  const nameOf = (types: readonly SnapshotEntry['type'][]) => (baseId: string) =>
    [baseId, ageOf(baseId).find((entry) => types.includes(entry.type))?.name ?? baseId] as const;
  const names = Object.fromEntries([
    ...buildings.map(nameOf(['building'])),
    ...[...producedUnits].map(nameOf(['unit'])),
    ...techs.map(nameOf(['technology', 'upgrade'])),
  ]);
  return {
    actions: ACTIONS,
    triggerKinds: TRIGGER_KINDS,
    nodes: NODE_REFS,
    finiteNodes: FINITE_NODE_REFS,
    resources: RESOURCE_KINDS,
    buildings,
    producers,
    villagerProducers: byAge(unionOf(ageOf(VILLAGER_ID), (entry) => entry.producedBy)),
    unitsByProducer: Object.fromEntries(producers.map((producer) => [producer, byAge(unitsByProducer.get(producer) ?? [])])),
    techs,
    techSites: Object.fromEntries(
      techGroups.map(([tech, entries]) => [tech, byAge(unionOf(entries, (entry) => entry.producedBy))]),
    ),
    names,
  };
}
