import { BaseArmy } from './army';

/** The three ways a battle ends: attacker win, defender win or tie (Round order). */
export const OUTCOME_KINDS = ['attacker', 'defender', 'tie'] as const;
/** The outcome of one finished battle, named by the winning side or tie (Round order). */
export type OutcomeKind = typeof OUTCOME_KINDS[number];

const SURVIVOR_LABELS: Record<OutcomeKind, string> = {
  attacker: "attack",
  defender: "defend",
  tie: "n/a",
};

/** Names the outcome of a finished battle from which armies still have combat strength; throws while both do (Round order). */
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

/** Records one battle's armies, round count and each side's hits per round. */
export class BattleResult {
  attackArmy: BaseArmy;
  defendArmy: BaseArmy;

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

/** Summary of one battle: the final armies, rounds, mean hits per round and the survivor label. */
export interface BattleStats {
  attack: BaseArmy;
  defend: BaseArmy;
  rounds: number;
  averageAttackHitsPerRound: number;
  averageDefendHitsPerRound: number;
  survivor: string;
}

/** Rolls the given number of six-sided dice; callers swap it to control the random source. */
export type DiceRoller = (numDice: number) => number[];

/** Most combat dice a side rolls per round (Round order); separate from the army-size threshold in BaseArmy.takeHit, which is also 5 but means something else. */
export const MAX_COMBAT_DICE = 5;
/** Most missed dice a side re-rolls per round, one per leader (Round order). */
export const MAX_LEADER_REROLLS = 5;
const MIN_HIT_FACE = 5;

/** Rolls numdice fair six-sided dice. */
export function rollDice(numdice: number): number[] {
  let min = 1;
  let max = 6;
  let results: number[] = [];
  min = Math.ceil(min);
  max = Math.floor(max);

  for (let i = 0 ; i < numdice; i++) {
    let result = Math.floor(Math.random() * (max - min + 1)) + min;
    results.push(result);
  }
  return results;
}


interface CombatRollOps {
  diceRoll: number[];
}
interface CombatRollResults {
  hits: number[];
  misses: number[];
}
function calculateCombatRollResults(opts: CombatRollOps): CombatRollResults {
  let hits: number[] = [];
  let misses: number[] = [];
  for (let i = 0; i < opts.diceRoll.length; i++) {
    let thisDice = opts.diceRoll[i];
    if (thisDice >= MIN_HIT_FACE) {
      hits.push(thisDice);
    } else {
      misses.push(thisDice);
    }
  }
  return { hits: hits, misses: misses };
}


/** Plays one round in order: combat rolls, leader re-rolls, simultaneous casualties, then the record (Round order). */
export function resolveRound(battle: BattleResult, roll: DiceRoller): void {
  let attack = battle.attackArmy;
  let defend = battle.defendArmy;

  let attackCombatRoll = roll(Math.min(attack.getCombatStrength(), MAX_COMBAT_DICE));
  let attackCombatResult = calculateCombatRollResults({diceRoll: attackCombatRoll});

  let defenseCombat = roll(Math.min(defend.getCombatStrength(), MAX_COMBAT_DICE));
  let defendCombatResult = calculateCombatRollResults({diceRoll: defenseCombat});

  let attackLeaderRoll = roll(Math.min(attackCombatResult.misses.length, attack.leaders, MAX_LEADER_REROLLS));
  let attackLeaderResult = calculateCombatRollResults({diceRoll: attackLeaderRoll});

  let defendLeaderRoll = roll(Math.min(defendCombatResult.misses.length, defend.leaders, MAX_LEADER_REROLLS));
  let defendLeaderResult = calculateCombatRollResults({diceRoll: defendLeaderRoll});

  let attackHits = attackCombatResult.hits.length + attackLeaderResult.hits.length;
  let defendHits = defendCombatResult.hits.length + defendLeaderResult.hits.length;
  attack.takeHits(defendHits);
  defend.takeHits(attackHits);

  battle.recordRound(attackHits, defendHits);
}

/** Options that end a battle early; later termination rules are added as fields here (Extension points). */
export type BattleOptions = {};

/** Whether the battle is over: true once either side has no combat strength (Extension points). */
export function shouldStop(battle: BattleResult, options: BattleOptions): boolean {
  return !battle.attackArmy.isArmyAlive() || !battle.defendArmy.isArmyAlive();
}

/** Runs rounds until a side is eliminated and returns the recorded battle (Round order). */
export function Battle(attack: BaseArmy, defend: BaseArmy, roll: DiceRoller = rollDice, options: BattleOptions = {}): BattleResult {
  const battleResult = new BattleResult(attack, defend);

  while (!shouldStop(battleResult, options)) {
    resolveRound(battleResult, roll);
  }
  return battleResult;
}
