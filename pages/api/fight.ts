import type { NextApiRequest, NextApiResponse } from 'next'
import Results from '../../components/apps/combat-simulator/results';
import { Army, BaseArmy } from './models/army';

class FormParseResult {
  attackArmy: BaseArmy;
  defendArmy: BaseArmy;

  constructor(attack: BaseArmy, defend: BaseArmy) {
    this.attackArmy = attack;
    this.defendArmy = defend;
  }
}

class BattleResult {
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
    if (this.attackArmy.isArmyAlive()) {
      return "attack";
    } else if (this.defendArmy.isArmyAlive()) {
      return "defend";
    }
    return "n/a";
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

interface BattleStats {
  attack: BaseArmy;
  defend: BaseArmy;
  rounds: number;
  averageAttackHitsPerRound: number;
  averageDefendHitsPerRound: number;
  survivor: string;
}


/**
 * 
 * @param req 
 * @returns 
 */
function parseFightForm(req: NextApiRequest): FormParseResult {
  let attackers = new BaseArmy(
    parseInt(req.body["attack-regs"]),
    parseInt(req.body["attack-elts"]),
    parseInt(req.body["attack-ldrs"]));
  let defenders = new BaseArmy(
    parseInt(req.body["defend-regs"]),
    parseInt(req.body["defend-elts"]),
    parseInt(req.body["defend-ldrs"])
  );

  return new FormParseResult(attackers, defenders);
}


function rollDice(numdice: number): number[] {
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


function Battle(form: FormParseResult): BattleResult {
  let attack = form.attackArmy;
  let defend = form.defendArmy;
  const battleResult = new BattleResult(attack, defend);

  while (attack.isArmyAlive() && defend.isArmyAlive()) {
    // combat
    let attackCombatRoll = rollDice(attack.getCombatStrength());
    let attackCombatResult = calculateCombatRollResults({diceRoll: attackCombatRoll});

    let defenseCombat = rollDice(defend.getCombatStrength());
    let defendCombatResult = calculateCombatRollResults({diceRoll: defenseCombat});

    // leaders
    let attackLeaderRoll = rollDice(Math.min(attackCombatResult.misses.length, attack.leaders));
    let attackLeaderResult = calculateCombatRollResults({diceRoll: attackLeaderRoll});

    let defendLeaderRoll = rollDice(Math.min(defendCombatResult.misses.length, defend.leaders));
    let defendLeaderResult = calculateCombatRollResults({diceRoll: defendLeaderRoll});
    
    // take combat hits
    let attackHits = attackCombatResult.hits.length + attackLeaderResult.hits.length;
    let defendHits = defendCombatResult.hits.length + defendLeaderResult.hits.length;
    attack.takeHits(defendHits);
    defend.takeHits(attackHits);

    // record number of rounds in the battle
    battleResult.recordRound(attackHits, defendHits);
    console.log(
      battleResult,
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
  console.log("Final result", battleResult);
  return battleResult;
}


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const formParse = parseFightForm(req);
  const results = Battle(formParse);
  res.status(200).json(results.getStats());
}
