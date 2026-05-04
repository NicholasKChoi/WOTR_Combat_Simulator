import { BaseArmy } from '../../pages/api/models/army';

describe('BaseArmy', () => {
  describe('getCombatStrength', () => {
    it('returns sum of regulars and elites', () => {
      const army = new BaseArmy(3, 2, 1);
      expect(army.getCombatStrength()).toBe(5);
    });

    it('returns 0 for an empty army', () => {
      const army = new BaseArmy(0, 0, 0);
      expect(army.getCombatStrength()).toBe(0);
    });

    it('counts only combat units, not leaders', () => {
      const army = new BaseArmy(0, 0, 5);
      expect(army.getCombatStrength()).toBe(0);
    });
  });

  describe('isArmyAlive', () => {
    it('returns true when combat strength > 0', () => {
      expect(new BaseArmy(1, 0, 0).isArmyAlive()).toBe(true);
      expect(new BaseArmy(0, 1, 0).isArmyAlive()).toBe(true);
    });

    it('returns false when all combat units are gone', () => {
      expect(new BaseArmy(0, 0, 0).isArmyAlive()).toBe(false);
      expect(new BaseArmy(0, 0, 3).isArmyAlive()).toBe(false);
    });
  });

  describe('takeHit', () => {
    it('removes a regular when combat strength > 5', () => {
      // 4 regulars + 3 elites = 7 strength, above threshold
      const army = new BaseArmy(4, 3, 0);
      army.takeHit();
      expect(army.regulars).toBe(3);
      expect(army.elites).toBe(3);
    });

    it('downgrades an elite to a regular when strength <= 5 and elites > 0', () => {
      const army = new BaseArmy(0, 3, 0); // strength = 3
      army.takeHit();
      expect(army.elites).toBe(2);
      expect(army.regulars).toBe(1);
    });

    it('removes a regular when strength <= 5 and no elites remain', () => {
      const army = new BaseArmy(3, 0, 0);
      army.takeHit();
      expect(army.regulars).toBe(2);
    });

    it('returns false and does not change state when army is already dead', () => {
      const army = new BaseArmy(0, 0, 0);
      const result = army.takeHit();
      expect(result).toBe(false);
      expect(army.regulars).toBe(0);
      expect(army.elites).toBe(0);
    });

    it('returns true when army is alive', () => {
      const army = new BaseArmy(1, 0, 0);
      expect(army.takeHit()).toBe(true);
    });

    it('army dies after all units are removed', () => {
      const army = new BaseArmy(1, 0, 0);
      army.takeHit();
      expect(army.isArmyAlive()).toBe(false);
    });

    it('elite army fully dies through downgrade chain', () => {
      // 2 elites: first hit downgrades one elite → 1 elite + 1 regular (strength=2)
      // second hit downgrades remaining elite → 0 elites + 2 regulars (strength=2)
      // third + fourth hits remove regulars
      const army = new BaseArmy(0, 2, 0);
      army.takeHit(); // elite → regular: 1 elite, 1 regular
      army.takeHit(); // elite → regular: 0 elites, 2 regulars
      army.takeHit(); // lose regular: 0 elites, 1 regular
      army.takeHit(); // lose regular: 0 elites, 0 regulars
      expect(army.isArmyAlive()).toBe(false);
    });
  });

  describe('takeHits', () => {
    it('applies multiple hits in sequence', () => {
      const army = new BaseArmy(3, 0, 0);
      army.takeHits(2);
      expect(army.regulars).toBe(1);
    });

    it('stops applying hits once army is dead', () => {
      const army = new BaseArmy(1, 0, 0);
      army.takeHits(5); // army only has 1 unit, extra hits are ignored
      expect(army.regulars).toBe(0);
      expect(army.isArmyAlive()).toBe(false);
    });
  });
});
