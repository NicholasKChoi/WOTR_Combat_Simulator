import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import { type PinnedSeries, toChartRows } from './chart-rows'
import type { TimeWindow } from './chart-zoom'
import { loadGameData } from '../../../lib/aoe4-build-order/data'
import { type TierTextBounds, type TierTextDot, type TierTextSlot, boxesIntersect, buildingSeries, gatherRatesSeries, placeTierText, resourceSeries, tierTextBox, tierTextSlots, unitLineSeries, unitUpgradeDots, unitsProducedSeries, upgradeTierName, visibleUpgradeDots, type UpgradeDot } from './result-series'

function result(): SimulationResult {
    return {
        civ: 'english',
        durationSeconds: 10,
        sampleSeconds: 5,
        times: [0, 5, 10],
        unitsProduced: [
            { unitId: 'spearman-2', baseId: 'spearman', name: 'Spearman', lineName: 'Spearman', tier: 2, counts: [0, 1, 2] },
            { unitId: 'spearman-3', baseId: 'spearman', name: 'Spearman', lineName: 'Spearman', tier: 3, counts: [0, 0, 4] },
        ],
        productionBuildings: [{ baseId: 'barracks', name: 'Barracks', counts: [0, 1, 1] }],
        gatherRates: { food: [1, 2, 3], wood: [4, 5, 6], gold: [7, 8, 9], stone: [10, 11, 12] },
        gatherers: { food: [1, 1, 1], wood: [2, 2, 2], gold: [0, 1, 0], stone: [0, 0, 0] },
        floating: { stone: [0, 0, 1], gold: [0, 2, 0], wood: [3, 0, 0], food: [5, 6, 7] },
        gathered: { food: [0, 1, 2], wood: [0, 1, 2], gold: [0, 1, 2], stone: [0, 1, 2] },
        spent: { villagers: [0, 0, 0], military: [0, 0, 0], buildings: [0, 0, 0], research: [0, 0, 0] },
        spawnedPopulation: [0, 0, 0],
        populationCapReachedAt: null,
        steps: [],
        ages: [{ age: 1, reachedAt: 0 }],
        notes: [],
        depletions: [],
        warnings: [],
        markers: [],
    }
}

describe('unitLineSeries', () => {
    const lines = (): SimulationResult => ({
        ...result(),
        unitsProduced: [
            { unitId: 'spearman-3', baseId: 'spearman', name: 'Veteran Spearman', lineName: 'Spearman', tier: 3, counts: [0, 1, 2] },
            { unitId: 'longbowman-2', baseId: 'longbowman', name: 'Longbowman', lineName: 'Longbowman', tier: 2, counts: [0, 3, 3] },
            { unitId: 'longbowman-3', baseId: 'longbowman', name: 'Veteran Longbowman', lineName: 'Longbowman', tier: 3, counts: [0, 0, 5] },
        ],
    })

    it('draws one series per baseId in order of first appearance, named by lineName, with the tiers summed per sample', () => {
        expect(unitLineSeries(lines())).toEqual([
            { key: 'spearman', name: 'Spearman', values: [0, 1, 2] },
            { key: 'longbowman', name: 'Longbowman', values: [0, 3, 8] },
        ])
    })

    it('aligns the summed values with times', () => {
        const input = result()
        expect(toChartRows(input.times, unitLineSeries(input))).toEqual([
            { t: 0, spearman: 0 },
            { t: 5, spearman: 1 },
            { t: 10, spearman: 6 },
        ])
    })

    it('returns no series when no unit was produced', () => {
        expect(unitLineSeries({ ...result(), unitsProduced: [] })).toEqual([])
    })

    it('does not mutate the result', () => {
        const input = lines()
        const before = structuredClone(input)
        unitLineSeries(input)
        expect(input).toEqual(before)
    })
})

