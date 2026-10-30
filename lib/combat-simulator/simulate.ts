import { Army, BaseArmy } from './army';
import { Battle, BattleOptions, DiceRoller, OUTCOME_KINDS, battleOutcome, rollDice } from './battle';

export const DEFAULT_BATTLES = 1000;
export const MAX_BATTLES = 100000;
export const MAX_HITS_PER_ROUND = 5;

const SIDES = ['attacker', 'defender'] as const;
type Side = typeof SIDES[number];

export interface OutcomeTally {
  count: number;
  frequency: number;
}

export interface SurvivorTally {
  regulars: number;
  elites: number;
  count: number;
  frequency: number;
}

export interface RoundStats {
  mean: number;
  median: number;
  p10: number;
  p90: number;
}

export interface SimulationSummary {
  battles: number;
  outcomes: Record<string, OutcomeTally>;
  rounds: RoundStats;
  survivors: Record<Side, SurvivorTally[]>;
  hitsPerRound: Record<Side, number[]>;
}

export interface BattleRecord {
  outcome: string;
  rounds: number;
  // The winning side's remaining units; required when the outcome names a side.
  winner?: { regulars: number; elites: number };
  attackHitsPerRound: number[];
  defendHitsPerRound: number[];
}

function isSide(kind: string): kind is Side {
  return (SIDES as readonly string[]).includes(kind);
}

// Nearest-rank: integer p keeps the rank exact (0.1 * 30 is 3.0000000000000004, whose ceiling is 4).
function nearestRank(sorted: Int32Array, p: number): number {
  return sorted[Math.ceil((p * sorted.length) / 100) - 1];
}

function newHitTally(): number[] {
  return new Array(MAX_HITS_PER_ROUND + 1).fill(0);
}

export class OutcomeAccumulator {
  private readonly kinds: readonly string[];
  private readonly outcomeCounts = new Map<string, number>();
  private readonly roundCounts: number[] = [];
  private totalRounds = 0;
  private readonly survivorTallies: Record<Side, Map<string, SurvivorTally>> = {
    attacker: new Map(),
    defender: new Map(),
  };
  private readonly hitTallies: Record<Side, number[]> = {
    attacker: newHitTally(),
    defender: newHitTally(),
  };

  constructor(kinds: readonly string[] = OUTCOME_KINDS) {
    this.kinds = kinds;
    for (const kind of kinds) {
      this.outcomeCounts.set(kind, 0);
    }
  }

  record(battle: BattleRecord): void {
    if (!this.outcomeCounts.has(battle.outcome)) {
      throw new Error(`unknown outcome kind: ${battle.outcome}`);
    }
    if (isSide(battle.outcome) && !battle.winner) {
      throw new Error(`a ${battle.outcome} win needs the winner's surviving units`);
    }
    const hitArrays: [Side, number[]][] = [
      ['attacker', battle.attackHitsPerRound],
      ['defender', battle.defendHitsPerRound],
    ];
    for (const [side, hits] of hitArrays) {
      if (hits.length !== battle.rounds) {
        throw new Error(`${side} has ${hits.length} per-round hit counts for ${battle.rounds} rounds`);
      }
      for (const h of hits) {
        if (!Number.isInteger(h) || h < 0 || h > MAX_HITS_PER_ROUND) {
          throw new Error(`${side} hit count ${h} is outside 0-${MAX_HITS_PER_ROUND}`);
        }
      }
    }

    this.outcomeCounts.set(battle.outcome, this.outcomeCounts.get(battle.outcome) + 1);
    this.roundCounts.push(battle.rounds);
    this.totalRounds += battle.rounds;
    for (const [side, hits] of hitArrays) {
      for (const h of hits) {
        this.hitTallies[side][h]++;
      }
    }
    if (isSide(battle.outcome)) {
      this.tallySurvivors(battle.outcome, battle.winner);
    }
  }

  private tallySurvivors(side: Side, winner: { regulars: number; elites: number }): void {
    const key = `${winner.regulars},${winner.elites}`;
    const tally = this.survivorTallies[side].get(key);
    if (tally) {
      tally.count++;
    } else {
      this.survivorTallies[side].set(key, {
        regulars: winner.regulars,
        elites: winner.elites,
        count: 1,
        frequency: 0,
      });
    }
  }

  summary(): SimulationSummary {
    const battles = this.roundCounts.length;
    if (battles === 0) {
      throw new Error('no battles recorded');
    }

    const outcomes: Record<string, OutcomeTally> = {};
    for (const kind of this.kinds) {
      const count = this.outcomeCounts.get(kind);
      outcomes[kind] = { count, frequency: count / battles };
    }

    const sortedRounds = Int32Array.from(this.roundCounts).sort();
    const rounds: RoundStats = {
      mean: this.totalRounds / battles,
      median: nearestRank(sortedRounds, 50),
      p10: nearestRank(sortedRounds, 10),
      p90: nearestRank(sortedRounds, 90),
    };

    return {
      battles,
      outcomes,
      rounds,
      survivors: {
        attacker: this.survivorSummary('attacker'),
        defender: this.survivorSummary('defender'),
      },
      hitsPerRound: {
        attacker: this.hitTallies.attacker.map((n) => n / this.totalRounds),
        defender: this.hitTallies.defender.map((n) => n / this.totalRounds),
      },
    };
  }

  private survivorSummary(side: Side): SurvivorTally[] {
    const tallies = Array.from(this.survivorTallies[side].values());
    const wins = tallies.reduce((total, tally) => total + tally.count, 0);
    return tallies.map((tally) => ({
      ...tally,
      frequency: tally.count / wins,
    })).sort((a, b) => b.count - a.count || b.regulars - a.regulars || b.elites - a.elites);
  }
}

export function simulateBattles(
  attack: Army,
  defend: Army,
  battles: number,
  roll: DiceRoller = rollDice,
  options: BattleOptions = {},
): SimulationSummary {
  if (!Number.isSafeInteger(battles) || battles < 1 || battles > MAX_BATTLES) {
    throw new RangeError(`battles must be a whole number between 1 and ${MAX_BATTLES}`);
  }
  const accumulator = new OutcomeAccumulator();
  for (let i = 0; i < battles; i++) {
    const attackArmy = new BaseArmy(attack.regulars, attack.elites, attack.leaders);
    const defendArmy = new BaseArmy(defend.regulars, defend.elites, defend.leaders);
    const result = Battle(attackArmy, defendArmy, roll, options);
    const outcome = battleOutcome(attackArmy, defendArmy);
    const winner = outcome === 'attacker' ? attackArmy : outcome === 'defender' ? defendArmy : undefined;
    accumulator.record({
      outcome,
      rounds: result.rounds,
      winner,
      attackHitsPerRound: result.attackHitsPerRound,
      defendHitsPerRound: result.defendHitsPerRound,
    });
  }
  return accumulator.summary();
}
