import { describe, expect, it } from 'vitest'
import type { SnapshotEntry } from './data'
import { ageMarker, compareMarkers, researchMarker, researchMarkerKind } from './markers'
import { AGE_NAMES, CHART_MARKER_KINDS } from './model'
import type { BuildStart, BuildStep, ChartMarker, SimulationResult } from './model'
import { ENGLISH, at, editGameData, run } from './test-helpers'
import type { Parts } from './test-helpers'

function entryOf(baseId: string): SnapshotEntry {
    const entry = ENGLISH.byBaseId.get(baseId)?.[0]
    if (!entry) {
        throw new Error(`no entry ${baseId}`)
    }
    return entry
}

function handBuilt(overrides: Partial<SnapshotEntry>): SnapshotEntry {
    return { ...entryOf('textiles'), classes: [], producedBy: [], type: 'technology', ...overrides }
}

describe('researchMarkerKind', () => {
    it.each([
        ['economy', ['wheelbarrow', 'double-broadax', 'horticulture']],
        ['unit-tier', ['veteran-longbowmen', 'men-at-arms', 'elite-knights-or-lancers']],
        ['blacksmith', ['steeled-arrow', 'bloomery', 'military-academy']],
        ['other', ['textiles', 'professional-scouts', 'arrow-volley']],
    ])('classifies the shipped %s techs', (kind, baseIds) => {
        expect(baseIds.map((baseId) => researchMarkerKind(entryOf(baseId)))).toEqual(baseIds.map(() => kind))
    })

    it('checks economy before unit-tier before blacksmith', () => {
        expect(researchMarkerKind(handBuilt({ classes: ['economic_upgrade'], producedBy: ['blacksmith'] }))).toBe('economy')
        expect(researchMarkerKind(handBuilt({ type: 'upgrade', classes: ['economic_upgrade'] }))).toBe('economy')
        expect(researchMarkerKind(handBuilt({ type: 'upgrade', producedBy: ['blacksmith'] }))).toBe('unit-tier')
        expect(researchMarkerKind(handBuilt({ classes: ['scar_unit_upgrade'], producedBy: ['blacksmith'] }))).toBe('unit-tier')
        expect(researchMarkerKind(handBuilt({ producedBy: ['blacksmith'] }))).toBe('blacksmith')
        expect(researchMarkerKind(handBuilt({}))).toBe('other')
    })
})

describe('marker constructors', () => {
    it('builds research and age markers', () => {
        const entry = entryOf('steeled-arrow')
        expect(researchMarker(entry, 870)).toEqual({ kind: researchMarkerKind(entry), label: 'steeled-arrow', at: 870 })
        expect(ageMarker(3, 804)).toEqual({ kind: 'age-up', label: 'Castle', at: 804 })
        expect(AGE_NAMES).toEqual({ 2: 'Feudal', 3: 'Castle', 4: 'Imperial' })
    })
})

describe('compareMarkers', () => {
    const marker = (kind: ChartMarker['kind'], label: string, time: number): ChartMarker => ({ kind, label, at: time })

    it('orders by at, then kind order, then label', () => {
        expect(CHART_MARKER_KINDS).toEqual(['age-up', 'economy', 'unit-tier', 'blacksmith', 'other'])
        const sorted = [marker('other', 'a', 5), marker('economy', 'z', 5), marker('age-up', 'Feudal', 5), marker('other', 'b', 1), marker('economy', 'a', 5)].sort(compareMarkers)
        expect(sorted.map((m) => `${m.at}:${m.kind}:${m.label}`)).toEqual(['1:other:b', '5:age-up:Feudal', '5:economy:a', '5:economy:z', '5:other:a'])
    })
})

const agesData = (edit: (parts: Parts) => void = () => {}) =>
    editGameData((parts) => {
        const start = parts.civData.startingState
        start.buildings.value = ['capital-town-center', 'barracks', 'house', 'house', 'mill']
        start.resources.value = { food: 2000, wood: 2000, gold: 1000, stone: 0 }
        edit(parts)
    })
const sixSheep: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
const noHouses = { autoHouses: false }
const abbey: BuildStep = { action: 'build', building: 'abbey-of-kings', builders: 4, from: 'sheep', trigger: at(0) }
const quick = (parts: Parts, baseIds: string[], seconds: number) => {
    for (const entry of [...parts.snapshot.technologies, ...parts.snapshot.upgrades]) {
        if (baseIds.includes(entry.baseId)) {
            entry.age = 1
            entry.costs.time = seconds
        }
    }
}

function markersOf(steps: BuildStep[], game = agesData(), durationSeconds = 600): SimulationResult {
    return run(steps, { game, start: sixSheep, inputs: { ...noHouses, durationSeconds } })
}

describe('result markers', () => {
    it('marks each age after the start age at its reachedAt, and nothing for the start age', () => {
        const result = markersOf([abbey])
        expect(result.ages.map((a) => a.age)).toEqual([1, 2])
        expect(result.markers).toEqual([{ kind: 'age-up', label: 'Feudal', at: result.ages[1].reachedAt }])
    })

    it('is empty when no age is reached and no research completes', () => {
        expect(markersOf([{ action: 'produce', producer: 'capital-town-center', unit: 'villager' }]).markers).toEqual([])
    })

    it('marks a completed research at its completedAt and none for one still running', () => {
        const game = agesData((parts) => quick(parts, ['wheelbarrow'], 40))
        const done = markersOf([{ action: 'research', tech: 'wheelbarrow', trigger: at(10) }], game)
        expect(done.steps[0].status).toBe('completed')
        expect(done.markers).toEqual([{ kind: 'economy', label: 'wheelbarrow', at: done.steps[0].completedAt }])

        const slow = agesData((parts) => quick(parts, ['wheelbarrow'], 100))
        const running = markersOf([{ action: 'research', tech: 'wheelbarrow', trigger: at(10) }], slow, 60)
        expect(running.steps[0].status).toBe('in-progress')
        expect(running.markers).toEqual([])
    })

    it('marks no landmark still under construction at the horizon', () => {
        const result = markersOf([abbey], agesData(), 60)
        expect(result.steps[0].status).toBe('in-progress')
        expect(result.markers).toEqual([])
    })

    it('keeps an age-up and research completing at the same instant and sorts the age first', () => {
        const probe = markersOf([abbey])
        const ageAt = probe.ages[1].reachedAt
        const game = agesData((parts) => quick(parts, ['wheelbarrow', 'textiles'], ageAt))
        const result = markersOf([
            { action: 'research', tech: 'textiles', at: 'capital-town-center', trigger: at(0) },
            { action: 'research', tech: 'wheelbarrow', trigger: at(0) },
            abbey,
        ], game)
        expect(result.markers.map((m) => [m.kind, m.label, m.at])).toEqual([
            ['age-up', 'Feudal', ageAt],
            ['economy', 'wheelbarrow', ageAt],
            ['other', 'textiles', ageAt],
        ])
    })
})
