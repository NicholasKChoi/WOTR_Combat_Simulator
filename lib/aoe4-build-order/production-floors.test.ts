import { describe, expect, it } from 'vitest'
import { MAX_FLOATING_AT_1200, productionChecks } from './production-floors'

const floors = { villager: 50, military: { spearman: 39, longbowman: 38 }, foodPerMinute: 490 }
const result = {
    gatherRates: { food: [0, 0, 600] },
    floating: { food: [0, 0, 10], wood: [0, 0, 20], gold: [0, 0, 30], stone: [0, 0, 40] },
}
const produced: Record<string, number> = { villager: 51, spearman: 40, longbowman: 41 }

describe('productionChecks', () => {
    const { atLeast, atMost } = productionChecks(floors, result, 2, (unit) => produced[unit])

    it('pairs each produced unit count with its floor, then the food rate with its floor', () => {
        expect(atLeast).toEqual([
            ['villager', 51, 50],
            ['spearman', 40, 39],
            ['longbowman', 41, 38],
            ['food per minute', 600, 490],
        ])
    })

    it('pairs the floating amount of each resource at the sample with the shared cap', () => {
        expect(atMost).toEqual([
            ['floating food', 10, MAX_FLOATING_AT_1200],
            ['floating wood', 20, MAX_FLOATING_AT_1200],
            ['floating gold', 30, MAX_FLOATING_AT_1200],
            ['floating stone', 40, MAX_FLOATING_AT_1200],
        ])
    })
})
