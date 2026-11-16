import type { CivData, GameData, SnapshotEntry } from './data';
import type { CivId, GatherNodeId, SimInputs } from './model';
import type { EngineState } from './simulate';

/** What every CivRules hook receives besides its own arguments: the data, the inputs and the current time (CivRules seams). */
export interface CivRuleContext {
  data: GameData;
  inputs: SimInputs;
  time: number;
}

/** The per-civilization hooks; value hooks receive the default the engine computed and return the value to use, event hooks observe the engine (CivRules seams). */
export interface CivRules {
  gatherRateModifier?(ratePerSecond: number, ctx: CivRuleContext & { node: GatherNodeId }): number;
  productionModifier?(seconds: number, ctx: CivRuleContext & { entry: SnapshotEntry; producer: string }): number;
  supplyProvider?(supply: number, ctx: CivRuleContext & { baseId: string }): number;
  villagerProducer?(isProducer: boolean, ctx: CivRuleContext & { baseId: string }): boolean;
  dropOffRule?(hasDropOff: boolean, ctx: CivRuleContext & { node: GatherNodeId }): boolean;
  startingState?(start: CivData['startingState'], ctx: CivRuleContext): CivData['startingState'];
  onBuildingComplete?(state: EngineState, ctx: CivRuleContext & { baseId: string; instance: number }): void;
  onAgeAdvance?(state: EngineState, ctx: CivRuleContext & { age: number }): void;
}

/** The frozen empty rule set that English uses (CivRules seams). */
export const NO_CIV_RULES: CivRules = Object.freeze({});

const CIV_RULES = new Map<CivId, CivRules>([['english', NO_CIV_RULES]]);

/** Returns the CivRules for a civ; throws when none is registered (CivRules seams). */
export function civRules(civ: CivId): CivRules {
  const rules = CIV_RULES.get(civ);
  if (!rules) {
    throw new Error(`no civ rules for civ "${civ}"`);
  }
  return rules;
}
