// Build order input and simulation result types. Ids are aoe4world baseIds, never display names.
import type { SnapshotEffect } from './data';

/** A civilization id; English is the only civ with data (Data sources). */
export type CivId = 'english';
/** The four resources a build gathers and spends. */
export type ResourceKind = 'food' | 'wood' | 'gold' | 'stone';
/** The kinds of node villagers gather from (Model rules). */
export type GatherNodeId = 'sheep' | 'berry' | 'deer' | 'boar' | 'farm' | 'wood' | 'gold' | 'stone';
/** What a payment is for; the spent series are split by it (Outputs). */
export type SpendCategory = 'villagers' | 'military' | 'buildings' | 'research';

/** Every GatherNodeId, as a list. */
export const GATHER_NODES: readonly GatherNodeId[] = Object.keys({
  sheep: 0,
  berry: 0,
  deer: 0,
  boar: 0,
  farm: 0,
  wood: 0,
  gold: 0,
  stone: 0,
} satisfies Record<GatherNodeId, 0>) as GatherNodeId[];
/** Every ResourceKind, as a list. */
export const RESOURCE_KINDS: readonly ResourceKind[] = ['food', 'wood', 'gold', 'stone'];

const MAX_QUOTED_LENGTH = 40;

// Bounds a user-supplied string quoted in a message to its first 40 characters plus `...`.
export function shortText(value: unknown): string {
  const text = String(value);
  return text.length <= MAX_QUOTED_LENGTH ? text : `${text.slice(0, MAX_QUOTED_LENGTH)}...`;
}

/** The gather nodes that can run out; farm and wood never do (Depletion). */
export type FiniteGatherNodeId = Exclude<GatherNodeId, 'farm' | 'wood'>;
/** Every FiniteGatherNodeId, as a list. */
export const FINITE_GATHER_NODES: readonly FiniteGatherNodeId[] = GATHER_NODES.filter(
  (node): node is FiniteGatherNodeId => node !== 'farm' && node !== 'wood',
);

/** Most gold deposits a build can name: deposit 1 is written plain `gold`, deposits 2..MAX_DEPOSITS are `gold#k` (Build order input). */
export const MAX_DEPOSITS = 8;
/** The reference to gold deposit 2 or later, such as `gold#2` (Build order input). */
export type DepositRef = `gold#${2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** How a step names where villagers gather: a node or a gold deposit (Build order input). */
export type NodeRef = GatherNodeId | DepositRef;
/** A NodeRef that can run out (Depletion). */
export type FiniteNodeRef = FiniteGatherNodeId | DepositRef;

const DEPOSIT_REFS = Array.from({ length: MAX_DEPOSITS - 1 }, (_, i) => `gold#${i + 2}` as DepositRef);

function withDeposits<T extends GatherNodeId>(nodes: readonly T[]): (T | DepositRef)[] {
  return nodes.flatMap((node) => (node === 'gold' ? [node, ...DEPOSIT_REFS] : [node]));
}

/** Every NodeRef, with the gold deposits after `gold`. */
export const NODE_REFS: readonly NodeRef[] = withDeposits(GATHER_NODES);
/** Every FiniteNodeRef in a fixed order, which orders depletions and node warnings (Depletion). */
export const FINITE_NODE_REFS: readonly FiniteNodeRef[] = withDeposits(FINITE_GATHER_NODES);

/** The node kind of a ref, without any `#k` deposit suffix. */
export function nodeKindOf(ref: NodeRef): GatherNodeId {
  return ref.split('#', 1)[0] as GatherNodeId;
}

/** How serious a message is (Severity). */
export type Severity = 'error' | 'warning' | 'info' | 'debug';
/** Every Severity, most severe first (Severity). */
export const SEVERITIES: readonly Severity[] = ['error', 'warning', 'info', 'debug'];

/** What can hold a step back from starting. */
export type StepWait = 'resources' | 'villagers' | 'population' | 'prerequisite' | 'trigger' | 'earlier-step';

export type { BuildOrder, BuildStart, BuildStep, Trigger } from './schema';

/** A hand-entered value with its source and whether it is unverified (Data sources). */
export interface HandValue<T> {
  value: T;
  source: string;
  unverified: boolean;
}

/** The walk and drop-off seconds of one gather node (Model rules). */
export interface TripInputs {
  walkSecondsCamp: number;
  walkSecondsTownCenter: number;
  dropOffSeconds: number;
}

/** The tunable inputs of a simulation, which a request may override (Route). */
export interface SimInputs {
  durationSeconds: number;
  trips: Record<GatherNodeId, TripInputs>;
  // Base walk per task switch (move, build legs, rally, auto-house); a step's walkSeconds overrides it.
  walkSeconds: number;
  autoHouses: boolean;
  houseBuilders: number;
  houseBuilderSource: GatherNodeId;
  // Share of gatherers inside a building's influence once one exists, keyed by building baseId.
  influenceCoverage: Record<string, number>;
  // Starting stock per finite ref; null is infinite.
  nodeAmounts: Record<FiniteNodeRef, number | null>;
}

/**
 * Produced units of one baseId at one tier at each sample (Outputs). tier is the entry's age; counts are the
 * produced units of baseId at this tier at each sample, so a veterancy upgrade moves units to a higher series.
 * Summed over one baseId, counts are cumulative produced.
 */
export interface UnitSeries {
  unitId: string;
  baseId: string;
  name: string;
  // Display name of the whole unit line; equal for every series of one baseId, whichever tiers were produced.
  lineName: string;
  tier: number;
  counts: number[];
}

