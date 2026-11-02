// Request and response types for POST /api/aoe4-build-order/simulate. docs/api/openapi.json is the contract; keep the two in step.
import type { BuildOrder, BuildOrderIssue, FiniteNodeRef, GatherNodeId, SimInputs, SimulationResult, TripInputs } from './model';

export type TripInputOverrides = Partial<TripInputs>;

export type SimInputOverrides = Partial<Omit<SimInputs, 'trips' | 'nodeAmounts'>> & {
  trips?: Partial<Record<GatherNodeId, TripInputOverrides>>;
  nodeAmounts?: Partial<Record<FiniteNodeRef, number | null>>;
};

export interface SimulateRequest {
  text?: string;
  buildOrder?: BuildOrder;
  inputs?: SimInputOverrides;
}

export type SimulateResponse = SimulationResult;

export const MAX_REPORTED_ISSUES = 100;

export interface SimulateError {
  error: string;
  issues: BuildOrderIssue[];
  omittedIssues?: number;
}
