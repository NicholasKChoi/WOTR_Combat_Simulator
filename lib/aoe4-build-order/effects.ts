import type { GameData, SnapshotEntry } from './data';
import type { TechSupport } from './model';

export const SUPPORTED_EFFECT_PROPERTIES: ReadonlySet<string> = new Set([
  'foodGatherRate',
  'woodGatherRate',
  'goldGatherRate',
  'stoneGatherRate',
  'farmGatherRate',
  'berryGatherRate',
  'huntGatherRate',
  'carryCapacity',
  'huntCarryCapacity',
  'moveSpeed',
  'productionSpeed',
]);

// Combat and non-economy stats: a tech carrying them still costs resources and queue time.
export const IGNORED_EFFECT_PROPERTIES: ReadonlySet<string> = new Set([
  'areaOfEffect',
  'attackSpeed',
  'fireArmor',
  'healingRate',
  'hitpoints',
  'lineOfSight',
  'maxRange',
  'meleeArmor',
  'meleeAttack',
  'rangedArmor',
  'rangedAttack',
  'rangedResistance',
  'siegeAttack',
]);

const UNKNOWN_PROPERTY = 'unknown';
const MODELED_EFFECT_KINDS = new Set(['change', 'multiply']);
const MODELED_EFFECT_TYPE = 'passive';

function classifyUpgrade(entry: SnapshotEntry, data: GameData): TechSupport {
  if (data.upgradeTargets.has(entry.baseId)) {
    return { kind: 'supported' };
  }
  return { kind: 'rejected', code: 'unsupported-tech', property: 'upgradeTargets' };
}

// buildTime is in neither property set on purpose: modeling it as ignored would silently mis-time builds.
function classifyTechnology(entry: SnapshotEntry, data: GameData): TechSupport {
  const effects = entry.effects ?? [];
  if (effects.some((e) => e.property === UNKNOWN_PROPERTY)) {
    return { kind: 'rejected', code: 'unknown-tech-effect', property: UNKNOWN_PROPERTY };
  }
  const unsupported = effects.find((e) =>
    SUPPORTED_EFFECT_PROPERTIES.has(e.property)
      ? !MODELED_EFFECT_KINDS.has(e.effect) || e.type !== MODELED_EFFECT_TYPE
      : !IGNORED_EFFECT_PROPERTIES.has(e.property),
  );
  if (unsupported) {
    return { kind: 'rejected', code: 'unsupported-tech', property: unsupported.property };
  }
  if (effects.length === 0) {
    const overlaid = data.civData.effects.some((row) => row.grantedBy === entry.baseId);
    return overlaid ? { kind: 'supported' } : { kind: 'effects-unmodeled' };
  }
  const ignored = [...new Set(effects.map((e) => e.property).filter((p) => IGNORED_EFFECT_PROPERTIES.has(p)))];
  return ignored.length > 0 ? { kind: 'effects-ignored', properties: ignored } : { kind: 'supported' };
}

export function classifyTech(entry: SnapshotEntry, data: GameData): TechSupport {
  switch (entry.type) {
    case 'technology':
      return classifyTechnology(entry, data);
    case 'upgrade':
      return classifyUpgrade(entry, data);
    default:
      throw new Error(`classifyTech: ${entry.id} is a ${entry.type}, not a technology or upgrade`);
  }
}
