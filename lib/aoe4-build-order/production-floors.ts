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
