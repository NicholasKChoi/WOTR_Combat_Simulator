import type { NextApiRequest, NextApiResponse } from 'next'
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


const MAX_FIGHTERS_PER_SIDE = 10;
const MAX_LEADERS_PER_SIDE = 5;
const SIDES = ['attack', 'defend'] as const;

interface ArmyCounts {
  regulars: number;
  elites: number;
  leaders: number;
}

const ARMY_FIELDS: [keyof ArmyCounts, string, number][] = [
  ['regulars', 'regs', MAX_FIGHTERS_PER_SIDE],
  ['elites', 'elts', MAX_FIGHTERS_PER_SIDE],
  ['leaders', 'ldrs', MAX_LEADERS_PER_SIDE],
];

type FightForm = Record<typeof SIDES[number], ArmyCounts>;

type ValidationResult = { form: FightForm } | { error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCount(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  }
  if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
    return Number(value);
  }
  return undefined;
}

function validateField(body: Record<string, unknown>, key: string, max: number): number | string {
  const value = body[key];
  if (value === undefined) {
    return `${key} is required`;
  }
  const count = parseCount(value);
  if (count === undefined) {
    return `${key} must be a non-negative whole number`;
  }
  if (count > max) {
    return `${key} must be between 0 and ${max}`;
  }
  return count;
}

function validateFightForm(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { error: 'request body must be a JSON object' };
  }

  const form = {} as FightForm;
  for (const side of SIDES) {
    const counts = {} as ArmyCounts;
    for (const [unit, suffix, max] of ARMY_FIELDS) {
      const result = validateField(body, `${side}-${suffix}`, max);
      if (typeof result === 'string') {
        return { error: result };
      }
      counts[unit] = result;
    }
    form[side] = counts;
  }

  for (const side of SIDES) {
    const fighters = form[side].regulars + form[side].elites;
    if (fighters > MAX_FIGHTERS_PER_SIDE) {
      return { error: `${side} army has more than ${MAX_FIGHTERS_PER_SIDE} regulars and elites` };
    }
    if (fighters < 1) {
      return { error: `${side} army needs at least one regular or elite` };
    }
  }

  return { form };
}

function parseFightForm(form: FightForm): FormParseResult {
  let attackers = new BaseArmy(form.attack.regulars, form.attack.elites, form.attack.leaders);
  let defenders = new BaseArmy(form.defend.regulars, form.defend.elites, form.defend.leaders);

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: `method ${req.method} is not allowed; use POST` });
    return;
  }

  const validation = validateFightForm(req.body);
  if ('error' in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const formParse = parseFightForm(validation.form);
  const results = Battle(formParse);
  res.status(200).json(results.getStats());
}
