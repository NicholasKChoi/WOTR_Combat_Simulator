// Request and response types for POST /api/aoe4-build-order/simulate. docs/api/openapi.json is the contract; keep the two in step.
import type { BuildOrder, BuildOrderIssue, GatherNodeId, SimInputs, SimulationResult, TripInputs } from './model';

export type TripInputOverrides = Partial<TripInputs>;

export type SimInputOverrides = Partial<Omit<SimInputs, 'trips'>> & { trips?: Partial<Record<GatherNodeId, TripInputOverrides>> };

export interface SimulateRequest {
  text?: string;
  buildOrder?: BuildOrder;
  inputs?: SimInputOverrides;
}

export type SimulateResponse = SimulationResult;

export interface SimulateError {
  error: string;
  issues: BuildOrderIssue[];
}
