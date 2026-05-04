import { rollDice, calculateCombatRollResults, Battle } from '../../pages/api/fight';
import { BaseArmy } from '../../pages/api/models/army';

// fight.ts uses a non-exported FormParseResult; reconstruct it via the module structure
// by importing the named class indirectly through the Battle function's parameter type.
// We create a plain object that satisfies the shape Battle() needs.
function makeForm(attack: BaseArmy, defend: BaseArmy) {
  return { attackArmy: attack, defendArmy: defend } as any;
}

describe('rollDice', () => {
  it('returns an array of the requested length', () => {
    expect(rollDice(3)).toHaveLength(3);
    expect(rollDice(5)).toHaveLength(5);
    expect(rollDice(0)).toHaveLength(0);
  });

  it('every value is between 1 and 6 inclusive', () => {
    const results = rollDice(100);
    for (const r of results) {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    }
  });
});

describe('calculateCombatRollResults', () => {
  it('counts rolls above 5 as hits', () => {
    const result = calculateCombatRollResults({ diceRoll: [6, 6, 6] });
    expect(result.hits).toHaveLength(3);
    expect(result.misses).toHaveLength(0);
  });

  it('counts rolls at or below 5 as misses', () => {
    const result = calculateCombatRollResults({ diceRoll: [1, 2, 3, 4, 5] });
    expect(result.hits).toHaveLength(0);
    expect(result.misses).toHaveLength(5);
  });

  it('splits mixed rolls correctly', () => {
    const result = calculateCombatRollResults({ diceRoll: [1, 3, 6, 6, 4] });
    expect(result.hits).toHaveLength(2);
    expect(result.misses).toHaveLength(3);
  });

  it('uses custom threshold when provided', () => {
    const result = calculateCombatRollResults({ diceRoll: [3, 4, 5, 6], threshold: 3 });
    expect(result.hits).toHaveLength(3); // 4, 5, 6 are hits
    expect(result.misses).toHaveLength(1); // 3 is a miss (not > threshold)
  });

  it('returns empty arrays for empty input', () => {
    const result = calculateCombatRollResults({ diceRoll: [] });
    expect(result.hits).toHaveLength(0);
    expect(result.misses).toHaveLength(0);
  });
});

describe('Battle', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('attacker wins when defender rolls all misses and attacker rolls all hits', () => {
    // First call: attacker dice (all 6s = hits), second call: defender dice (all 1s = misses)
    // Then leader rerolls (we give both sides 0 leaders so no rerolls)
    let callCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // attacker rolls first → return high value (maps to 6)
      // defender rolls second → return low value (maps to 1)
      // alternate each combat round
      return callCount % 2 === 1 ? 0.99 : 0.0;
    });

    const attacker = new BaseArmy(3, 0, 0); // 3 regulars, 0 leaders
    const defender = new BaseArmy(3, 0, 0);
    const result = Battle(makeForm(attacker, defender));
    const stats = result.getStats();

    expect(stats.survivor).toBe('attack');
    expect(stats.rounds).toBeGreaterThanOrEqual(1);
  });

  it('defender wins when attacker rolls all misses and defender rolls all hits', () => {
    let callCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // attacker rolls first → misses (low), defender second → hits (high)
      return callCount % 2 === 1 ? 0.0 : 0.99;
    });

    const attacker = new BaseArmy(2, 0, 0);
    const defender = new BaseArmy(2, 0, 0);
    const result = Battle(makeForm(attacker, defender));
    const stats = result.getStats();

    expect(stats.survivor).toBe('defend');
  });

  it('records at least one round', () => {
    const attacker = new BaseArmy(2, 0, 0);
    const defender = new BaseArmy(2, 0, 0);
    const result = Battle(makeForm(attacker, defender));
    expect(result.getStats().rounds).toBeGreaterThanOrEqual(1);
  });

  it('battle ends with exactly one side alive (or both dead)', () => {
    const attacker = new BaseArmy(3, 2, 1);
    const defender = new BaseArmy(3, 2, 1);
    const result = Battle(makeForm(attacker, defender));
    const stats = result.getStats();
    // survivor is 'attack', 'defend', or 'n/a' (simultaneous death)
    expect(['attack', 'defend', 'n/a']).toContain(stats.survivor);
  });

  it('averageAttackHitsPerRound is a non-negative number', () => {
    const attacker = new BaseArmy(3, 0, 0);
    const defender = new BaseArmy(3, 0, 0);
    const stats = Battle(makeForm(attacker, defender)).getStats();
    expect(stats.averageAttackHitsPerRound).toBeGreaterThanOrEqual(0);
  });

  it('battle with leaders completes without error', () => {
    // Leaders reroll misses; verify the simulation handles this code path
    const attacker = new BaseArmy(2, 0, 5);
    const defender = new BaseArmy(2, 0, 0);
    const stats = Battle(makeForm(attacker, defender)).getStats();
    expect(stats.rounds).toBeGreaterThanOrEqual(1);
    expect(['attack', 'defend', 'n/a']).toContain(stats.survivor);
  });
});
