import { BaseArmy } from './army';

export const OUTCOME_KINDS = ['attacker', 'defender', 'tie'] as const;
export type OutcomeKind = typeof OUTCOME_KINDS[number];

const SURVIVOR_LABELS: Record<OutcomeKind, string> = {
  attacker: "attack",
  defender: "defend",
  tie: "n/a",
};

export function battleOutcome(attack: BaseArmy, defend: BaseArmy): OutcomeKind {
  const attackAlive = attack.isArmyAlive();
  const defendAlive = defend.isArmyAlive();
  if (attackAlive && defendAlive) {
    throw new Error('battle is not finished: both armies are still alive');
  }
  if (attackAlive) {
    return 'attacker';
  }
  if (defendAlive) {
    return 'defender';
  }
  return 'tie';
}

export class BattleResult {
  attackArmy: BaseArmy;
  defendArmy: BaseArmy;

  // data
  rounds: number = 0;
  attackHitsPerRound: number[];
  defendHitsPerRound: number[];

  constructor(attack: BaseArmy, defend: BaseArmy) {
    this.attackArmy = attack;
    this.defendArmy = defend;
    this.attackHitsPerRound = [];
    this.defendHitsPerRound = [];
  }

  recordRound(attackHits: number, defendHits: number) {
    this.rounds++;
    this.attackHitsPerRound.push(attackHits);
    this.defendHitsPerRound.push(defendHits);
  }

  getSurvivor(): string {
    return SURVIVOR_LABELS[battleOutcome(this.attackArmy, this.defendArmy)];
  }

  getStats(): BattleStats {
    let survivor = this.getSurvivor();
    let totalAHits = this.attackHitsPerRound.reduce((total, next) => total + next, 0);
    let totalDHits = this.defendHitsPerRound.reduce((total, next) => total + next, 0);
    let averageAttackHitsPerRound = totalAHits / this.rounds;
    let averageDefendHitsPerRound = totalDHits / this.rounds;
    let rounds = this.rounds;

    return {
      attack: this.attackArmy,
      defend: this.defendArmy,
      rounds,
      averageAttackHitsPerRound,
      averageDefendHitsPerRound,
      survivor
    }
  }
}

export interface BattleStats {
  attack: BaseArmy;
  defend: BaseArmy;
  rounds: number;
  averageAttackHitsPerRound: number;
  averageDefendHitsPerRound: number;
  survivor: string;
}

export type DiceRoller = (numDice: number) => number[];

export function rollDice(numdice: number): number[] {
  let min = 1;
  let max = 6;
  let results: number[] = [];
  min = Math.ceil(min);
  max = Math.floor(max);

  for (let i = 0 ; i < numdice; i++) {
    let result = Math.floor(Math.random() * (max - min + 1)) + min;
    results = results.concat(result);
  }
  return results;
}


interface CombatRollOps {
  diceRoll: number[];
  threshold?: number;
}
interface CombatRollResults {
  hits: number[];
  misses: number[];
}
function calculateCombatRollResults(opts: CombatRollOps): CombatRollResults {
  let threshold = opts.threshold || 5;
  let hits: number[] = [];
  let misses: number[] = [];
  for (let i = 0; i < opts.diceRoll.length; i++) {
    let thisDice = opts.diceRoll[i];
    if (thisDice > threshold) {
      hits = hits.concat(thisDice);
    } else {
      misses = misses.concat(thisDice);
    }
  }
  return { hits: hits, misses: misses };
}


export function resolveRound(battle: BattleResult, roll: DiceRoller): void {
  let attack = battle.attackArmy;
  let defend = battle.defendArmy;

  // combat
  let attackCombatRoll = roll(attack.getCombatStrength());
  let attackCombatResult = calculateCombatRollResults({diceRoll: attackCombatRoll});

  let defenseCombat = roll(defend.getCombatStrength());
  let defendCombatResult = calculateCombatRollResults({diceRoll: defenseCombat});

  // leaders
  let attackLeaderRoll = roll(Math.min(attackCombatResult.misses.length, attack.leaders));
  let attackLeaderResult = calculateCombatRollResults({diceRoll: attackLeaderRoll});

  let defendLeaderRoll = roll(Math.min(defendCombatResult.misses.length, defend.leaders));
  let defendLeaderResult = calculateCombatRollResults({diceRoll: defendLeaderRoll});
  
  // take combat hits
  let attackHits = attackCombatResult.hits.length + attackLeaderResult.hits.length;
  let defendHits = defendCombatResult.hits.length + defendLeaderResult.hits.length;
  attack.takeHits(defendHits);
  defend.takeHits(attackHits);

  // record number of rounds in the battle
  battle.recordRound(attackHits, defendHits);
  console.log(
    battle,
    attackCombatRoll,
    attackCombatResult,
    attackLeaderRoll,
    attackLeaderResult,
    attackHits,
    defenseCombat,
    defendCombatResult,
    defendLeaderRoll,
    defendLeaderResult,
    defendHits);
}

// Later termination rules, such as a round limit, are added as fields here.
export type BattleOptions = {};

export function shouldStop(battle: BattleResult, options: BattleOptions): boolean {
  return !battle.attackArmy.isArmyAlive() || !battle.defendArmy.isArmyAlive();
}

export function Battle(attack: BaseArmy, defend: BaseArmy, roll: DiceRoller = rollDice, options: BattleOptions = {}): BattleResult {
  const battleResult = new BattleResult(attack, defend);

  while (!shouldStop(battleResult, options)) {
    resolveRound(battleResult, roll);
  }
  console.log("Final result", battleResult);
  return battleResult;
}
