import { describe, expect, it } from 'vitest'
import type { BuildOrder, BuildStep } from './model'
import { expandRepeats, expandedStepCount, repeatCount } from './repeat'

const house = (extra: Partial<Extract<BuildStep, { action: 'build' }>> = {}): BuildStep => ({ action: 'build', building: 'house', from: 'wood', ...extra })
const shift = (extra: Partial<Extract<BuildStep, { action: 'move' }>> = {}): BuildStep => ({ action: 'move', count: 1, from: 'sheep', to: 'wood', ...extra })
const villager: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }

function orderOf(steps: BuildStep[]): BuildOrder {
    return { civ: 'english', name: 'repeat', source: 'https://example.com/guide', start: { villagers: { sheep: 6 }, rally: 'sheep' }, steps }
}

describe('expandRepeats', () => {
    it('returns an order without repeat deep-equal to the input, one copy per step', () => {
        const order = orderOf([villager, house({ trigger: { kind: 'time', seconds: 30 } }), shift()])
        const { order: expanded, copies } = expandRepeats(order)
        expect(expanded).toStrictEqual(order)
        expect(copies).toStrictEqual([
            { source: 0, copy: 1 },
            { source: 1, copy: 1 },
            { source: 2, copy: 1 },
        ])
    })

    it('runs repeat 1 once, without the repeat key', () => {
        const { order, copies } = expandRepeats(orderOf([house({ repeat: 1 })]))
        expect(order.steps).toStrictEqual([house()])
        expect(copies).toStrictEqual([{ source: 0, copy: 1 }])
    })

    it.each<[string, BuildStep[], BuildStep[], [number, number][]]>([
        ['repeat 3 on the middle of three steps', [villager, house({ repeat: 3 }), shift()], [villager, house(), house(), house(), shift()], [[0, 1], [1, 1], [1, 2], [1, 3], [2, 1]]],
        ['two repeated steps', [house({ repeat: 2 }), villager, shift({ repeat: 3 })], [house(), house(), villager, shift(), shift(), shift()], [[0, 1], [0, 2], [1, 1], [2, 1], [2, 2], [2, 3]]],
    ])('writes out %s as consecutive copies in source order', (_, steps, expected, copies) => {
        const expanded = expandRepeats(orderOf(steps))
        expect(expanded.order.steps).toStrictEqual(expected)
        expect(expanded.copies).toStrictEqual(copies.map(([source, copy]) => ({ source, copy })))
        expect(expanded.order.steps).toHaveLength(expandedStepCount(steps))
    })

    it.each<[string, BuildStep]>([
        ['a reaction step', shift({ count: 'all', trigger: { kind: 'depleted', node: 'sheep' }, reaction: true, repeat: 3 })],
        ['a bank-triggered step', house({ trigger: { kind: 'bank', resource: 'wood', atLeast: 75 }, repeat: 3 })],
    ])('keeps trigger and reaction on every copy of %s', (_, step) => {
        const { repeat: _repeat, ...once } = step
        const { order } = expandRepeats(orderOf([step]))
        expect(order.steps).toStrictEqual([once, once, once])
    })

    it('keeps civ, name, source and start, and does not mutate the input', () => {
        const order = orderOf([house({ repeat: 2, trigger: { kind: 'time', seconds: 10 } }), shift({ repeat: 2 })])
        const before = structuredClone(order)
        const { order: expanded } = expandRepeats(order)
        expect(order).toStrictEqual(before)
        expect({ ...expanded, steps: [] }).toStrictEqual({ ...before, steps: [] })
    })
})

describe('repeatCount and expandedStepCount', () => {
    it.each<[BuildStep, number]>([
        [house(), 1],
        [house({ repeat: 1 }), 1],
        [shift({ repeat: 7 }), 7],
    ])('counts %j as %i', (step, count) => {
        expect(repeatCount(step)).toBe(count)
        expect(expandRepeats(orderOf([step])).order.steps).toHaveLength(count)
    })

    it('sums the repeat counts of every step, whatever its action', () => {
        const steps = [house({ repeat: 4 }), villager, { ...villager, repeat: 3 } as BuildStep, shift()]
        expect(expandedStepCount(steps)).toBe(9)
        expect(expandRepeats(orderOf(steps)).order.steps).toHaveLength(9)
    })
})
