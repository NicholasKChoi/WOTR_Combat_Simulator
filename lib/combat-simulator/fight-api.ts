// Request and response types for POST /api/fight. docs/api/openapi.json is the contract; keep the two in step.
import type { OutcomeKind } from './battle';

export interface FightRequest {
  'attack-regs': number | string;
  'attack-elts': number | string;
  'attack-ldrs': number | string;
  'defend-regs': number | string;
  'defend-elts': number | string;
  'defend-ldrs': number | string;
  battles?: number | string;
}

export interface FightError {
  error: string;
}

export interface OutcomeTally {
  count: number;
  frequency: number;
}

export type FightOutcomes = Record<OutcomeKind, OutcomeTally>;

export interface RoundStats {
  mean: number;
  median: number;
  p10: number;
  p90: number;
}

export interface SurvivorCombination {
  regulars: number;
  elites: number;
  count: number;
  frequency: number;
}

export interface FightSurvivors {
  attacker: SurvivorCombination[];
  defender: SurvivorCombination[];
}

export interface HitsPerRound {
  attacker: number[];
  defender: number[];
}

export interface FightResponse {
  battles: number;
  outcomes: FightOutcomes;
  rounds: RoundStats;
  survivors: FightSurvivors;
  hitsPerRound: HitsPerRound;
}
