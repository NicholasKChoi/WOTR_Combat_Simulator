import { describe, expect, it } from 'vitest'
import { FINITE_GATHER_NODES, FINITE_NODE_REFS, GATHER_NODES, NODE_REFS, SEVERITIES, nodeKindOf } from './model'
import type { DepositRef } from './model'

const DEPOSITS = ['gold#2', 'gold#3', 'gold#4', 'gold#5', 'gold#6', 'gold#7', 'gold#8']

describe('node refs', () => {
    it('lists the finite nodes and both ref lists with the deposits right after gold', () => {
        expect(FINITE_GATHER_NODES).toEqual(['sheep', 'berry', 'deer', 'boar', 'gold', 'stone'])
        expect(NODE_REFS).toEqual(['sheep', 'berry', 'deer', 'boar', 'farm', 'wood', 'gold', ...DEPOSITS, 'stone'])
        expect(FINITE_NODE_REFS).toEqual(['sheep', 'berry', 'deer', 'boar', 'gold', ...DEPOSITS, 'stone'])
    })

    it('maps every ref to its gather node kind', () => {
        expect(nodeKindOf('gold#3')).toBe('gold')
        expect(nodeKindOf('gold')).toBe('gold')
        expect(nodeKindOf('farm')).toBe('farm')
        for (const ref of NODE_REFS) {
            expect(GATHER_NODES).toContain(nodeKindOf(ref))
        }
    })

    it('rejects deposit numbers outside 2..8 at the type level', () => {
        // @ts-expect-error deposit 1 is written plain gold
        const first: DepositRef = 'gold#1'
        // @ts-expect-error there are at most 8 deposits
        const ninth: DepositRef = 'gold#9'
        const last: DepositRef = 'gold#8'
        void [first, ninth, last]
    })
})

describe('SEVERITIES', () => {
    it('runs from most to least severe', () => {
        expect(SEVERITIES).toEqual(['error', 'warning', 'info'])
    })
})