describe('unitUpgradeDots', () => {
    const run = (markers: ChartMarker[]): SimulationResult => ({ ...result(), markers })

    it('gives one dot per marker whose unit the run produced, in marker order, two for two upgrades of one line', () => {
        const dots = unitUpgradeDots(
            run([
                { kind: 'unit-tier', label: 'veteran-spearmen', at: 40, unit: 'spearman' },
                { kind: 'unit-tier', label: 'elite-spearmen', at: 20, unit: 'spearman' },
            ]),
        )
        expect(dots).toEqual([
            { key: 'spearman', label: 'veteran-spearmen', at: 40 },
            { key: 'spearman', label: 'elite-spearmen', at: 20 },
        ])
    })

    it('drops a marker whose line the run never produced, and markers without a unit including age-ups', () => {
        const dots = unitUpgradeDots(
            run([
                { kind: 'unit-tier', label: 'veteran-longbowmen', at: 10, unit: 'longbowman' },
                { kind: 'age-up', label: 'Feudal Age', at: 30 },
                { kind: 'economy', label: 'wheelbarrow', at: 50 },
            ]),
        )
        expect(dots).toEqual([])
    })

    it('judges each run by its own lines', () => {
        const marker: ChartMarker = { kind: 'unit-tier', label: 'veteran-longbowmen', at: 10, unit: 'longbowman' }
        const other: SimulationResult = {
            ...run([marker]),
            unitsProduced: [{ unitId: 'longbowman-2', baseId: 'longbowman', name: 'Longbowman', lineName: 'Longbowman', tier: 2, counts: [0, 1, 1] }],
        }
        expect(unitUpgradeDots(run([marker]))).toEqual([])
        expect(unitUpgradeDots(other)).toEqual([{ key: 'longbowman', label: 'veteran-longbowmen', at: 10 }])
    })
})

describe('visibleUpgradeDots', () => {
    const drawn: PinnedSeries = {
        times: [0, 4, 8],
        series: [
            { key: 'spearman', name: 'Spearman', values: [0, 2, 6] },
            { key: 'archer', name: 'Archer', values: [1, 1, 1] },
        ],
    }
    const whole: TimeWindow = { from: 0, to: 8 }
    const none = new Set<string>()
    const dot = (key: string, at: number, label = 'upgrade'): UpgradeDot => ({ key, label, at })

    it('keeps several dots of one line in input order, with the value from valueAt', () => {
        expect(visibleUpgradeDots([dot('spearman', 6, 'b'), dot('spearman', 4, 'a')], drawn, whole, none)).toEqual([
            { key: 'spearman', label: 'b', at: 6, value: 4 },
            { key: 'spearman', label: 'a', at: 4, value: 2 },
        ])
    })

    it('keeps two dots at one instant', () => {
        expect(visibleUpgradeDots([dot('spearman', 4, 'a'), dot('spearman', 4, 'b')], drawn, whole, none).map((d) => [d.label, d.at, d.value])).toEqual([
            ['a', 4, 2],
            ['b', 4, 2],
        ])
    })

    it('drops a dot whose key the run has no series for, and keeps a line only this run has', () => {
        const dots = [dot('longbowman', 4), dot('archer', 4)]
        expect(visibleUpgradeDots(dots, drawn, whole, none).map((d) => d.key)).toEqual(['archer'])
        expect(visibleUpgradeDots(dots, { times: [0, 8], series: [{ key: 'longbowman', name: 'L', values: [0, 8] }] }, whole, none)).toEqual([
            { key: 'longbowman', label: 'upgrade', at: 4, value: 4 },
        ])
    })

    it('drops a dot of a hidden key and keeps the others', () => {
        expect(visibleUpgradeDots([dot('spearman', 4), dot('archer', 4)], drawn, whole, new Set(['spearman'])).map((d) => d.key)).toEqual(['archer'])
    })

    it('keeps dots exactly on the window edges and drops dots just outside', () => {
        const shown: TimeWindow = { from: 2, to: 6 }
        const dots = [dot('archer', 1.9, 'before'), dot('archer', 2, 'from'), dot('archer', 6, 'to'), dot('archer', 6.1, 'after')]
        expect(visibleUpgradeDots(dots, drawn, shown, none).map((d) => d.label)).toEqual(['from', 'to'])
    })

    it('puts a dot between samples on the interpolated line, not at the previous sample', () => {
        const [placed] = visibleUpgradeDots([dot('spearman', 6)], drawn, whole, none)
        expect(placed.value).toBe(4)
        expect(drawn.series[0].values).not.toContain(4)
    })
})

