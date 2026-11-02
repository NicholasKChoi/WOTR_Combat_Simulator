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

// An omitted trigger means the step has no condition.
export type Trigger = { kind: 'time'; seconds: number } | { kind: 'villagers'; count: number };

export type BuildStep = { trigger?: Trigger } & (
  // No count means continuous production; rally only for villagers and sets the producer's rally; walkSeconds only with rally.
  | { action: 'produce'; producer: string; instance?: number; unit: string; count?: number; rally?: GatherNodeId; walkSeconds?: number }
  // Rallies villagers that start from this step on; costs nothing.
  | { action: 'rally'; producer: string; instance?: number; to: GatherNodeId; walkSeconds?: number }
  | { action: 'pause'; producer: string; instance?: number }
  // builders defaults to 1, then defaults to from.
  | { action: 'build'; building: string; builders?: number; from: GatherNodeId; then?: GatherNodeId; walkSeconds?: number }
  // Technologies and unit upgrades (veterancy tiers).
  | { action: 'research'; tech: string; at?: string }
  | { action: 'move'; count: number; from: GatherNodeId; to: GatherNodeId; walkSeconds?: number }
);

export interface BuildOrder {
  civ: CivId;
  name: string;
  source?: string;
  start?: BuildStart;
  steps: BuildStep[];
}

// The t=0 villager split (absent means the civ's default split) and the rally in effect at t=0.
export interface BuildStart {
  villagers?: Partial<Record<GatherNodeId, number>>;
  rally?: GatherNodeId;
}

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
}

// tier is the entry's age; counts are cumulative and include produced units only.
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
  steps: StepTiming[];
  ages: { age: number; reachedAt: number }[];
  notes: BuildOrderNote[];
}

export interface BuildOrderIssue {
  code: 'syntax' | 'unknown-trigger-kind' | 'unknown-id' | 'unsupported-tech' | 'unknown-tech-effect' | 'out-of-range' | 'invalid';
  message: string;
  step?: number;
  line?: number;
}

export interface BuildOrderNote {
  code: 'tech-effect-ignored' | 'tech-effect-unmodeled';
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
