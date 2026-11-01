import { describe, expect, it } from 'vitest'
import { constructionSeconds } from './construction'
import { GameData, loadGameData } from './data'

const data = loadGameData('english')

function withScaling(numerator: number, offset: number): GameData {
    const scaling = data.base.builderScaling
    return {
        ...data,
        base: {
            ...data.base,
            builderScaling: { numerator: { ...scaling.numerator, value: numerator }, offset: { ...scaling.offset, value: offset } },
        },
    }
}

describe('constructionSeconds', () => {
    it('scales English build time by 3 / (builders + 2)', () => {
        expect([1, 2, 4, 8].map((n) => constructionSeconds(100, n, data))).toEqual([100, 75, 50, 30])
    })

    it('reads numerator and offset from the data', () => {
        const game = withScaling(4, 3)
        for (const n of [1, 2, 5, 200]) {
            expect(constructionSeconds(100, n, game)).toBeCloseTo((100 * 4) / (n + 3), 10)
        }
    })

    it('rejects a builder count that is not an integer >= 1', () => {
        for (const builders of [0, -1, 1.5, Number.NaN]) {
            expect(() => constructionSeconds(100, builders, data)).toThrow(RangeError)
        }
        expect(() => constructionSeconds(100, 1.5, data)).toThrow('1.5')
    })

    it('gives the same number on repeated calls', () => {
        expect(constructionSeconds(80, 3, data)).toBe(constructionSeconds(80, 3, data))
    })
})