describe('upgradeTierName', () => {
    const { upgradeTargets } = loadGameData('english')

    it.each([...upgradeTargets].map(([id, target]) => [id, target.value]))('names %s on the %s line from the ids alone', (id, unit) => {
        const name = upgradeTierName(id, unit)
        if (id.split('-').length > unit.split('-').length) {
            expect(name).not.toContain('-')
            expect(name).toMatch(/^[A-Z]/)
            expect(name.toLowerCase()).toBe(id.split('-')[0])
            expect(name.length).toBeLessThan(id.length)
        } else {
            expect(name).toBe('Upgrade')
        }
    })

    it('tells a veteran id from an elite id', () => {
        expect(upgradeTierName('veteran-longbowmen', 'longbowman')).toBe('Veteran')
        expect(upgradeTierName('elite-longbowmen', 'longbowman')).toBe('Elite')
    })

    it.each([
        ['early-men-at-arms', 'Early'],
        ['men-at-arms', 'Upgrade'],
        ['elite-men-at-arms', 'Elite'],
    ])('names %s on the man-at-arms line %s', (id, expected) => {
        expect(upgradeTierName(id, 'man-at-arms')).toBe(expected)
    })

    it('works for an id and unit no data lists', () => {
        expect(upgradeTierName('mighty-widgets', 'widget')).toBe('Mighty')
    })
})

const TIER_BOUNDS: TierTextBounds = { left: 100, top: 20, right: 500, bottom: 380 }
const TIER_HEIGHT = 14
const tierDot = (cx: number, cy: number, width = 56, r = 4): TierTextDot => ({ cx, cy, r, width })
const alone = (dot: TierTextDot): TierTextSlot => ({ slot: 0, slots: 1, centre: dot.cy })

const tierBox = (dot: TierTextDot, slot: TierTextSlot) => tierTextBox(dot, slot, TIER_HEIGHT, TIER_BOUNDS)

describe('tierTextSlots', () => {
    it.each([
        ['two dots a few pixels apart', [tierDot(300, 200, 40), tierDot(306, 196)]],
        ['a ring and a dot at one point', [tierDot(300, 200, 56, 5), tierDot(300, 200)]],
        ['three texts where moving the first two apart pushes one into the third', [tierDot(300, 200), tierDot(302, 200), tierDot(304, 214)]],
        ['two close dots near the right edge', [tierDot(480, 200), tierDot(484, 203)]],
        ['two close dots near the top edge', [tierDot(300, 22), tierDot(303, 24)]],
        ['two close dots near the bottom edge', [tierDot(300, 378), tierDot(303, 376)]],
    ])('places the texts of %s inside the plot, clear of each other and of their own dots', (_name, dots) => {
        expect(boxesIntersect(tierBox(dots[0], alone(dots[0])), tierBox(dots[1], alone(dots[1]))), 'the first two texts would cover each other if placed alone').toBe(true)
        const boxes = tierTextSlots(dots, TIER_HEIGHT, TIER_BOUNDS).map((slot, i) => tierBox(dots[i], slot))
        boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(boxesIntersect(a, b)).toBe(false)))
        for (const b of boxes) expect(b.left >= TIER_BOUNDS.left && b.right <= TIER_BOUNDS.right && b.top >= TIER_BOUNDS.top && b.bottom <= TIER_BOUNDS.bottom).toBe(true)
        dots.forEach((d, i) => expect(d.cx >= boxes[i].left && d.cx <= boxes[i].right && d.cy >= boxes[i].top && d.cy <= boxes[i].bottom).toBe(false))
    })

    it('leaves texts that would not touch alone beside their own dots', () => {
        const dots = [tierDot(300, 200), tierDot(300, 260), tierDot(420, 200)]
        expect(tierTextSlots(dots, TIER_HEIGHT, TIER_BOUNDS)).toEqual(dots.map(alone))
    })

    it('stacks a group with the higher dot text on top, around the dots mean height', () => {
        const dots = [tierDot(306, 204), tierDot(300, 196)]
        expect(tierTextSlots(dots, TIER_HEIGHT, TIER_BOUNDS)).toEqual([
            { slot: 1, slots: 2, centre: 200 },
            { slot: 0, slots: 2, centre: 200 },
        ])
    })
})

