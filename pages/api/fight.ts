import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_BATTLES, MAX_BATTLES, simulateBattles } from '../../lib/combat-simulator/simulate';
import type { FightError, FightRequest, FightResponse } from '../../lib/combat-simulator/fight-api';

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

type ValidationResult = { form: FightForm; battles: number } | { error: string };

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

function validateBattles(body: Record<string, unknown>): number | string {
  if (body.battles === undefined) {
    return DEFAULT_BATTLES;
  }
  const battles = parseCount(body.battles);
  if (battles === undefined || battles < 1 || battles > MAX_BATTLES) {
    return `battles must be a whole number between 1 and ${MAX_BATTLES}`;
  }
  return battles;
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

  const battles = validateBattles(body);
  if (typeof battles === 'string') {
    return { error: battles };
  }

  return { form, battles };
}


export default function handler(req: NextApiRequest, res: NextApiResponse<FightResponse | FightError>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: `method ${req.method} is not allowed; use POST` });
    return;
  }

  const validation = validateFightForm(req.body as FightRequest);
  if ('error' in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const { form, battles } = validation;
  res.status(200).json(simulateBattles(form.attack, form.defend, battles));
}
