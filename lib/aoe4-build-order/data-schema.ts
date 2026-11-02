import { z } from 'zod';
import type { BaseRules, CivData, Snapshot } from './data';
import { GATHER_NODES, RESOURCE_KINDS } from './model';

const text = z.string().min(1);
const strings = z.array(z.string());
const gatherNode = z.enum(GATHER_NODES);
const resourceKind = z.enum(RESOURCE_KINDS);

function handValue<T extends z.ZodType>(value: T) {
  return z.object({ value, source: text, unverified: z.boolean() });
}
const handNumber = handValue(z.number());

const sourceSchema = z.object({
  repo: text,
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  committedAt: text,
  fetchedAt: text,
  patch: text,
  patchSource: text.startsWith('http'),
});

const snapshotEffectFields = {
  property: z.string(),
  select: z.object({ id: strings.optional(), class: z.array(strings).optional() }),
  effect: z.string(),
  value: z.number(),
  type: z.string(),
};
const snapshotEffectSchema = z.object(snapshotEffectFields);

const entrySchema = z.object({
  id: z.string(),
  baseId: z.string(),
  name: z.string(),
  type: z.enum(['unit', 'building', 'technology', 'upgrade']),
  civs: strings,
  age: z.number(),
  classes: strings,
  producedBy: strings,
  costs: z.object({
    food: z.number(),
    wood: z.number(),
    gold: z.number(),
    stone: z.number(),
    popcap: z.number(),
    time: z.number(),
  }),
  effects: z.array(snapshotEffectSchema).optional(),
  description: z.string().optional(),
});

export const snapshotFileSchema: z.ZodType<Snapshot> = z.object({
  source: sourceSchema,
  units: z.array(entrySchema),
  buildings: z.array(entrySchema),
  technologies: z.array(entrySchema),
  upgrades: z.array(entrySchema),
});

const gatherNodeRulesSchema = z.object({
  resource: resourceKind,
  rate: handNumber,
  capacity: handNumber,
  rateProperties: strings,
  capacityProperties: strings,
  dropOffs: strings,
  trip: z.object({ walkSecondsCamp: handNumber, walkSecondsTownCenter: handNumber, dropOffSeconds: handNumber }),
  amount: handNumber.optional(),
  createdBy: z.string().optional(),
});

export const baseRulesFileSchema: z.ZodType<BaseRules> = z.object({
  gatherNodes: z.record(gatherNode, gatherNodeRulesSchema),
  builderScaling: z.object({ numerator: handNumber, offset: handNumber }),
  maxPopCap: handNumber,
  walkSeconds: handNumber,
});

const overlayEffectSchema = z.object({
  ...snapshotEffectFields,
  grantedBy: z.string(),
  condition: z.object({ age: z.number().optional(), nearBuilding: z.string().optional(), producer: z.string().optional() }).optional(),
  source: z.string(),
  unverified: z.boolean(),
});

export const civRulesFileSchema: z.ZodType<CivData> = z.object({
  startingState: z.object({
    age: handNumber,
    resources: handValue(z.record(resourceKind, z.number())),
    villagers: handValue(z.record(gatherNode, z.number())),
    units: handValue(z.record(z.string(), z.number())),
    buildings: handValue(strings),
  }),
  supply: z.record(z.string(), handNumber),
  effects: z.array(overlayEffectSchema),
  upgradeTargets: z.record(z.string(), handValue(z.string())),
});
