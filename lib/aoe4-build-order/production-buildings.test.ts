import { describe, expect, it } from 'vitest'
import type { GameData, SnapshotEntry } from './data'
import { productionBuildingIds, productionBuildingSeries } from './production-buildings'
import { ENGLISH, editGameData } from './test-helpers'
import type { Parts } from './test-helpers'

const unitEntries = (data: GameData): SnapshotEntry[] => [...data.byId.values()].filter((entry) => entry.type === 'unit')

function addProducer(parts: Parts, baseId: string, unitBaseId: string): void {
    parts.snapshot.units.filter((unit) => unit.baseId === unitBaseId).forEach((unit) => unit.producedBy.push(baseId))
}

// A building "Z-yard" that spearmen list after barracks: code-unit order puts it before "barracks", locale order after.
const withYard = editGameData((parts) => {
    const barracks = parts.snapshot.buildings.find((entry) => entry.baseId === 'barracks')!
    parts.snapshot.buildings.push({ ...structuredClone(barracks), id: 'Z-yard-1', baseId: 'Z-yard', name: 'Yard' })
    addProducer(parts, 'Z-yard', 'spearman')
})

describe('productionBuildingIds', () => {
    const ids = productionBuildingIds(ENGLISH)

    it('holds the English producers, not house and not the producedBy ids with no building entry', () => {
        const listed = new Set(unitEntries(ENGLISH).flatMap((unit) => unit.producedBy))
        const unbuilt = [...listed].filter((id) => !ENGLISH.byBaseId.get(id)?.some((entry) => entry.type === 'building'))
        expect(unbuilt).toContain('wynguard-footmen')
        expect(ENGLISH.byBaseId.get('house')?.[0].type).toBe('building')
        expect(['capital-town-center', 'town-center', 'barracks'].map((id) => ids.has(id))).toEqual([true, true, true])
        expect(ids.has('house')).toBe(false)
        expect(unbuilt.filter((id) => ids.has(id))).toEqual([])
    })

    it('holds only building baseIds that a unit entry lists in producedBy', () => {
        expect(ids.size).toBeGreaterThan(1)
        for (const id of ids) {
            expect(ENGLISH.byBaseId.get(id)?.some((entry) => entry.type === 'building')).toBe(true)
            expect(unitEntries(ENGLISH).some((unit) => unit.producedBy.includes(id))).toBe(true)
        }
    })

    it('follows the data: a building a unit lists in producedBy joins the set', () => {
        expect(ids.has('house')).toBe(false)
        const housed = editGameData((parts) => addProducer(parts, 'house', 'spearman'))
        expect(productionBuildingIds(housed).has('house')).toBe(true)
    })
})

describe('productionBuildingSeries', () => {
    const counted = (entries: [string, number][]) => new Map(entries)

    it('keeps one series per production building with a completed instance, with one count per sample', () => {
        const samples = [counted([['capital-town-center', 1], ['house', 2]]), counted([['capital-town-center', 1], ['house', 3], ['barracks', 1]])]
        expect(productionBuildingSeries(ENGLISH, samples)).toEqual([
            { baseId: 'capital-town-center', name: 'Capital Town Center', counts: [1, 1] },
            { baseId: 'barracks', name: 'Barracks', counts: [0, 1] },
        ])
    })

    it('gives a never-completed production building no series', () => {
        expect(productionBuildingIds(ENGLISH).has('dock')).toBe(true)
        const samples = [counted([['capital-town-center', 1], ['dock', 0]]), counted([['capital-town-center', 1]])]
        expect(productionBuildingSeries(ENGLISH, samples).map((s) => s.baseId)).toEqual(['capital-town-center'])
    })

    it('keeps capital-town-center and town-center as two series with their own names', () => {
        const samples = [counted([['capital-town-center', 1], ['town-center', 1]])]
        expect(productionBuildingSeries(ENGLISH, samples).map((s) => [s.baseId, s.name])).toEqual([
            ['capital-town-center', 'Capital Town Center'],
            ['town-center', 'Town Center'],
        ])
    })

    it('names a baseId with several age tiers by its lowest-age building entry, in one series', () => {
        const tiered = editGameData((parts) => {
            const barracks = parts.snapshot.buildings.find((entry) => entry.baseId === 'barracks')!
            parts.snapshot.buildings.unshift({ ...structuredClone(barracks), id: 'barracks-2', age: 2, name: 'Grand Barracks' })
        })
        expect(tiered.byBaseId.get('barracks')!.map((entry) => entry.name)).toEqual(['Barracks', 'Grand Barracks'])
        expect(productionBuildingSeries(tiered, [counted([['barracks', 2]])])).toEqual([{ baseId: 'barracks', name: 'Barracks', counts: [2] }])
    })

    it('sorts by first sample with a count, then by baseId in code-unit order', () => {
        const ids = [...productionBuildingIds(withYard)]
        expect(ids.indexOf('barracks')).toBeLessThan(ids.indexOf('Z-yard'))
        const samples = [
            counted([['town-center', 1]]),
            counted([['town-center', 1], ['barracks', 1], ['Z-yard', 1]]),
            counted([['archery-range', 1], ['Z-yard', 1], ['barracks', 1], ['town-center', 2]]),
        ]
        expect(productionBuildingSeries(withYard, samples).map((s) => s.baseId)).toEqual(['town-center', 'Z-yard', 'barracks', 'archery-range'])
    })
})
