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
    return this.getCombatStrength() > 0;
  }

  getCombatStrength(): number {
    return this.elites + this.regulars;
  }

  takeHit(): boolean {
    if (!this.isArmyAlive()) {
      return false;
    }
    if (this.getCombatStrength() > 5) {
      this.regulars--;
    } else if (this.elites > 0) {
      this.elites--;
      this.regulars++;
    } else {
      this.regulars--;
    }
    return true;
  }

  takeHits(hits: number) {
    for (let i = 0; i < hits; i += 1) {
      if (!this.takeHit()) {
        // army is dead
        break;
      }
    }
    return;
  }
}