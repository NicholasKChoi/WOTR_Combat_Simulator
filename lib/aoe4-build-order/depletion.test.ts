import { describe, expect, it } from 'vitest'
import {
    createNodeStock,
    depletionResults,
    drawDown,
    isDepleted,
    nextRunOut,
    recordIdleArrival,
    recordRunOut,
    runRefs,
    sortWarnings,
} from './depletion'
import { RESOURCE_TOLERANCE } from './engine-common'
import { FINITE_GATHER_NODES, FINITE_NODE_REFS } from './model'
import type { BuildOrder, FiniteNodeRef, SimWarning } from './model'
import { buildOrder } from './test-helpers'

const AMOUNTS = Object.fromEntries(FINITE_NODE_REFS.map((ref) => [ref, 1000])) as Record<FiniteNodeRef, number | null>

function stockOf(amounts: Partial<Record<FiniteNodeRef, number | null>>, refs: FiniteNodeRef[] = Object.keys(amounts) as FiniteNodeRef[]) {
    return createNodeStock(refs, { nodeAmounts: { ...AMOUNTS, ...amounts } })
}

const rateOne = () => 1

function emptyRef(ref: FiniteNodeRef, amounts: Partial<Record<FiniteNodeRef, number | null>> = {}) {
    return stockOf({ [ref]: 0, ...amounts })
}

describe('runRefs', () => {
    it('returns the six finite nodes for an order naming no deposit', () => {
        const order = buildOrder([{ action: 'move', count: 2, from: 'sheep', to: 'wood' }], { villagers: { sheep: 6 }, rally: 'farm' })
        expect(runRefs(order)).toEqual(FINITE_GATHER_NODES)
    })

    it('adds every named deposit once, right after gold, in FINITE_NODE_REFS order', () => {
        const order = {
            civ: 'english',
            name: 'deposits',
            start: { villagers: { 'gold#3': 3, sheep: 3 }, rally: 'sheep' },
            steps: [
                { action: 'move', count: 2, from: 'sheep', to: 'gold#2' },
                { action: 'move', count: 1, from: 'berry', to: 'gold#2' },
            ],
        } as unknown as BuildOrder
        expect(runRefs(order)).toEqual(['sheep', 'berry', 'deer', 'boar', 'gold', 'gold#2', 'gold#3', 'stone'])
    })

    it('picks deposits up from each step node field and ignores strings that are not finite refs', () => {
        const step = (fields: object) => ({ civ: 'english', name: 'x', steps: [fields] }) as unknown as BuildOrder
        expect(runRefs({ civ: 'english', name: 'x', start: { rally: 'gold#3' }, steps: [] } as unknown as BuildOrder)).toContain('gold#3')
        expect(runRefs(step({ action: 'produce', producer: 'p', unit: 'villager', rally: 'gold#4' }))).toContain('gold#4')
        expect(runRefs(step({ action: 'rally', producer: 'p', to: 'gold#5' }))).toContain('gold#5')
        expect(runRefs(step({ action: 'build', building: 'house', from: 'gold#6' }))).toContain('gold#6')
        expect(runRefs(step({ action: 'build', building: 'house', from: 'wood', then: 'gold#7' }))).toContain('gold#7')
        expect(runRefs(step({ action: 'move', count: 1, from: 'gold#8', to: 'wood' }))).toContain('gold#8')
        expect(runRefs(step({ action: 'move', count: 1, from: 'gold#9', to: 'farm' }))).toEqual(FINITE_GATHER_NODES)
    })
})

describe('createNodeStock and isDepleted', () => {
    it('treats a ref starting at 0 as depleted at once and records it only through recordRunOut', () => {
        const stock = emptyRef('berry')
        expect(isDepleted(stock, 'berry')).toBe(true)
        expect(depletionResults(stock).warnings).toEqual([])

        recordRunOut(stock, 'berry', 0, 0)
        const { depletions, warnings } = depletionResults(stock)
        expect(depletions).toEqual([{ node: 'berry', amount: 0, depletedAt: 0 }])
        expect(warnings).toMatchObject([{ code: 'node-depleted', node: 'berry', at: 0 }])
    })

    it('is false for an infinite ref, a stocked ref and a ref not in the stock', () => {
        const stock = stockOf({ gold: null, berry: 5 })
        expect(isDepleted(stock, 'gold')).toBe(false)
        expect(isDepleted(stock, 'berry')).toBe(false)
        expect(isDepleted(stock, 'stone')).toBe(false)
    })
})

