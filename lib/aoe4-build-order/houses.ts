import { constructionSeconds } from './construction';
import type { GameData } from './data';
import { HOUSE_ID, RESOURCE_TOLERANCE, villagerWalkSeconds } from './engine-common';
import type { SimInputs } from './model';
import type { EngineState } from './simulate';

export interface HouseDemand {
  // Supply of buildings under construction.
  pendingSupply: number;
  populationPerSecond: number;
}

// Houses to start now so that supply arrives before the projected population outgrows it.
export function planAutoHouse(state: EngineState, inputs: SimInputs, data: GameData, demand: HouseDemand): number {
  const house = data.byBaseId.get(HOUSE_ID)?.[0];
  const byDefault = data.supply.get(HOUSE_ID)?.value ?? 0;
  const houseSupply = state.rules.supplyProvider?.(byDefault, { data, inputs, time: state.time, baseId: HOUSE_ID }) ?? byDefault;
  if (!house || houseSupply <= 0) {
    return 0;
  }
  const lead = villagerWalkSeconds(state, inputs.walkSeconds) + constructionSeconds(house.costs.time, inputs.houseBuilders, data);
  const headroom = state.supply + demand.pendingSupply;
  const shortfall = state.population + demand.populationPerSecond * lead - headroom;
  if (shortfall <= RESOURCE_TOLERANCE) {
    return 0;
  }
  const room = Math.ceil((data.base.maxPopCap.value - headroom) / houseSupply);
  return Math.max(0, Math.min(Math.ceil(shortfall / houseSupply), room));
}
