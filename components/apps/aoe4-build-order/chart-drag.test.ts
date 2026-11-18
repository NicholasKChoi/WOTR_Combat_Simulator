import { describe, expect, it } from 'vitest'
import { dropIndexAt, dropSlotAt } from './chart-drag'

describe('dropIndexAt', () => {
    it.each([
        ['above every midpoint', [10, 20, 30], 5, 0],
        ['below every midpoint', [10, 20, 30], 40, 3],
        ['between two midpoints', [10, 20, 30], 25, 2],
        ['exactly on a midpoint', [10, 20], 10, 0],
        ['exactly on a later midpoint', [10, 20, 30], 20, 1],
        ['an empty list', [], 15, 0],
    ])('%s', (_label, midpoints, pointerY, expected) => {
        expect(dropIndexAt(midpoints, pointerY)).toBe(expected)
    })
})

describe('dropSlotAt', () => {
    const adjacent = [
        { top: 0, bottom: 100 },
        { top: 100, bottom: 300 },
        { top: 300, bottom: 400 },
    ]
    it.each([
        ['above the first other chart', adjacent, -20, 0, 0],
        ['below the last other chart', adjacent, 450, 3, 400],
        ['between two adjacent charts', adjacent, 250, 2, 300],
        ['inside the first chart above its midpoint', adjacent, 40, 0, 0],
        ['inside the first chart below its midpoint', adjacent, 60, 1, 100],
        ['between two charts with a gap', [{ top: 0, bottom: 100 }, { top: 140, bottom: 300 }], 200, 1, 120],
        ['between two collapsed charts', [{ top: 0, bottom: 30 }, { top: 30, bottom: 60 }, { top: 60, bottom: 90 }], 40, 1, 30],
    ])('%s', (_label, others, pointerY, index, boundaryY) => {
        expect(dropSlotAt(others, pointerY)).toEqual({ index, boundaryY })
    })

    it('has no boundary and index 0 with no other charts', () => {
        expect(dropSlotAt([], 10)).toEqual({ index: 0, boundaryY: null })
    })

    it('puts the boundary of every slot in the span between its neighbours', () => {
        const others = [{ top: 0, bottom: 90 }, { top: 110, bottom: 200 }, { top: 230, bottom: 300 }]
        for (const pointerY of [-5, 50, 100, 150, 220, 280, 400]) {
            const { index, boundaryY } = dropSlotAt(others, pointerY)
            const spanTop = index === 0 ? others[0].top : others[index - 1].bottom
            const spanBottom = index === others.length ? others[index - 1].bottom : others[index].top
            expect(boundaryY).toBeGreaterThanOrEqual(Math.min(spanTop, spanBottom))
            expect(boundaryY).toBeLessThanOrEqual(Math.max(spanTop, spanBottom))
        }
    })
})
