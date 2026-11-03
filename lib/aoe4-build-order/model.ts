// Build order input and simulation result types. Ids are aoe4world baseIds, never display names.
import type { SnapshotEffect } from './data';

export type CivId = 'english';
export type ResourceKind = 'food' | 'wood' | 'gold' | 'stone';
export type GatherNodeId = 'sheep' | 'berry' | 'deer' | 'boar' | 'farm' | 'wood' | 'gold' | 'stone';
export type SpendCategory = 'villagers' | 'military' | 'buildings' | 'research';

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
export const RESOURCE_KINDS: readonly ResourceKind[] = ['food', 'wood', 'gold', 'stone'];

// farm and wood never run out.
export type FiniteGatherNodeId = Exclude<GatherNodeId, 'farm' | 'wood'>;
export const FINITE_GATHER_NODES: readonly FiniteGatherNodeId[] = GATHER_NODES.filter(
  (node): node is FiniteGatherNodeId => node !== 'farm' && node !== 'wood',
);

// Deposit 1 is written plain `gold`; deposits 2..MAX_DEPOSITS are `gold#k`.
export const MAX_DEPOSITS = 8;
export type DepositRef = `gold#${2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type NodeRef = GatherNodeId | DepositRef;
export type FiniteNodeRef = FiniteGatherNodeId | DepositRef;

const DEPOSIT_REFS = Array.from({ length: MAX_DEPOSITS - 1 }, (_, i) => `gold#${i + 2}` as DepositRef);

function withDeposits<T extends GatherNodeId>(nodes: readonly T[]): (T | DepositRef)[] {
  return nodes.flatMap((node) => (node === 'gold' ? [node, ...DEPOSIT_REFS] : [node]));
}

export const NODE_REFS: readonly NodeRef[] = withDeposits(GATHER_NODES);
export const FINITE_NODE_REFS: readonly FiniteNodeRef[] = withDeposits(FINITE_GATHER_NODES);

export function nodeKindOf(ref: NodeRef): GatherNodeId {
  return ref.split('#', 1)[0] as GatherNodeId;
}

export type Severity = 'error' | 'warning' | 'info';
// Most severe first.
export const SEVERITIES: readonly Severity[] = ['error', 'warning', 'info'];

export type StepWait = 'resources' | 'villagers' | 'population' | 'prerequisite' | 'trigger' | 'earlier-step';

export type { BuildOrder, BuildStart, BuildStep, Trigger } from './schema';

export interface HandValue<T> {
  value: T;
  source: string;
  unverified: boolean;
}

export interface TripInputs {
  walkSecondsCamp: number;
  walkSecondsTownCenter: number;
  dropOffSeconds: number;
}

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

// tier is the entry's age; counts are the produced units of baseId at this tier at each sample, so a
// veterancy upgrade moves units to a higher series. Summed over one baseId, counts are cumulative produced.
export interface UnitSeries {
  unitId: string;
  baseId: string;
  name: string;
  tier: number;
  counts: number[];
}

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

export type ChartMarkerKind = 'age-up' | 'economy' | 'unit-tier' | 'blacksmith' | 'other';

// Also the tie-break order of markers at the same instant.
export const CHART_MARKER_KINDS: readonly ChartMarkerKind[] = ['age-up', 'economy', 'unit-tier', 'blacksmith', 'other'];

export const AGE_NAMES: Readonly<Record<2 | 3 | 4, string>> = { 2: 'Feudal', 3: 'Castle', 4: 'Imperial' };

// label is an age name for age-up, else the researched tech's baseId.
export interface ChartMarker {
  kind: ChartMarkerKind;
  label: string;
  at: number;
}

export interface SimulationResult {
  civ: CivId;
  durationSeconds: number;
  sampleSeconds: number;
  times: number[];
  unitsProduced: UnitSeries[];
  // Per minute.
  gatherRates: Record<ResourceKind, number[]>;
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

// amount is the starting stock, null when infinite; depletedAt is null while the ref is still stocked.
export interface NodeDepletion {
  node: FiniteNodeRef;
  amount: number | null;
  depletedAt: number | null;
}

export type SimWarning =
  | { code: 'node-depleted'; severity: Severity; message: string; node: FiniteNodeRef; at: number; idleVillagers: number }
  | { code: 'idle-arrival'; severity: Severity; message: string; node: FiniteNodeRef; at: number; idleVillagers: number }
  | { code: 'step-stuck'; severity: Severity; message: string; step: number; waitingOn: StepWait; at: number }
  | { code: 'auto-houses-never-start'; severity: Severity; message: string; step: number; at: number }
  | { code: 'auto-houses-held'; severity: Severity; message: string; step: number; at: number; seconds: number };

export interface BuildOrderIssue {
  code: 'syntax' | 'unknown-trigger-kind' | 'unknown-id' | 'unsupported-tech' | 'unknown-tech-effect' | 'out-of-range' | 'invalid';
  message: string;
  step?: number;
  line?: number;
  suggestion?: string;
}

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

export type TechSupport =
  | { kind: 'supported' }
  | { kind: 'effects-ignored'; properties: string[] }
  | { kind: 'effects-unmodeled' }
  | { kind: 'rejected'; code: 'unsupported-tech' | 'unknown-tech-effect'; property: string };

export interface OverlayEffect extends SnapshotEffect {
  // 'civ', or the baseId of a building or technology whose completion activates the effect.
  grantedBy: string;
  // Every present field must hold. age is the exact current age; nearBuilding applies to the share of
  // gatherers inside that building's influence; producer is the baseId of the producing building.
  condition?: { age?: number; nearBuilding?: string; producer?: string };
  source: string;
  unverified: boolean;
}
