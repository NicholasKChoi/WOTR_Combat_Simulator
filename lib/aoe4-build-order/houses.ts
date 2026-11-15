import { constructionSeconds } from './construction';
import type { GameData } from './data';
import { HOUSE_ID, RESOURCE_TOLERANCE, costOf, villagerWalkSeconds } from './engine-common';
import type { Resources } from './engine-common';
import { RESOURCE_KINDS } from './model';
import type { SimInputs } from './model';
import type { EngineState } from './simulate';

export interface HouseDemand {
  // Every building under construction: its supply and its expected completion time.
  pending: { supply: number; completesAt: number }[];
  populationPerSecond: number;
  // The real bank, step reserves not subtracted.
  bank: Readonly<Resources>;
  // Per second, from the gatherers at the moment of planning.
  income: Readonly<Resources>;
}

// Seconds the income needs to cover the cost beyond the bank; null when a short resource has no income.
function gatherSeconds(cost: Readonly<Resources>, demand: HouseDemand): number | null {
  let seconds = 0;
  for (const kind of RESOURCE_KINDS) {
    const short = cost[kind] - demand.bank[kind];
    if (short <= RESOURCE_TOLERANCE) {
      continue;
    }
    if (demand.income[kind] <= 0) {
      return null;
    }
    seconds = Math.max(seconds, short / demand.income[kind]);
  }
  return seconds;
}

// Houses due now: supply must arrive before the projected population outgrows it, and the window to plan over is
// the walk and build time plus the time to gather one house's cost.
export function planAutoHouse(state: EngineState, inputs: SimInputs, data: GameData, demand: HouseDemand): number {
  const house = data.byBaseId.get(HOUSE_ID)?.[0];
  const byDefault = data.supply.get(HOUSE_ID)?.value ?? 0;
  const houseSupply = state.rules.supplyProvider?.(byDefault, { data, inputs, time: state.time, baseId: HOUSE_ID }) ?? byDefault;
  if (!house || houseSupply <= 0) {
    return 0;
  }
  const gather = gatherSeconds(costOf(house, 1), demand);
  if (gather === null) {
    return 0;
  }
  const horizon = villagerWalkSeconds(state, inputs.walkSeconds) + constructionSeconds(house.costs.time, inputs.houseBuilders, data) + gather;
  const arriving = demand.pending.filter((item) => item.completesAt <= state.time + horizon);
  const headroom = state.supply + arriving.reduce((sum, item) => sum + item.supply, 0);
  const shortfall = state.population + demand.populationPerSecond * horizon - headroom;
  if (shortfall <= RESOURCE_TOLERANCE) {
    return 0;
  }
  const allPending = demand.pending.reduce((sum, item) => sum + item.supply, 0);
  const room = Math.ceil((data.base.maxPopCap.value - state.supply - allPending) / houseSupply);
  return Math.max(0, Math.min(Math.ceil(shortfall / houseSupply), room));
}
