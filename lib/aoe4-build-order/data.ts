import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json';
import baseRules from '../../data/aoe4-build-order/rules/base.json';
import englishRules from '../../data/aoe4-build-order/rules/english.json';
import type { CivId, GatherNodeId, HandValue, OverlayEffect, ResourceKind } from './model';

/** Where the pinned aoe4world snapshot came from: repo, commit, fetch time and game patch (Data sources). */
export interface SnapshotSource {
  repo: string;
  commit: string;
  committedAt: string;
  fetchedAt: string;
  // The game patch live on committedAt; the upstream files carry none, so patchSource is the URL stating it.
  patch: string;
  patchSource: string;
}

/** One effect row of a snapshot entry, in the aoe4world effect format (Data sources). */
export interface SnapshotEffect {
  property: string;
  select: { id?: string[]; class?: string[][] };
  effect: string;
  value: number;
  type: string;
}

/** One unit, building, technology or upgrade of the snapshot; upstream entries keep every field, and only the ones the simulator reads are typed (Data sources). */
export interface SnapshotEntry {
  id: string;
  baseId: string;
  name: string;
  type: 'unit' | 'building' | 'technology' | 'upgrade';
  civs: string[];
  age: number;
  classes: string[];
  producedBy: string[];
  costs: { food: number; wood: number; gold: number; stone: number; popcap: number; time: number };
  effects?: SnapshotEffect[];
  description?: string;
}

/** Hand-entered rules of one gather node: rate, capacity, drop-offs, trip times and optional starting stock (Data sources). */
export interface GatherNodeRules {
  resource: ResourceKind;
  rate: HandValue<number>;
  capacity: HandValue<number>;
  rateProperties: string[];
  capacityProperties: string[];
  dropOffs: string[];
  trip: { walkSecondsCamp: HandValue<number>; walkSecondsTownCenter: HandValue<number>; dropOffSeconds: HandValue<number> };
  // Starting stock of one deposit; absent is infinite.
  amount?: HandValue<number>;
  // baseId of the building that creates this node; its builders start gathering it with no walk back.
  createdBy?: string;
}

/** The hand-entered rules shared by every civ: gather nodes, builder scaling, population and walk limits (Data sources). */
export interface BaseRules {
  gatherNodes: Record<GatherNodeId, GatherNodeRules>;
  builderScaling: { numerator: HandValue<number>; offset: HandValue<number> };
  maxPopCap: HandValue<number>;
  villagerTarget: HandValue<number>;
  walkSeconds: HandValue<number>;
}

/** The hand-entered rules of one civ: starting state, supply, overlay effects and upgrade targets (Data sources). */
export interface CivData {
  startingState: {
    age: HandValue<number>;
    resources: HandValue<Record<ResourceKind, number>>;
    villagers: HandValue<Record<GatherNodeId, number>>;
    units: HandValue<Record<string, number>>;
    buildings: HandValue<string[]>;
  };
  supply: Record<string, HandValue<number>>;
  effects: OverlayEffect[];
  upgradeTargets: Record<string, HandValue<string>>;
}

/** The indexed data of one civ that the engine reads; look ids up only through the Maps, since a user id such as __proto__ must find nothing (Data sources). */
export interface GameData {
  civ: CivId;
  source: SnapshotSource;
  byId: ReadonlyMap<string, SnapshotEntry>;
  byBaseId: ReadonlyMap<string, readonly SnapshotEntry[]>;
  base: BaseRules;
  civData: CivData;
  supply: ReadonlyMap<string, HandValue<number>>;
  upgradeTargets: ReadonlyMap<string, HandValue<string>>;
}

/** A civ's snapshot file: its source and its units, buildings, technologies and upgrades (Data sources). */
export interface Snapshot {
  source: SnapshotSource;
  units: SnapshotEntry[];
  buildings: SnapshotEntry[];
  technologies: SnapshotEntry[];
  upgrades: SnapshotEntry[];
}

const CIV_FILES = new Map<CivId, { snapshot: Snapshot; civData: CivData }>([
  ['english', { snapshot: englishSnapshot as unknown as Snapshot, civData: englishRules as unknown as CivData }],
]);

const loaded = new Map<CivId, GameData>();

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function checkStartingUnits(civData: CivData, byBaseId: ReadonlyMap<string, readonly SnapshotEntry[]>): void {
  for (const baseId of Object.keys(civData.startingState.units.value)) {
    if (byBaseId.get(baseId)?.[0].type !== 'unit') {
      throw new Error(`startingState.units: "${baseId}" is not a unit baseId in the snapshot`);
    }
  }
}

/**
 * Indexes a snapshot with its rules into GameData, rejecting duplicate ids and unknown starting units (Data sources).
 * The engine shares one GameData across requests, so everything reachable from it is frozen: a stray write would
 * otherwise leak into later runs and break same-input, same-timings. The snapshot, base and civData passed in are
 * frozen in place; pass copies to keep them writable.
 */
export function buildGameData(civ: CivId, snapshot: Snapshot, base: BaseRules, civData: CivData): GameData {
  const entries = [...snapshot.units, ...snapshot.buildings, ...snapshot.technologies, ...snapshot.upgrades];
  const byId = new Map<string, SnapshotEntry>();
  const byBaseId = new Map<string, SnapshotEntry[]>();
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      throw new Error(`duplicate snapshot id "${entry.id}" for civ ${civ}`);
    }
    byId.set(entry.id, entry);
    const tiers = byBaseId.get(entry.baseId) ?? [];
    tiers.push(entry);
    byBaseId.set(entry.baseId, tiers);
  }
  for (const tiers of byBaseId.values()) {
    tiers.sort((a, b) => a.age - b.age);
  }
  checkStartingUnits(civData, byBaseId);

  deepFreeze(snapshot.source);
  entries.forEach(deepFreeze);
  byBaseId.forEach(deepFreeze);
  return Object.freeze({
    civ,
    source: snapshot.source,
    byId,
    byBaseId,
    base: deepFreeze(base),
    civData: deepFreeze(civData),
    supply: new Map(Object.entries(civData.supply)),
    upgradeTargets: new Map(Object.entries(civData.upgradeTargets)),
  });
}

/** Returns the GameData of a civ, built once and cached; synchronous, and throws for a civ with no data (Data sources). */
export function loadGameData(civ: CivId): GameData {
  const cached = loaded.get(civ);
  if (cached) {
    return cached;
  }
  const files = CIV_FILES.get(civ);
  if (!files) {
    throw new Error(`no game data for civ "${civ}"`);
  }
  const data = buildGameData(civ, files.snapshot, baseRules as unknown as BaseRules, files.civData);
  loaded.set(civ, data);
  return data;
}
