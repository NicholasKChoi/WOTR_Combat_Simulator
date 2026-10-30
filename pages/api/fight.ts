import type { NextApiRequest, NextApiResponse } from 'next'
import { BaseArmy } from '../../lib/combat-simulator/army';
import { Battle } from '../../lib/combat-simulator/battle';

class FormParseResult {
  attackArmy: BaseArmy;
  defendArmy: BaseArmy;

  constructor(attack: BaseArmy, defend: BaseArmy) {
    this.attackArmy = attack;
    this.defendArmy = defend;
  }
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
  const results = Battle(formParse.attackArmy, formParse.defendArmy);
  res.status(200).json(results.getStats());
}