/** Completed instances of one building at each sample; under-construction buildings are not counted (Outputs). */
export interface BuildingSeries {
  baseId: string;
  name: string;
  counts: number[];
}

/** When one step was armed, started and completed, and what it waited on (Outputs). */
export interface StepTiming {
  step: number;
  status: 'completed' | 'in-progress' | 'waiting' | 'not-reached';
  armedAt: number | null;
  startedAt: number | null;
  completedAt: number | null;
  waitSeconds: number;
  waitingOn: StepWait | null;
  waitBreakdown: Partial<Record<'resources' | 'villagers' | 'population' | 'prerequisite', number>>;
}

/** The kinds of chart marker (Outputs). */
export type ChartMarkerKind = 'age-up' | 'economy' | 'unit-tier' | 'blacksmith' | 'other';

/** Every ChartMarkerKind; also the tie-break order of markers at the same instant (Outputs). */
export const CHART_MARKER_KINDS: readonly ChartMarkerKind[] = ['age-up', 'economy', 'unit-tier', 'blacksmith', 'other'];

/** The display names of ages 2 to 4, used as age-up marker labels (Outputs). */
export const AGE_NAMES: Readonly<Record<2 | 3 | 4, string>> = { 2: 'Feudal', 3: 'Castle', 4: 'Imperial' };

/** A chart marker: its kind, its time and a label, which is an age name for age-up and else the researched tech's baseId (Outputs). */
export interface ChartMarker {
  kind: ChartMarkerKind;
  label: string;
  at: number;
  // The target unit baseId of a research in the data's upgradeTargets, whatever its kind; absent otherwise and on age-ups.
  unit?: string;
}

/** The result of one simulation: series sampled over time, step timings, markers, notes and warnings (Outputs). */
export interface SimulationResult {
  civ: CivId;
  durationSeconds: number;
  sampleSeconds: number;
  times: number[];
  unitsProduced: UnitSeries[];
  // One per production building with a completed instance at some sample, sorted by its first such sample, then baseId.
  productionBuildings: BuildingSeries[];
  // Per minute.
  gatherRates: Record<ResourceKind, number[]>;
  // Villagers gathering each resource; the divisor of gatherRates.
  gatherers: Record<ResourceKind, number[]>;
  floating: Record<ResourceKind, number[]>;
  // Cumulative resources gathered; starting resources excluded.
  gathered: Record<ResourceKind, number[]>;
  // Cumulative resources paid, summed over the four kinds.
  spent: Record<SpendCategory, number[]>;
  // Popcap of spawned units and villagers; paid units still in production are not counted.
  spawnedPopulation: number[];
  // Instant spawnedPopulation first reached the population cap, or null.
  populationCapReachedAt: number | null;
  steps: StepTiming[];
  ages: { age: number; reachedAt: number }[];
  notes: BuildOrderNote[];
  // One per run ref, in FINITE_NODE_REFS order.
  depletions: NodeDepletion[];
  warnings: SimWarning[];
  // One per age reached after the start age and per completed research, sorted by at, kind, label.
  markers: ChartMarker[];
}

/** A finite ref's starting stock (null when infinite) and when it ran out (null while still stocked) (Depletion). */
export interface NodeDepletion {
  node: FiniteNodeRef;
  amount: number | null;
  depletedAt: number | null;
}

/** A warning of a result: a node ran out, villagers idle at a depleted node or with no free farm, or a step is stuck (Severity). */
export type SimWarning =
  | { code: 'node-depleted'; severity: Severity; message: string; node: FiniteNodeRef; at: number; idleVillagers: number }
  | { code: 'idle-arrival'; severity: Severity; message: string; node: FiniteNodeRef; at: number; idleVillagers: number }
  | { code: 'farm-idle'; severity: Severity; message: string; at: number; idleVillagers: number }
  | { code: 'step-stuck'; severity: Severity; message: string; step: number; waitingOn: StepWait; at: number };

/** A problem with the input: a code, a message and where it is (Build order input). */
export interface BuildOrderIssue {
  code: 'syntax' | 'unknown-trigger-kind' | 'unknown-id' | 'unsupported-tech' | 'unknown-tech-effect' | 'out-of-range' | 'invalid';
  message: string;
  step?: number;
  line?: number;
  suggestion?: string;
}

/** A note on a researched tech whose effects are ignored or not modeled (Technologies). */
export interface BuildOrderNote {
  code: 'tech-effect-ignored' | 'tech-effect-unmodeled';
  severity: Severity;
  message: string;
  step: number;
  tech: string;
  properties: string[];
}

// Pasted-text line numbers, 1-based. steps[i] is the line of order.steps[i]; no start means no start line.
export interface BuildOrderLines {
  start?: number;
  steps: number[];
}

/** How the engine treats a technology or upgrade: supported, effects ignored or unmodeled, or rejected (Technologies). */
export type TechSupport =
  | { kind: 'supported' }
  | { kind: 'effects-ignored'; properties: string[] }
  | { kind: 'effects-unmodeled' }
  | { kind: 'rejected'; code: 'unsupported-tech' | 'unknown-tech-effect'; property: string };

/** A hand-entered effect row that adds to the snapshot's effects, with what grants it and when it applies (Model rules). */
export interface OverlayEffect extends SnapshotEffect {
  // 'civ', or the baseId of a building or technology whose completion activates the effect.
  grantedBy: string;
  // Every present field must hold. age is the exact current age; nearBuilding applies to the share of
  // gatherers inside that building's influence; producer is the baseId of the producing building.
  condition?: { age?: number; nearBuilding?: string; producer?: string };
  source: string;
  unverified: boolean;
}