describe('placeTierText', () => {
    it('puts a lone text to the right of its dot, centred on the dot, clear of the dot', () => {
        const dot = tierDot(300, 200)
        expect(placeTierText(dot, alone(dot), TIER_HEIGHT, TIER_BOUNDS)).toEqual({ x: 300 + 4 + 3, y: 200, anchor: 'start' })
    })

    it('flips a text that would cross the right edge to the dot left', () => {
        const dot = tierDot(480, 200)
        expect(placeTierText(dot, alone(dot), TIER_HEIGHT, TIER_BOUNDS)).toEqual({ x: 480 - 4 - 3, y: 200, anchor: 'end' })
    })

    it('stacks the rows of a group around its centre', () => {
        const dot = tierDot(300, 200)
        expect([0, 1].map((slot) => placeTierText(dot, { slot, slots: 2, centre: 200 }, TIER_HEIGHT, TIER_BOUNDS).y)).toEqual([193, 207])
    })

    it.each([
        ['top', 22, 2, TIER_BOUNDS.top + 7],
        ['bottom', 378, 2, TIER_BOUNDS.bottom - 21],
    ])('moves a stack near the %s edge inside it as a whole', (_edge, centre, slots, firstY) => {
        const dot = tierDot(300, centre)
        expect(placeTierText(dot, { slot: 0, slots, centre }, TIER_HEIGHT, TIER_BOUNDS).y).toBe(firstY)
    })
})

describe('resourceSeries', () => {
    it('gives food, wood, gold, stone in that order whatever the key order of the input', () => {
        const series = resourceSeries(result().floating)
        expect(series.map((s) => s.key)).toEqual(['food', 'wood', 'gold', 'stone'])
        expect(series.map((s) => s.name)).toEqual(['Food', 'Wood', 'Gold', 'Stone'])
    })

    it('uses each resource array as its values', () => {
        const input = result()
        expect(resourceSeries(input.gatherRates).map((s) => s.values)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]])
        expect(resourceSeries(input.floating).map((s) => s.values)).toEqual([[5, 6, 7], [3, 0, 0], [0, 2, 0], [0, 0, 1]])
    })

    it('does not mutate the input', () => {
        const input = result().gatherRates
        const before = structuredClone(input)
        resourceSeries(input)
        expect(input).toEqual(before)
    })
})

describe('buildingSeries', () => {
    it('maps baseId to key, name and counts to values, in the result order', () => {
        const input = {
            ...result(),
            productionBuildings: [
                { baseId: 'town-center', name: 'Town Center', counts: [1, 1, 2] },
                { baseId: 'barracks', name: 'Barracks', counts: [0, 1, 1] },
            ],
        }
        expect(buildingSeries(input)).toEqual([
            { key: 'town-center', name: 'Town Center', values: [1, 1, 2] },
            { key: 'barracks', name: 'Barracks', values: [0, 1, 1] },
        ])
    })

    it('returns no series for a run without production buildings', () => {
        expect(buildingSeries({ ...result(), productionBuildings: [] })).toEqual([])
    })
})

describe('gatherRatesSeries', () => {
    const input = result()

    it('plots gatherRates in the rate view and gatherers in the villagers view, per resource', () => {
        expect(input.gatherers).not.toEqual(input.gatherRates)
        expect(gatherRatesSeries('rate', input)).toEqual(resourceSeries(input.gatherRates))
        expect(gatherRatesSeries('villagers', input)).toEqual(resourceSeries(input.gatherers))
        expect(gatherRatesSeries('villagers', input).map((s) => s.values)).toEqual([[1, 1, 1], [2, 2, 2], [0, 1, 0], [0, 0, 0]])
    })

    it('reads only the run it is given, so a pinned run keeps its own gatherers', () => {
        const pinned: SimulationResult = { ...result(), gatherers: { ...input.gatherers, food: [4, 0, 3] } }
        const rows = toChartRows(input.times, gatherRatesSeries('villagers', input), {
            times: pinned.times,
            series: gatherRatesSeries('villagers', pinned),
        })
        expect(rows.map((r) => r.food)).toEqual([1, 1, 1])
        expect(rows.map((r) => r['pinned:food'])).toEqual([4, 0, 3])
    })
})

describe('unitsProducedSeries', () => {
    const input = result()

    it('plots unitLineSeries in the units view and buildingSeries in the buildings view', () => {
        expect(input.productionBuildings.length).toBeGreaterThan(0)
        expect(unitsProducedSeries('units', input)).toEqual(unitLineSeries(input))
        expect(unitsProducedSeries('buildings', input)).toEqual(buildingSeries(input))
        expect(unitsProducedSeries('buildings', input).map((s) => s.key)).toEqual(['barracks'])
    })

    it('reads only the run it is given', () => {
        const other: SimulationResult = { ...result(), productionBuildings: [{ baseId: 'stable', name: 'Stable', counts: [0, 0, 1] }] }
        expect(unitsProducedSeries('buildings', other).map((s) => s.key)).toEqual(['stable'])
    })
})
