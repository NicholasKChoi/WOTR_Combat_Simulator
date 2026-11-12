export interface ProductionFloor {
  villager: number;
  military: Record<string, number>;
  foodPerMinute: number;
}

export const PRODUCTION_FLOORS: Record<string, ProductionFloor> = {
  'ENG Spear/Longbow into MAA/Crossbow': {
    villager: 61,
    military: { spearman: 8, longbowman: 8, 'man-at-arms': 21, crossbowman: 13 },
    foodPerMinute: 780,
  },
  "ENG Knight/Longbow (King's Palace)": {
    villager: 61,
    military: { longbowman: 36, knight: 23 },
    foodPerMinute: 1180,
  },
  'ENG 1TC': {
    villager: 50,
    military: { spearman: 39, longbowman: 39 },
    foodPerMinute: 490,
  },
  'ENG 1TC Council Hall': {
    villager: 50,
    military: { spearman: 60, longbowman: 60 },
    foodPerMinute: 900,
  },
};

export const MAX_FLOATING_AT_1200 = 2000;

export type FloorCheck = [label: string, actual: number, bound: number];

export interface FloorSampleSource {
  gatherRates: { food: number[] };
  floating: Record<'food' | 'wood' | 'gold' | 'stone', number[]>;
}

// Each runner asserts atLeast with toBeGreaterThanOrEqual and atMost with toBeLessThanOrEqual.
export function productionChecks(
  floors: ProductionFloor,
  result: FloorSampleSource,
  sample: number,
  countOf: (unit: string) => number,
): { atLeast: FloorCheck[]; atMost: FloorCheck[] } {
  const units = Object.entries({ villager: floors.villager, ...floors.military });
  return {
    atLeast: [
      ...units.map(([unit, floor]): FloorCheck => [unit, countOf(unit), floor]),
      ['food per minute', result.gatherRates.food[sample], floors.foodPerMinute],
    ],
    atMost: (['food', 'wood', 'gold', 'stone'] as const).map((resource): FloorCheck => [`floating ${resource}`, result.floating[resource][sample], MAX_FLOATING_AT_1200]),
  };
}