describe('drawDown', () => {
    it('never takes a ref below 0 and returns only what was there', () => {
        const stock = stockOf({ berry: 20 })
        expect(drawDown(stock, { berry: 10 }, rateOne, 5)).toEqual({ berry: 20 })
        expect(stock.get('berry').remaining).toBe(0)
        expect(isDepleted(stock, 'berry')).toBe(true)
    })

    it('snaps a remainder within RESOURCE_TOLERANCE to exactly 0', () => {
        const stock = stockOf({ berry: 20 })
        drawDown(stock, { berry: 1 }, rateOne, 20 - RESOURCE_TOLERANCE / 2)
        expect(stock.get('berry').remaining).toBe(0)

        const above = stockOf({ berry: 20 })
        drawDown(above, { berry: 1 }, rateOne, 20 - RESOURCE_TOLERANCE * 4)
        expect(above.get('berry').remaining).toBeGreaterThan(0)
    })

    it('draws gatherers x rate x seconds from a ref with stock left', () => {
        const stock = stockOf({ sheep: 100 })
        expect(drawDown(stock, { sheep: 3 }, () => 2, 4)).toEqual({ sheep: 24 })
        expect(stock.get('sheep').remaining).toBe(76)
    })

    it('draws nothing from an infinite or depleted ref and draws deposits independently', () => {
        const stock = stockOf({ gold: 50, 'gold#2': 50, berry: null, stone: 0 })
        const drawn = drawDown(stock, { gold: 0, 'gold#2': 2, berry: 4, stone: 4 }, rateOne, 5)
        expect(drawn).toEqual({ 'gold#2': 10 })
        expect(stock.get('gold').remaining).toBe(50)
        expect(stock.get('gold#2').remaining).toBe(40)
        expect(stock.get('berry').remaining).toBeNull()
        expect(stock.get('stone').remaining).toBe(0)
    })
})

describe('nextRunOut', () => {
    it('returns the earliest exact run-out among refs that are being drawn', () => {
        const stock = stockOf({ sheep: 90, gold: 100, 'gold#2': 10, berry: null, stone: 0, deer: 5 })
        const gatherers = { sheep: 3, gold: 2, 'gold#2': 0, berry: 5, stone: 5, deer: 4 }
        const rates: Partial<Record<FiniteNodeRef, number>> = { sheep: 1, gold: 4, deer: 0 }
        expect(nextRunOut(stock, gatherers, (ref) => rates[ref] ?? 1, 100)).toBe(100 + 100 / 8)
    })

    it('returns null when no ref qualifies', () => {
        const stock = stockOf({ gold: 10, berry: null, stone: 0 })
        expect(nextRunOut(stock, { gold: 0, berry: 3, stone: 3 }, rateOne, 0)).toBeNull()
    })
})

describe('recordRunOut', () => {
    it('keeps the first record for a depleted ref', () => {
        const stock = emptyRef('gold')
        recordRunOut(stock, 'gold', 550, 4)
        recordRunOut(stock, 'gold', 600, 0)
        expect(depletionResults(stock).warnings).toMatchObject([{ code: 'node-depleted', at: 550, idleVillagers: 4 }])
        expect(depletionResults(stock).depletions).toEqual([{ node: 'gold', amount: 0, depletedAt: 550 }])
    })

    it('ignores a ref not in the stock and a ref still stocked', () => {
        const stock = stockOf({ gold: 10 })
        recordRunOut(stock, 'gold', 5, 1)
        recordRunOut(stock, 'berry', 5, 1)
        expect(depletionResults(stock)).toEqual({ depletions: [{ node: 'gold', amount: 10, depletedAt: null }], warnings: [] })
    })
})

