export interface Army {
  regulars: number;
  elites: number;
  leaders: number;
}

export class BaseArmy {
  regulars: number = 0;
  elites: number = 0;
  leaders: number = 0;

  constructor(regs: number, elts: number, ldrs: number) {
    this.regulars = regs;
    this.elites = elts;
    this.leaders = ldrs;
  }

  isArmyAlive(): boolean {
    return this.elites < 1 && this.regulars < 1;
  }

  getCombatStrength(): number {
    return this.elites + this.regulars;
  }
}