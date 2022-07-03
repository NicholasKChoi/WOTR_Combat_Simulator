import type { NextApiRequest, NextApiResponse } from 'next'
import { Army } from './models/army';

class FormParseResult {
  attackArmy: Army;
  defendArmy: Army;

  constructor(attack: Army, defend: Army) {
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
  let attackers: Army = {
    regulars: parseInt(req.body["attack-regs"]),
    elites: parseInt(req.body["attack-elts"]),
    leaders: parseInt(req.body["attack-ldrs"])
  }
  let defenders: Army = {
    regulars: parseInt(req.body["defend-regs"]),
    elites: parseInt(req.body["defend-elts"]),
    leaders: parseInt(req.body["defend-ldrs"])
  }

  return new FormParseResult(attackers, defenders);
}


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let formParse = parseFightForm(req);
  console.log(formParse);
  res.status(200).json({
    attackers: formParse.attackArmy,
    defenders: formParse.defendArmy
  });
}
