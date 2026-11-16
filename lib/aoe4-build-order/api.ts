// Request and response types for POST /api/aoe4-build-order/simulate and the saved-builds API. docs/api/openapi.json is the contract; keep the two in step.
import type { BuildOrder, BuildOrderIssue, FiniteNodeRef, GatherNodeId, SimInputs, SimulationResult, TripInputs } from './model';

export type { SavedBuild, SaveBuildRequest, SaveBuildResponse } from './saved-builds';

/** Per-node overrides of the trip inputs; absent fields take their defaults (Route). */
export type TripInputOverrides = Partial<TripInputs>;

/** The request `inputs`: SimInputs with every field optional, down to each node and key (Route). */
export type SimInputOverrides = Partial<Omit<SimInputs, 'trips' | 'nodeAmounts'>> & {
  trips?: Partial<Record<GatherNodeId, TripInputOverrides>>;
  nodeAmounts?: Partial<Record<FiniteNodeRef, number | null>>;
};

/** Body of POST /api/aoe4-build-order/simulate (Route). */
export interface SimulateRequest {
  buildOrder: BuildOrder;
  inputs?: SimInputOverrides;
}

/** The 200 body of the simulate route (Route). */
export type SimulateResponse = SimulationResult;

/** Most issues a 400 body lists; the rest are counted in omittedIssues (Route). */
export const MAX_REPORTED_ISSUES = 100;

/** The 400 body of the simulate route: the first issue's message, the capped issue list and the omitted count (Route). */
export interface SimulateError {
  error: string;
  issues: BuildOrderIssue[];
  omittedIssues?: number;
}

/** Error body of the saved and named builds routes: the message only (Builds routes). */
export interface BuildsError {
  error: string;
}