describe('recordIdleArrival', () => {
    it('keeps the first arrival time and adds up every count', () => {
        const stock = emptyRef('berry')
        recordIdleArrival(stock, 'berry', 310, 2)
        recordIdleArrival(stock, 'berry', 400, 1)
        expect(depletionResults(stock).warnings).toEqual([
            { code: 'idle-arrival', severity: 'warning', message: '3 villagers arrived at depleted berry from 5:10 on and are idle.', node: 'berry', at: 310, idleVillagers: 3 },
        ])
    })

    it('ignores a count of 0, a stocked ref and a ref not in the stock', () => {
        const stock = stockOf({ berry: 0, gold: 10 })
        recordIdleArrival(stock, 'berry', 10, 0)
        recordIdleArrival(stock, 'gold', 10, 2)
        recordIdleArrival(stock, 'stone', 10, 2)
        expect(depletionResults(stock).warnings).toEqual([])
    })
})

describe('depletionResults', () => {
    it('lists every stock ref in FINITE_NODE_REFS order with its starting amount', () => {
        const stock = stockOf({ stone: 5, 'gold#2': 7, sheep: null, gold: 0 }, ['stone', 'gold#2', 'sheep', 'gold'])
        recordRunOut(stock, 'gold', 12, 0)
        expect(depletionResults(stock).depletions).toEqual([
            { node: 'sheep', amount: null, depletedAt: null },
            { node: 'gold', amount: 0, depletedAt: 12 },
            { node: 'gold#2', amount: 7, depletedAt: null },
            { node: 'stone', amount: 5, depletedAt: null },
        ])
    })

    it('words run-outs by id and sets warning severity only when villagers are left idle', () => {
        const stock = stockOf({ 'gold#2': 0, gold: 0, sheep: 0 })
        recordRunOut(stock, 'gold#2', 1115, 6)
        recordRunOut(stock, 'gold', 550, 0)
        recordRunOut(stock, 'sheep', 550, 1)
        const { warnings } = depletionResults(stock)
        expect(warnings.map(({ severity, message }) => [severity, message])).toEqual([
            ['warning', 'sheep ran out at 9:10; 1 villager is idle there.'],
            ['info', 'gold ran out at 9:10; no villagers were left idle.'],
            ['warning', 'gold#2 ran out at 18:35; 6 villagers are idle there.'],
        ])
        expect(warnings.map((w) => w.severity)).not.toContain('error')
    })

    it('returns its warnings sorted by at', () => {
        const stock = stockOf({ berry: 0, stone: 0 })
        recordRunOut(stock, 'berry', 500, 0)
        recordRunOut(stock, 'stone', 100, 0)
        recordIdleArrival(stock, 'berry', 50, 1)
        expect(depletionResults(stock).warnings).toMatchObject([
            { code: 'idle-arrival', node: 'berry', at: 50 },
            { code: 'node-depleted', node: 'stone', at: 100 },
            { code: 'node-depleted', node: 'berry', at: 500 },
        ])
    })
})

describe('sortWarnings', () => {
    const node = (code: 'node-depleted' | 'idle-arrival', ref: FiniteNodeRef, at: number): SimWarning => ({ code, severity: 'warning', message: '', node: ref, at, idleVillagers: 1 })
    const stuck = (step: number, at: number): SimWarning => ({ code: 'step-stuck', severity: 'warning', message: '', step, waitingOn: 'resources', at })
    const sorted = [
        node('node-depleted', 'stone', 5),
        node('idle-arrival', 'sheep', 10),
        node('node-depleted', 'berry', 10),
        node('node-depleted', 'deer', 10),
        node('idle-arrival', 'boar', 10),
        node('node-depleted', 'gold', 10),
        node('idle-arrival', 'gold', 10),
        node('node-depleted', 'gold#2', 10),
        node('node-depleted', 'stone', 10),
        stuck(1, 10),
        stuck(4, 10),
        node('node-depleted', 'berry', 11),
    ]
    const shuffled = [9, 3, 11, 7, 0, 10, 5, 1, 8, 2, 6, 4].map((i) => sorted[i])

    it('orders by at, then node warnings by ref and code, then step-stuck by step', () => {
        expect(sortWarnings(shuffled)).toEqual(sorted)
    })

    it('returns a new array, leaves its input alone and is idempotent', () => {
        const input = [...shuffled]
        const once = sortWarnings(input)
        expect(input).toEqual(shuffled)
        expect(once).not.toBe(input)
        expect(sortWarnings(once)).toEqual(once)
    })
})
