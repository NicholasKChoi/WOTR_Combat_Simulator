import { describe, expect, it } from 'vitest'
import { BaseArmy } from './army'

const counts = (army: BaseArmy) => [army.regulars, army.elites]

describe('BaseArmy.takeHit', () => {
    it('downgrades an elite when an army of more than 5 units has no regulars', () => {
        const army = new BaseArmy(0, 7, 0)
        const trace: number[][] = []
        for (let i = 0; i < 5; i++) {
            army.takeHit()
            trace.push(counts(army))
        }
        expect(trace).toEqual([[1, 6], [0, 6], [1, 5], [0, 5], [1, 4]])
    })

    it('removes a regular from an army of more than 5 units that has regulars', () => {
        const army = new BaseArmy(6, 0, 0)
        army.takeHit()
        expect(counts(army)).toEqual([5, 0])
    })

    it('downgrades an elite in an army of 5 or fewer units', () => {
        const army = new BaseArmy(0, 3, 0)
        army.takeHit()
        expect(counts(army)).toEqual([1, 2])
    })

    it('removes a regular from an army of 5 or fewer units with no elites', () => {
        const army = new BaseArmy(2, 0, 0)
        army.takeHit()
        expect(counts(army)).toEqual([1, 0])
    })

    it('ignores a hit on an eliminated army', () => {
        const army = new BaseArmy(0, 0, 2)
        expect(army.takeHit()).toBe(false)
        expect(counts(army)).toEqual([0, 0])
    })

    it('never goes negative and ends at 0/0 for every army of 1 to 10 units', () => {
        for (let units = 1; units <= 10; units++) {
            for (let regulars = 0; regulars <= units; regulars++) {
                const army = new BaseArmy(regulars, units - regulars, 3)
                for (let hits = 0; army.isArmyAlive() && hits < 2 * units; hits++) {
                    army.takeHit()
                    expect(army.regulars).toBeGreaterThanOrEqual(0)
                    expect(army.elites).toBeGreaterThanOrEqual(0)
                    expect(army.leaders).toBe(3)
                }
                expect(counts(army)).toEqual([0, 0])
            }
        }
    })
})
