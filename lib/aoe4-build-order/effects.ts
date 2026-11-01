import type { GameData, SnapshotEffect, SnapshotEntry } from './data';
import type { OverlayEffect, TechSupport } from './model';

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

export interface EffectState {
  readonly data: GameData;
  readonly age: number;
  // Completed building baseId -> count.
  readonly buildings: ReadonlyMap<string, number>;
  readonly researched: ReadonlySet<string>;
  // Share of gatherers inside a building's influence, keyed by building baseId.
  readonly coverage: Readonly<Record<string, number>>;
}

export interface ModifierTarget {
  baseId: string;
  classes: readonly string[];
  // baseId of the producing building, for production-time properties.
  producer?: string;
}

export function hasBuilding(state: EffectState, baseId: string): boolean {
  return (state.buildings.get(baseId) ?? 0) >= 1;
}

function isGranted(grantedBy: string, state: EffectState): boolean {
  return grantedBy === 'civ' || hasBuilding(state, grantedBy) || state.researched.has(grantedBy);
}

function activeEffects(state: EffectState): (SnapshotEffect | OverlayEffect)[] {
  const fromTechs = [...state.researched].flatMap((baseId) =>
    (state.data.byBaseId.get(baseId) ?? []).filter((e) => e.type === 'technology').flatMap((e) => e.effects ?? []),
  );
  const fromOverlay = state.data.civData.effects.filter((row) => isGranted(row.grantedBy, state));
  return [...fromTechs, ...fromOverlay];
}

function selects(select: SnapshotEffect['select'], target: ModifierTarget): boolean {
  if (!select.id && !select.class) {
    return false;
  }
  const idMatches = !select.id || select.id.includes(target.baseId);
  const classMatches = !select.class || select.class.some((set) => set.every((c) => target.classes.includes(c)));
  return idMatches && classMatches;
}

// The share of the effect that applies: 0 when the condition fails, the influence coverage for nearBuilding.
function conditionWeight(effect: SnapshotEffect | OverlayEffect, target: ModifierTarget, state: EffectState): number {
  const condition = 'condition' in effect ? effect.condition : undefined;
  if (!condition) {
    return 1;
  }
  if (condition.age !== undefined && condition.age !== state.age) {
    return 0;
  }
  if (condition.producer !== undefined && condition.producer !== target.producer) {
    return 0;
  }
  if (condition.nearBuilding === undefined) {
    return 1;
  }
  const building = condition.nearBuilding;
  if (!hasBuilding(state, building) || !Object.hasOwn(state.coverage, building)) {
    return 0;
  }
  return state.coverage[building];
}

// productionSpeed is a speed: callers divide the production time by the result.
export function modifiedValue(base: number, property: string, target: ModifierTarget, state: EffectState): number {
  let change = 0;
  let multiplier = 1;
  for (const effect of activeEffects(state)) {
    if (effect.property !== property || effect.type !== MODELED_EFFECT_TYPE || !selects(effect.select, target)) {
      continue;
    }
    const weight = conditionWeight(effect, target, state);
    if (effect.effect === 'change') {
      change += effect.value * weight;
    } else if (effect.effect === 'multiply') {
      multiplier *= 1 + (effect.value - 1) * weight;
    }
  }
  return (base + change) * multiplier;
}
