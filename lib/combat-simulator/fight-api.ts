// Request and response types for POST /api/fight. docs/api/openapi.json is the contract; keep the two in step.
import type { OutcomeKind } from './battle';

/** Fields of a POST /api/fight request: each side's unit counts and optional N, as numbers or numeric strings (Input bounds). */
export interface FightRequest {
  'attack-regs': number | string;
  'attack-elts': number | string;
  'attack-ldrs': number | string;
  'defend-regs': number | string;
  'defend-elts': number | string;
  'defend-ldrs': number | string;
  battles?: number | string;
}

/** Body of a rejected POST /api/fight request: the message. */
export interface FightError {
  error: string;
}

/** Count and share of N for one outcome (Outcome reporting). */
export interface OutcomeTally {
  count: number;
  frequency: number;
}

/** Outcome tallies keyed by attacker, defender and tie (Outcome reporting). */
export type FightOutcomes = Record<OutcomeKind, OutcomeTally>;

/** Mean, median, p10 and p90 of rounds per battle (Outcome reporting). */
export interface RoundStats {
  mean: number;
  median: number;
  p10: number;
  p90: number;
}

/** One (regulars, elites) combination left on a winning side, with its battle count and share of that side's wins (Outcome reporting). */
export interface SurvivorCombination {
  regulars: number;
  elites: number;
  count: number;
  frequency: number;
}

/** Survivor combinations for each side over the battles it won (Outcome reporting). */
export interface FightSurvivors {
  attacker: SurvivorCombination[];
  defender: SurvivorCombination[];
}

/** For each side, the share of rounds with 0 to 5 hits, indexed by hit count (Outcome reporting). */
export interface HitsPerRound {
  attacker: number[];
  defender: number[];
}

/** Body of a successful POST /api/fight: N and every reported statistic (Outcome reporting). */
export interface FightResponse {
  battles: number;
  outcomes: FightOutcomes;
  rounds: RoundStats;
  survivors: FightSurvivors;
  hitsPerRound: HitsPerRound;
}
