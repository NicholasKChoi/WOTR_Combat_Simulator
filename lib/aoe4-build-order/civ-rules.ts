import type { CivData, GameData, SnapshotEntry } from './data';
import type { CivId, GatherNodeId, SimInputs } from './model';
import type { EngineState } from './simulate';

export interface CivRuleContext {
  data: GameData;
  inputs: SimInputs;
  time: number;
}

// Value hooks receive the engine's default and return the value to use; event hooks observe the engine.
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

export const NO_CIV_RULES: CivRules = Object.freeze({});

const CIV_RULES = new Map<CivId, CivRules>([['english', NO_CIV_RULES]]);

export function civRules(civ: CivId): CivRules {
  const rules = CIV_RULES.get(civ);
  if (!rules) {
    throw new Error(`no civ rules for civ "${civ}"`);
  }
  return rules;
}
