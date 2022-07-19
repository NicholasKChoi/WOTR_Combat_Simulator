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
    results.concat(result);
  }
  return results;
}


interface HitOpts {
  results: number[];
  threshold?: number;
}
interface HitResults {
  hits: number[];
  misses: number[];
}
function getHits(opts: HitOpts): HitResults {
  let threshold = opts.threshold || 5;
  let hits: number[] = [];
  let misses: number[] = [];
  for (let i = 0; i < opts.results.length; i++) {
    let thisDice = opts.results[i];
    if (thisDice > threshold) {
      hits.concat(thisDice);
    } else {
      misses.concat(thisDice);
    }
  }
  return { hits: hits, misses: misses };
}


function Battle(form: FormParseResult) {
  let attack = form.attackArmy;
  let defend = form.defendArmy;
  while (attack.isArmyAlive() && defend.isArmyAlive()) {
    // combat a
    let attackCombatRoll = rollDice(attack.getCombatStrength());
    let attackCombatResult = getHits({results: attackCombatRoll});
    // combat d
    let defenseCombat = rollDice(defend.getCombatStrength());
    let defendCombatResult = getHits({results: defenseCombat});

    // leader a
    let attackLeaderRoll = rollDice(Math.min(attackCombatResult.misses.length, attack.leaders))
    // leader d
    
    // take combat hits
    // take combat hits
  }
}


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let formParse = parseFightForm(req);
  console.log(formParse);
  res.status(200).json({
    attackers: formParse.attackArmy,
    defenders: formParse.defendArmy
  });
}
